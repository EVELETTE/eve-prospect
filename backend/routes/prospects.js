const express = require('express');
const router = express.Router();
const Prospect = require('../models/Prospect');
const authenticate = require('../middleware/authenticate');

// Route pour ajouter des prospects
router.post('/add', authenticate, async (req, res) => {
    const { prospects } = req.body;

    try {
        const prospectList = await Prospect.insertMany(
            prospects.map(prospect => ({
                ...prospect,
                userId: req.userId
            }))
        );
        res.status(201).json({ message: 'Liste de prospects ajoutée avec succès', prospectList });
    } catch (error) {
        console.error('Erreur lors de l\'ajout des prospects:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'ajout des prospects' });
    }
});

// Route pour récupérer les prospects de l'utilisateur
router.get('/', authenticate, async (req, res) => {
    try {
        const prospects = await Prospect.find({ userId: req.userId });
        res.status(200).json(prospects);
    } catch (error) {
        console.error('Erreur lors de la récupération des prospects:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des prospects' });
    }
});

module.exports = router;