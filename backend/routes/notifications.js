// routes/notifications.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authenticate = require('../middleware/authenticate');

// Récupérer toutes les notifications de l'utilisateur
router.get('/', authenticate, async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.userId
        })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            userId: req.userId,
            read: false
        });

        res.json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('❌ Erreur récupération notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des notifications'
        });
    }
});

// Marquer une notification comme lue
router.put('/:id/read', authenticate, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification non trouvée'
            });
        }

        res.json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour notification:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la notification'
        });
    }
});

// Marquer toutes les notifications comme lues
router.put('/read-all', authenticate, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.userId, read: false },
            { read: true }
        );

        res.json({
            success: true,
            message: 'Toutes les notifications ont été marquées comme lues'
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour des notifications'
        });
    }
});

// Supprimer une notification
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification non trouvée'
            });
        }

        res.json({
            success: true,
            message: 'Notification supprimée avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur suppression notification:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la notification'
        });
    }
});

module.exports = router;