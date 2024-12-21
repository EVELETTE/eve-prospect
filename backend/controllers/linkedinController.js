// controllers/linkedinController.js
const User = require('../models/User');
const { encrypt, decrypt } = require('../utils/crypto');
const LinkedInBot = require('../services/LinkedInBot');

const linkedinController = {
    updateCredentials: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findById(req.userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }

            // Initialiser ou mettre à jour les credentials
            if (!user.linkedinCredentials) {
                user.linkedinCredentials = {};
            }

            // Mettre à jour uniquement les champs fournis
            if (email) {
                user.linkedinCredentials.email = encrypt(email);
            }
            if (password) {
                user.linkedinCredentials.password = encrypt(password);
            }

            // Réinitialiser le statut de connexion
            user.linkedinCredentials.isConnected = false;
            user.linkedinCredentials.lastCheck = new Date();

            await user.save();

            res.json({
                success: true,
                message: 'Identifiants LinkedIn mis à jour'
            });

        } catch (error) {
            console.error('Erreur mise à jour credentials:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour des identifiants'
            });
        }
    },

    getCredentials: async (req, res) => {
        try {
            const user = await User.findById(req.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }

            // Décrypter l'email pour l'affichage
            let email = '';
            if (user.linkedinCredentials?.email) {
                email = decrypt(user.linkedinCredentials.email);
            }

            res.json({
                success: true,
                email,
                isConnected: !!user.linkedinCredentials?.isConnected,
                lastCheck: user.linkedinCredentials?.lastCheck
            });

        } catch (error) {
            console.error('Erreur récupération credentials:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur'
            });
        }
    }
};

module.exports = linkedinController;