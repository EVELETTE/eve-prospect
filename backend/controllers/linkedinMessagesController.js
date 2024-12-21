// controllers/linkedinMessagesController.js
const LinkedInBot = require('../services/LinkedInBot');
const User = require('../models/User');

const linkedinMessagesController = {
    async getConversations(req, res) {
        try {
            // Récupérer l'utilisateur avec ses credentials LinkedIn
            const user = await User.findById(req.userId);
            if (!user || !user.linkedinCredentials?.email) {
                return res.status(400).json({
                    success: false,
                    message: 'Identifiants LinkedIn manquants'
                });
            }

            // Initialiser et utiliser le bot avec les credentials cryptés
            const bot = new LinkedInBot();
            await bot.initialize();
            const loginSuccess = await bot.login(
                user.linkedinCredentials.email,
                user.linkedinCredentials.password
            );

            if (!loginSuccess) {
                return res.status(401).json({
                    success: false,
                    message: 'Échec de connexion à LinkedIn'
                });
            }

            const conversations = await bot.getConversations();
            await bot.close();

            res.json({
                success: true,
                conversations
            });

        } catch (error) {
            console.error('Erreur récupération conversations:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des conversations'
            });
        }
    }
};

module.exports = linkedinMessagesController;