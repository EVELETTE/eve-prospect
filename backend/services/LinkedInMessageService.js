const LinkedInBot = require('./LinkedInBot');
const Message = require('../models/Message');
const User = require('../models/User');
const Prospect = require('../models/Prospect');

class LinkedInMessageService {
    constructor() {
        this.bot = null;
    }

    async getMessages(userId, prospectId) {
        try {
            const prospect = await Prospect.findById(prospectId);
            if (!prospect) {
                throw new Error('Prospect non trouvé');
            }

            // Chercher d'abord les messages dans la base de données
            const existingMessages = await Message.find({
                userId,
                prospectId
            }).sort({ timestamp: 1 });

            // Si aucun messages et pas d'URL LinkedIn, retourner tableau vide
            if (!prospect.linkedinProfile && !prospect.linkedin) {
                return existingMessages;
            }

            // Sinon, essayer de récupérer les messages depuis LinkedIn
            try {
                const bot = await this.initBot(userId);
                const linkedInMessages = await bot.getMessages(
                    prospect.linkedinProfile || prospect.linkedin,
                    userId
                );

                // Sauvegarder les nouveaux messages
                await Promise.all(
                    linkedInMessages.map(async msg => {
                        // Vérifier si le message existe déjà
                        const existingMessage = await Message.findOne({
                            userId,
                            prospectId,
                            content: msg.content,
                            timestamp: msg.timestamp
                        });

                        if (!existingMessage) {
                            const message = new Message({
                                userId,
                                prospectId,
                                content: msg.content,
                                direction: msg.direction,
                                timestamp: msg.timestamp || new Date(),
                                status: 'sent'
                            });
                            await message.save();
                        }
                    })
                );

                // Récupérer tous les messages mis à jour
                return await Message.find({
                    userId,
                    prospectId
                }).sort({ timestamp: 1 });

            } catch (error) {
                console.error('Erreur LinkedIn:', error);
                // En cas d'erreur, retourner les messages existants
                return existingMessages;
            }
        } catch (error) {
            console.error('Erreur de récupération des messages:', error);
            throw error;
        }
    }

    async initBot(userId) {
        try {
            const user = await User.findById(userId);
            if (!user?.linkedinCredentials?.email || !user?.linkedinCredentials?.password) {
                throw new Error('Identifiants LinkedIn manquants');
            }

            const bot = new LinkedInBot();
            await bot.initialize(userId);
            await bot.login(
                user.linkedinCredentials.email,
                user.linkedinCredentials.password
            );
            return bot;
        } catch (error) {
            console.error('Erreur initialisation bot:', error);
            throw error;
        }
    }

    async sendMessage(userId, prospectId, content) {
        try {
            const prospect = await Prospect.findById(prospectId);
            if (!prospect) {
                throw new Error('Prospect non trouvé');
            }

            // Créer d'abord le message en statut "pending"
            const message = new Message({
                userId,
                prospectId,
                content,
                direction: 'sent',
                status: 'pending'
            });

            await message.save();

            // Si pas d'URL LinkedIn, sauvegarder juste le message
            if (!prospect.linkedinProfile && !prospect.linkedin) {
                message.status = 'sent';
                await message.save();
                return message;
            }

            // Sinon, essayer d'envoyer via LinkedIn
            try {
                const bot = await this.initBot(userId);
                await bot.sendMessage(
                    prospect.linkedinProfile || prospect.linkedin,
                    content,
                    userId
                );

                message.status = 'sent';
                await message.save();
            } catch (error) {
                message.status = 'failed';
                await message.save();
                throw error;
            }

            return message;
        } catch (error) {
            console.error('Erreur envoi message:', error);
            throw error;
        }
    }
}

module.exports = new LinkedInMessageService();