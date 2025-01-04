// controllers/conversationController.js
const Conversation = require('../models/Conversation');
const LinkedInBot = require('../services/LinkedInBot');

const conversationController = {
    async synchroniserConversations(req, res) {
        try {
            const bot = new LinkedInBot();
            const conversations = await bot.getConversations();

            await synchroniserConversationsLinkedIn(req.userId, conversations);

            res.json({
                success: true,
                message: 'Conversations synchronisées avec succès'
            });
        } catch (error) {
            console.error('Erreur de synchronisation:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la synchronisation',
                error: error.message
            });
        }
    },

    async getConversations(req, res) {
        try {
            const conversations = await Conversation.find({ userId: req.userId })
                .sort({ dernierMessage: -1 })
                .populate('prospect');

            res.json({
                success: true,
                conversations
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des conversations'
            });
        }
    },

    async ajouterMessage(req, res) {
        try {
            const { conversationId } = req.params;
            const { content } = req.body;

            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversation non trouvée'
                });
            }

            await conversation.ajouterMessage(content, 'utilisateur');

            res.json({
                success: true,
                message: 'Message ajouté avec succès'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'ajout du message'
            });
        }
    }
};

module.exports = conversationController;