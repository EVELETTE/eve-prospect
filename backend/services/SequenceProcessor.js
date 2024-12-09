// services/SequenceProcessor.js
const Sequence = require('../models/Sequence');
const LinkedInBot = require('./LinkedInBot');
const Notification = require('../models/Notification');
const User = require('../models/User');

class SequenceProcessor {
    constructor() {
        this.isProcessing = false;
        this.bot = new LinkedInBot();
    }

    async start() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // Récupérer les séquences actives dont la prochaine exécution est due
            const sequences = await Sequence.find({
                status: 'active',
                nextExecutionDate: { $lte: new Date() }
            }).populate('userId');

            for (const sequence of sequences) {
                await this.processSequence(sequence);
            }

        } catch (error) {
            console.error('Erreur traitement séquences:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    async processSequence(sequence) {
        try {
            const currentStep = sequence.steps[sequence.currentStep];
            if (!currentStep || currentStep.status === 'completed') {
                return this.moveToNextStep(sequence);
            }

            if (!this.isWithinWorkingHours(sequence)) {
                return this.rescheduleForNextWorkingHour(sequence);
            }

            const user = await User.findById(sequence.userId);
            if (!user || !user.linkedinCredentials?.email) {
                throw new Error('Informations de connexion LinkedIn manquantes');
            }

            await this.bot.initialize(sequence._id.toString());
            await this.bot.login(
                user.linkedinCredentials.email,
                user.linkedinCredentials.password
            );

            switch (currentStep.type) {
                case 'connection':
                    await this.handleConnection(sequence, currentStep);
                    break;
                case 'message':
                    await this.handleMessage(sequence, currentStep);
                    break;
                default:
                    throw new Error(`Type d'action non supporté: ${currentStep.type}`);
            }

            // Mettre à jour les logs et le statut
            currentStep.status = 'completed';
            currentStep.completedDate = new Date();
            sequence.lastExecutionDate = new Date();

            await this.moveToNextStep(sequence);

        } catch (error) {
            await this.handleError(sequence, error);
        } finally {
            await this.bot.close();
        }
    }

    async handleConnection(sequence, step) {
        await this.bot.sendConnectionRequest(
            sequence.prospect.profileLink,
            step.template,
            sequence._id.toString()
        );
    }

    async handleMessage(sequence, step) {
        await this.bot.sendMessage(
            sequence.prospect.profileLink,
            step.template,
            sequence._id.toString()
        );
    }

    async moveToNextStep(sequence) {
        const nextStepIndex = sequence.currentStep + 1;

        if (nextStepIndex >= sequence.steps.length) {
            sequence.status = 'completed';
            await this.createNotification(sequence.userId, {
                title: 'Séquence terminée',
                message: `La séquence ${sequence.title} est terminée avec succès.`,
                type: 'success'
            });
        } else {
            sequence.currentStep = nextStepIndex;
            sequence.nextExecutionDate = sequence.steps[nextStepIndex].scheduledDate;
        }

        await sequence.save();
    }

    async handleError(sequence, error) {
        console.error(`Erreur séquence ${sequence._id}:`, error);

        const step = sequence.steps[sequence.currentStep];
        step.status = 'failed';
        step.error = error.message;

        sequence.executionLogs.push({
            action: step.type,
            status: 'failed',
            message: error.message
        });

        if (this.shouldRetry(sequence)) {
            sequence.nextExecutionDate = new Date(Date.now() + sequence.settings.retryDelay * 60000);
        } else {
            sequence.status = 'failed';
            await this.createNotification(sequence.userId, {
                title: 'Erreur séquence',
                message: `La séquence ${sequence.title} a échoué: ${error.message}`,
                type: 'error'
            });
        }

        await sequence.save();
    }

    shouldRetry(sequence) {
        const currentStep = sequence.steps[sequence.currentStep];
        const failedAttempts = sequence.executionLogs.filter(
            log => log.action === currentStep.type && log.status === 'failed'
        ).length;

        return failedAttempts < sequence.settings.maxRetries;
    }

    isWithinWorkingHours(sequence) {
        const now = new Date();
        const day = now.toLocaleDateString('en-US', { weekday: 'long' });

        if (!sequence.settings.workingDays.includes(day)) {
            return false;
        }

        const currentHour = now.getHours() + now.getMinutes() / 60;
        const [startHour] = sequence.settings.workingHours.start.split(':').map(Number);
        const [endHour] = sequence.settings.workingHours.end.split(':').map(Number);

        return currentHour >= startHour && currentHour <= endHour;
    }

    async rescheduleForNextWorkingHour(sequence) {
        const now = new Date();
        let nextDate = new Date(now);

        // Si hors des heures de travail aujourd'hui, planifier pour demain
        const [startHour] = sequence.settings.workingHours.start.split(':').map(Number);
        if (!this.isWithinWorkingHours(sequence)) {
            nextDate.setDate(nextDate.getDate() + 1);
            nextDate.setHours(startHour, 0, 0, 0);
        }

        // Trouver le prochain jour ouvré
        while (!sequence.settings.workingDays.includes(
            nextDate.toLocaleDateString('en-US', { weekday: 'long' })
        )) {
            nextDate.setDate(nextDate.getDate() + 1);
        }

        sequence.nextExecutionDate = nextDate;
        await sequence.save();
    }

    async createNotification(userId, notification) {
        try {
            await new Notification({
                userId,
                title: notification.title,
                message: notification.message,
                type: notification.type
            }).save();
        } catch (error) {
            console.error('Erreur création notification:', error);
        }
    }

    // Méthode pour démarrer le processeur avec un intervalle
    startProcessing(interval = 60000) { // Par défaut, vérifie toutes les minutes
        setInterval(() => this.start(), interval);
        console.log('Processeur de séquences démarré');
    }
}

// Export d'une instance singleton
const processor = new SequenceProcessor();
module.exports = processor;