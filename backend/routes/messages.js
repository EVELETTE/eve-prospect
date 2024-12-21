// routes/messages.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const LinkedInMessageService = require('../services/LinkedInMessageService');
const Message = require('../models/Message');
const Prospect = require('../models/Prospect');
const { io } = require('../server');

// Récupérer les conversations d'un prospect
router.get('/conversations/:prospectId', authenticate, async (req, res) => {
    try {
        const messageService = require('../services/LinkedInMessageService');

        // Récupérer les messages existants de la base de données
        let messages = await Message.find({
            userId: req.userId,
            prospectId: req.params.prospectId
        }).sort({ createdAt: 1 });

        // Si le prospect a un profil LinkedIn, récupérer aussi les messages LinkedIn
        const prospect = await Prospect.findById(req.params.prospectId);
        if (prospect && prospect.linkedin) {
            try {
                const linkedinMessages = await messageService.getMessages(req.userId, req.params.prospectId);

                // Fusionner avec les messages existants
                messages = [...messages, ...linkedinMessages].sort((a, b) =>
                    new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt)
                );

                // Émettre les messages via Socket.IO
                io.to(req.userId).emit('messages', messages);
            } catch (error) {
                console.error('Erreur messages LinkedIn:', error);
            }
        }

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Erreur récupération messages:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des messages',
            error: error.message
        });
    }
});

// Envoyer un message
router.post('/send', authenticate, async (req, res) => {
    try {
        const { prospectId, content } = req.body;
        const messageService = require('../services/LinkedInMessageService');

        // Créer le message dans la base de données
        const message = new Message({
            userId: req.userId,
            prospectId,
            content,
            direction: 'sent',
            status: 'pending'
        });

        await message.save();

        // Tenter d'envoyer sur LinkedIn si possible
        try {
            const prospect = await Prospect.findById(prospectId);
            if (prospect && prospect.linkedin) {
                await messageService.sendMessage(req.userId, prospectId, content);
                message.status = 'sent';
                await message.save();
            }
        } catch (error) {
            console.error('Erreur envoi LinkedIn:', error);
            message.status = 'failed';
            await message.save();
        }

        // Émettre le nouveau message via Socket.IO
        io.to(req.userId).emit('newMessage', message);

        res.json({
            success: true,
            message
        });
    } catch (error) {
        console.error('Erreur envoi message:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi du message',
            error: error.message
        });
    }
});

// Récupérer les prospects avec des conversations
router.get('/prospects-with-conversations', authenticate, async (req, res) => {
    try {
        const messageService = require('../services/LinkedInMessageService');

        // Récupérer les ID des prospects ayant des messages
        const messageProspects = await Message.distinct('prospectId', {
            userId: req.userId
        });

        // Récupérer les prospects ayant des conversations LinkedIn
        let prospects = await Prospect.find({
            $or: [
                { _id: { $in: messageProspects } },
                { linkedin: { $exists: true, $ne: null } }
            ]
        });

        // Vérifier les conversations LinkedIn existantes
        prospects = await Promise.all(prospects.map(async (prospect) => {
            if (prospect.linkedin) {
                try {
                    const hasConversation = await messageService.hasConversation(
                        prospect.linkedin,
                        req.userId
                    );
                    if (hasConversation) {
                        prospect.hasLinkedInConversation = true;
                    }
                } catch (error) {
                    console.error('Erreur vérification LinkedIn:', error);
                }
            }
            return prospect;
        }));

        // Filtrer pour ne garder que les prospects avec des conversations
        prospects = prospects.filter(p =>
            messageProspects.includes(p._id.toString()) ||
            p.hasLinkedInConversation
        );

        res.json({
            success: true,
            prospects
        });
    } catch (error) {
        console.error('Erreur récupération prospects:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des prospects',
            error: error.message
        });
    }
});

// Marquer un message comme lu
router.put('/read/:messageId', authenticate, async (req, res) => {
    try {
        const message = await Message.findOneAndUpdate(
            {
                _id: req.params.messageId,
                userId: req.userId
            },
            { status: 'read' },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message non trouvé'
            });
        }

        // Émettre le statut via Socket.IO
        io.to(req.userId).emit('messageRead', message);

        res.json({
            success: true,
            message
        });
    } catch (error) {
        console.error('Erreur marquage message comme lu:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du marquage du message comme lu',
            error: error.message
        });
    }
});

module.exports = router;