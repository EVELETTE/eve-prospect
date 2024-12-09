// routes/sequences.js
const express = require('express');
const router = express.Router();
const Sequence = require('../models/Sequence');
const authenticate = require('../middleware/authenticate');

// Créer une nouvelle séquence
router.post('/', authenticate, async (req, res) => {
    try {
        const { prospectId, templateId, steps } = req.body;

        const sequence = new Sequence({
            prospectId,
            templateId,
            steps
        });

        await sequence.save();

        res.status(201).json({
            success: true,
            sequence
        });
    } catch (error) {
        console.error('❌ Erreur création séquence:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la séquence'
        });
    }
});

// Récupérer les séquences d'un prospect
router.get('/prospect/:prospectId', authenticate, async (req, res) => {
    try {
        const sequences = await Sequence.find({
            prospectId: req.params.prospectId
        }).sort('-createdAt');

        res.json({
            success: true,
            sequences
        });
    } catch (error) {
        console.error('❌ Erreur récupération séquences:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des séquences'
        });
    }
});

// Mettre à jour une séquence
router.put('/:sequenceId', authenticate, async (req, res) => {
    try {
        const { status } = req.body;

        const sequence = await Sequence.findById(req.params.sequenceId);
        if (!sequence) {
            return res.status(404).json({
                success: false,
                message: 'Séquence non trouvée'
            });
        }

        sequence.status = status;
        await sequence.save();

        res.json({
            success: true,
            sequence
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour séquence:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la séquence'
        });
    }
});

// Supprimer une séquence
router.delete('/:sequenceId', authenticate, async (req, res) => {
    try {
        await Sequence.findByIdAndDelete(req.params.sequenceId);

        res.json({
            success: true,
            message: 'Séquence supprimée avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur suppression séquence:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la séquence'
        });
    }
});

module.exports = router;