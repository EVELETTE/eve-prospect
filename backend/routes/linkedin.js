// routes/linkedin.js
const express = require('express');
const router = express.Router();
const LinkedInBot = require('../services/LinkedInBot');
const authenticate = require('../middleware/authenticate');
const { encrypt, decrypt } = require('../utils/crypto');
const User = require('../models/User');

// Service bot LinkedIn
let linkedInBot = null;

// Route pour initialiser le bot
router.post('/initialize-bot', authenticate, async (req, res) => {
    try {
        // Initialisation du bot
        const bot = new LinkedInBot();
        await bot.initialize('initialization_test');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'initialisation du bot'
        });
    }
});

// Test de connexion LinkedIn
router.post('/test-connection', authenticate, async (req, res) => {
    let bot = null;
    try {
        const user = await User.findById(req.userId);
        if (!user?.linkedinCredentials?.email || !user?.linkedinCredentials?.password) {
            return res.status(400).json({
                success: false,
                message: 'Identifiants LinkedIn manquants'
            });
        }

        // Décrypter les identifiants
        const email = decrypt(user.linkedinCredentials.email);
        const password = decrypt(user.linkedinCredentials.password);

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Erreur lors du déchiffrement des identifiants'
            });
        }

        // Initialiser le bot
        bot = new LinkedInBot();
        await bot.initialize(`session_${req.userId}`);

        // Tenter la connexion
        const isConnected = await bot.login(email, password);

        // Mettre à jour le statut
        await User.findByIdAndUpdate(req.userId, {
            $set: {
                'linkedinCredentials.isConnected': isConnected,
                'linkedinCredentials.lastCheck': new Date()
            }
        });

        res.json({
            success: true,
            isConnected,
            lastCheck: new Date()
        });

    } catch (error) {
        console.error('Erreur test connexion LinkedIn:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Erreur lors du test de connexion"
        });
    } finally {
        // S'assurer que le bot est toujours fermé
        if (bot?.browser) {
            await bot.close().catch(console.error);
        }
    }
});

module.exports = router;