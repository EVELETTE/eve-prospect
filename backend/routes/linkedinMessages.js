// routes/linkedinMessages.js
const express = require('express');
const router = express.Router();
const LinkedInBot = require('../services/LinkedInBot');
const Message = require('../models/Message');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Prospect = require('../models/Prospect');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

// Fonction utilitaire pour gérer la création/mise à jour de conversation
async function handleConversation(userId, linkedinConversation) {
    try {
        // Normaliser les données de la conversation LinkedIn
        const normalizedData = {
            linkedinUrl: linkedinConversation.profileUrl || '',
            name: linkedinConversation.name || '',
            lastMessage: linkedinConversation.lastMessage || '',
            timestamp: linkedinConversation.timestamp || new Date()
        };

        // 1. D'abord chercher un prospect existant
        let prospect = null;
        if (normalizedData.linkedinUrl) {
            prospect = await Prospect.findOne({
                userId,
                $or: [
                    { profileLink: normalizedData.linkedinUrl },
                    { linkedin: normalizedData.linkedinUrl }
                ]
            });
        }

        // 2. Préparer les données de la conversation
        let conversationData = {
            userId,
            messages: [{
                content: normalizedData.lastMessage,
                sender: 'prospect', // Par défaut, considérer que c'est un message du prospect
                timestamp: new Date(normalizedData.timestamp)
            }],
            dernierMessage: new Date(normalizedData.timestamp)
        };

        // 3. Ajouter les informations du prospect selon le cas
        if (prospect) {
            conversationData.prospect = prospect._id;
        } else {
            // Extraire prénom/nom du champ name
            const [prenom = 'Inconnu', ...nomParts] = normalizedData.name.split(' ');
            const nom = nomParts.join(' ') || 'Inconnu';

            conversationData.prospectInfo = {
                linkedinUrl: normalizedData.linkedinUrl,
                prenom,
                nom,
                societe: 'Inconnue' // À extraire du profil si disponible
            };
        }

        // 4. Chercher une conversation existante
        const existingConversation = await Conversation.findOne({
            userId,
            $or: [
                { prospect: prospect?._id },
                { 'prospectInfo.linkedinUrl': normalizedData.linkedinUrl }
            ]
        });

        if (existingConversation) {
            // Mettre à jour la conversation existante
            const updatedConversation = await Conversation.findByIdAndUpdate(
                existingConversation._id,
                {
                    $set: {
                        dernierMessage: conversationData.dernierMessage,
                        ...(prospect ? { prospect: prospect._id } : { prospectInfo: conversationData.prospectInfo })
                    },
                    $push: {
                        messages: {
                            $each: conversationData.messages,
                            $position: 0
                        }
                    }
                },
                { new: true }
            );
            return updatedConversation;
        } else {
            // Créer une nouvelle conversation
            const newConversation = new Conversation(conversationData);
            return await newConversation.save();
        }
    } catch (error) {
        console.error('Erreur traitement conversation:', error);
        throw error;
    }
}
// Fonction utilitaire pour normaliser les données de conversation
const normalizeConversationData = (rawData) => {
    return {
        linkedinUrl: rawData.linkedinUrl || '',
        prenom: rawData.prenom || 'Inconnu',
        nom: rawData.nom || 'Inconnu',
        societe: rawData.societe || 'Inconnue',
        messages: (rawData.messages || []).map(msg => ({
            content: msg.content,
            sender: msg.sender === 'user' ? 'utilisateur' : 'prospect',
            timestamp: msg.timestamp || new Date()
        }))
    };
};
// Fonction pour créer ou mettre à jour une conversation
const upsertConversation = async (userId, convData) => {
    const normalizedData = normalizeConversationData(convData);

    // Recherche du prospect existant
    let prospect = null;
    if (normalizedData.linkedinUrl) {
        prospect = await Prospect.findOne({
            userId,
            $or: [
                { profileLink: normalizedData.linkedinUrl },
                { linkedin: normalizedData.linkedinUrl }
            ]
        });
    }

    // Préparer les données de conversation
    const conversationData = {
        userId,
        messages: normalizedData.messages,
        dernierMessage: new Date()
    };

    // Ajouter soit le prospect soit les infos prospect
    if (prospect) {
        conversationData.prospect = prospect._id;
        conversationData.prospectInfo = undefined;
    } else {
        conversationData.prospect = null;
        conversationData.prospectInfo = {
            linkedinUrl: normalizedData.linkedinUrl,
            prenom: normalizedData.prenom,
            nom: normalizedData.nom,
            societe: normalizedData.societe
        };
    }

    // Trouver et mettre à jour ou créer
    const query = {
        userId,
        $or: [
            { prospect: prospect?._id },
            { 'prospectInfo.linkedinUrl': normalizedData.linkedinUrl }
        ].filter(Boolean)
    };

    if (query.$or.length === 0) {
        // Créer une nouvelle conversation si pas de critères de recherche
        const newConv = new Conversation(conversationData);
        return await newConv.save();
    }

    return await Conversation.findOneAndUpdate(
        query,
        conversationData,
        {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true
        }
    );
};

// Route de synchronisation
router.post('/sync', authenticate, async (req, res) => {
    try {
        // Initialiser le bot LinkedIn
        const bot = new LinkedInBot();
        await bot.initialize();
        const conversations = await bot.extractConversations(req.userId);

        console.info(`${conversations.length} conversations extraites`);

        // Traiter chaque conversation de manière séquentielle
        const results = [];
        for (const conv of conversations) {
            try {
                const result = await handleConversation(req.userId, conv);
                results.push({
                    success: true,
                    id: result._id,
                    profileUrl: conv.profileUrl
                });
            } catch (error) {
                console.error('Erreur traitement conversation:', error);
                results.push({
                    success: false,
                    error: error.message,
                    profileUrl: conv.profileUrl
                });
            }
        }

        res.json({
            success: true,
            message: 'Synchronisation terminée',
            stats: {
                total: conversations.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            },
            results
        });

    } catch (error) {
        console.error('Erreur synchronisation LinkedIn:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la synchronisation',
            error: error.message
        });
    }
});


// Récupérer toutes les conversations
router.get('/conversations', async (req, res) => {
    try {
        // Récupérer les conversations existantes de la base de données
        const conversations = await Conversation.find({ userId: req.userId })
            .populate('prospect')
            .sort({ updatedAt: -1 });

        // Si on a un bot LinkedIn configuré, on synchronise aussi avec LinkedIn
        try {
            const user = await User.findById(req.userId);
            if (user?.linkedinCredentials?.email && user?.linkedinCredentials?.password) {
                const bot = new LinkedInBot();
                await bot.initialize(req.userId);
                await bot.login(
                    user.linkedinCredentials.email,
                    user.linkedinCredentials.password
                );

                // Récupérer et synchroniser les conversations LinkedIn
                const linkedinConversations = await bot.getConversations();

                // Mettre à jour ou créer les conversations dans la base de données
                for (const conv of linkedinConversations) {
                    let conversation = await Conversation.findOne({
                        userId: req.userId,
                        'prospect.linkedinUrl': conv.profileUrl
                    });

                    if (!conversation) {
                        conversation = new Conversation({
                            userId: req.userId,
                            prospect: {
                                linkedinUrl: conv.profileUrl,
                                prenom: conv.firstName,
                                nom: conv.lastName,
                                societe: conv.company
                            },
                            lastMessage: conv.lastMessage,
                            unreadCount: conv.unreadCount
                        });
                        await conversation.save();
                    }
                }

                // Récupérer à nouveau toutes les conversations mises à jour
                conversations = await Conversation.find({ userId: req.userId })
                    .populate('prospect')
                    .sort({ updatedAt: -1 });
            }
        } catch (error) {
            console.error('Erreur synchronisation LinkedIn:', error);
            // On continue même si la synchro LinkedIn échoue
        }

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
});

// Récupérer les messages d'une conversation
router.get('/:conversationId', authenticate, async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.conversationId,
            userId: req.userId
        }).populate('prospect');

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation non trouvée'
            });
        }

        res.json({
            success: true,
            conversation
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des messages',
            error: error.message
        });
    }
});

// Envoyer un message
router.post('/send-message', async (req, res) => {
    try {
        const { conversationId, content } = req.body;

        const conversation = await Conversation.findOne({
            _id: conversationId,
            userId: req.userId
        }).populate('prospect');

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation non trouvée'
            });
        }

        // Créer le message en base de données
        const message = new Message({
            conversationId,
            content,
            sender: 'user'
        });

        await message.save();

        // Envoyer sur LinkedIn si possible
        try {
            const user = await User.findById(req.userId);
            if (user?.linkedinCredentials?.email) {
                const bot = new LinkedInBot();
                await bot.initialize(req.userId);
                await bot.login(
                    user.linkedinCredentials.email,
                    user.linkedinCredentials.password
                );

                await bot.sendMessage(conversation.prospect.linkedinUrl, content);

                // Mettre à jour le statut du message
                message.status = 'sent';
                await message.save();
            }
        } catch (error) {
            console.error('Erreur envoi message LinkedIn:', error);
            message.status = 'error';
            message.error = error.message;
            await message.save();
        }

        res.json({
            success: true,
            message
        });

    } catch (error) {
        console.error('Erreur envoi message:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi du message'
        });
    }
});

module.exports = router;