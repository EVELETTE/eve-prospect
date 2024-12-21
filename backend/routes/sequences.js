// routes/sequences.js
const express = require('express');
const router = express.Router();
const Sequence = require('../models/Sequence');
const authenticate = require('../middleware/authenticate');



// Route pour récupérer les séquences d'un prospect
router.get('/', authenticate, async (req, res) => {
    try {
        const { prospectId } = req.query;
        if (!prospectId) {
            return res.status(400).json({
                success: false,
                message: 'prospectId est requis'
            });
        }

        const sequences = await Sequence.find({
            prospectId,
            userId: req.userId
        }).sort('-createdAt');

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
});

// Créer une nouvelle séquence
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, templateId, prospectId, status, steps } = req.body;

        const sequence = new Sequence({
            userId: req.userId,  // Récupéré depuis le middleware authenticate
            title,
            templateId,
            prospectId,
            status,
            steps
        });

        const savedSequence = await sequence.save();

        res.status(201).json({
            success: true,
            sequence: savedSequence
        });

    } catch (error) {
        console.error('Erreur création séquence:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la création de la séquence'
        });
    }
});

// Route pour démarrer une séquence
router.put('/:sequenceId/start', authenticate, async (req, res) => {
    try {
        const sequence = await Sequence.findOne({
            _id: req.params.sequenceId,
            userId: req.userId
        });

        if (!sequence) {
            return res.status(404).json({
                success: false,
                message: 'Séquence non trouvée'
            });
        }

        sequence.status = 'active';
        sequence.nextExecutionDate = new Date();
        sequence.executionLogs.push({
            action: 'start',
            status: 'success',
            message: 'Séquence démarrée'
        });

        await sequence.save();

        res.json({
            success: true,
            sequence
        });

    } catch (error) {
        console.error('Erreur démarrage séquence:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors du démarrage de la séquence'
        });
    }
});
//route pour mettre pause a une sequence
router.put('/:sequenceId/pause', authenticate, async (req, res) => {
    try {
        const sequence = await Sequence.findOne({
            _id: req.params.sequenceId,
            userId: req.userId
        });

        if (!sequence) {
            return res.status(404).json({
                success: false,
                message: 'Séquence non trouvée'
            });
        }

        // Mettre à jour le statut et ajouter un log
        sequence.status = 'paused';
        sequence.executionLogs.push({
            action: 'pause',
            status: 'success',
            message: 'Séquence mise en pause'
        });

        await sequence.save();

        res.json({
            success: true,
            sequence
        });

    } catch (error) {
        console.error('Erreur pause séquence:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la mise en pause de la séquence'
        });
    }
});
// Supprimer une séquence
router.delete('/:sequenceId', authenticate, async (req, res) => {
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
            message: 'Séquence supprimée avec succès'
        });

    } catch (error) {
        console.error('Erreur suppression séquence:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la séquence'
        });
    }
});

module.exports = router;