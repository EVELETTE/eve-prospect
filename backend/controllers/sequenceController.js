// controllers/sequenceController.js
const Sequence = require('../models/Sequence');
const Notification = require('../models/Notification');
const LinkedInBot = require('../services/LinkedInBot');

const sequenceController = {
    async createSequence(req, res) {
        try {
            const { prospectId, templateId, title, steps } = req.body;

            // Vérifier si une séquence existe déjà pour ce prospect
            const existingSequence = await Sequence.findOne({
                prospectId,
                userId: req.userId,
                status: { $in: ['draft', 'active'] }
            });

            if (existingSequence) {
                return res.status(400).json({
                    success: false,
                    message: 'Une séquence existe déjà pour ce prospect'
                });
            }

            // Calculer les dates prévues pour chaque étape
            const scheduledSteps = steps.map(step => ({
                ...step,
                scheduledDate: new Date(Date.now() + step.delay * 24 * 60 * 60 * 1000)
            }));

            const sequence = new Sequence({
                prospectId,
                userId: req.userId,
                templateId,
                title,
                steps: scheduledSteps,
                status: 'draft'
            });

            await sequence.save();

            // Créer une notification
            await new Notification({
                userId: req.userId,
                title: 'Nouvelle séquence créée',
                message: `La séquence "${title}" a été créée avec succès.`,
                type: 'success'
            }).save();

            res.json({
                success: true,
                sequence
            });

        } catch (error) {
            console.error('Erreur création séquence:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de la séquence'
            });
        }
    },

    async startSequence(req, res) {
        try {
            const { sequenceId } = req.params;
            const sequence = await Sequence.findOne({
                _id: sequenceId,
                userId: req.userId
            });

            if (!sequence) {
                return res.status(404).json({
                    success: false,
                    message: 'Séquence non trouvée'
                });
            }

            sequence.status = 'active';
            sequence.nextExecutionDate = sequence.steps[0].scheduledDate;
            await sequence.save();

            res.json({
                success: true,
                message: 'Séquence démarrée avec succès',
                sequence
            });

        } catch (error) {
            console.error('Erreur démarrage séquence:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du démarrage de la séquence'
            });
        }
    },

    async pauseSequence(req, res) {
        try {
            const sequence = await Sequence.findOneAndUpdate(
                { _id: req.params.sequenceId, userId: req.userId },
                { status: 'paused' },
                { new: true }
            );

            if (!sequence) {
                return res.status(404).json({
                    success: false,
                    message: 'Séquence non trouvée'
                });
            }

            res.json({
                success: true,
                message: 'Séquence mise en pause',
                sequence
            });

        } catch (error) {
            console.error('Erreur pause séquence:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise en pause de la séquence'
            });
        }
    },

    async resumeSequence(req, res) {
        try {
            const sequence = await Sequence.findOneAndUpdate(
                { _id: req.params.sequenceId, userId: req.userId },
                { status: 'active' },
                { new: true }
            );

            if (!sequence) {
                return res.status(404).json({
                    success: false,
                    message: 'Séquence non trouvée'
                });
            }

            res.json({
                success: true,
                message: 'Séquence reprise',
                sequence
            });

        } catch (error) {
            console.error('Erreur reprise séquence:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la reprise de la séquence'
            });
        }
    },

    async deleteSequence(req, res) {
        try {
            const sequence = await Sequence.findOneAndDelete({
                _id: req.params.sequenceId,
                userId: req.userId
            });

            if (!sequence) {
                return res.status(404).json({
                    success: false,
                    message: 'Séquence non trouvée'
                });
            }

            res.json({
                success: true,
                message: 'Séquence supprimée'
            });

        } catch (error) {
            console.error('Erreur suppression séquence:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de la séquence'
            });
        }
    },

    async getSequences(req, res) {
        try {
            const { prospectId } = req.query;
            const query = { userId: req.userId };

            if (prospectId) {
                query.prospectId = prospectId;
            }

            const sequences = await Sequence.find(query)
                .sort('-createdAt');

            res.json({
                success: true,
                sequences
            });

        } catch (error) {
            console.error('Erreur récupération séquences:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des séquences'
            });
        }
    },

    async updateSequence(req, res) {
        try {
            const { sequenceId } = req.params;
            const updates = req.body;

            const sequence = await Sequence.findOneAndUpdate(
                { _id: sequenceId, userId: req.userId },
                updates,
                { new: true }
            );

            if (!sequence) {
                return res.status(404).json({
                    success: false,
                    message: 'Séquence non trouvée'
                });
            }

            res.json({
                success: true,
                sequence
            });

        } catch (error) {
            console.error('Erreur mise à jour séquence:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour de la séquence'
            });
        }
    }
};

module.exports = sequenceController;