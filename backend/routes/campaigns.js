const express = require('express');
const Campaign = require('../models/Campaign');
const authMiddleware = require('../middleware/authenticate'); // Middleware pour protéger les routes

const router = express.Router();

// Route pour créer une campagne (protégée)
router.post('/create', authMiddleware, async (req, res) => {
    const { title, description } = req.body;

    try {
        const newCampaign = new Campaign({
            title,
            description,
            owner: req.userId // Récupérer l'ID de l'utilisateur à partir du middleware
        });

        await newCampaign.save();
        res.status(201).json(newCampaign);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route pour obtenir les campagnes d'un utilisateur (protégée)
router.get('/my-campaigns', authMiddleware, async (req, res) => {
    try {
        const campaigns = await Campaign.find({ owner: req.userId });
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route pour mettre à jour une campagne (protégée)
router.put('/update/:id', authMiddleware, async (req, res) => {
    const { title, description, status } = req.body;

    try {
        const updatedCampaign = await Campaign.findByIdAndUpdate(
            req.params.id,
            { title, description, status },
            { new: true }
        );

        if (!updatedCampaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        res.json(updatedCampaign);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route pour supprimer une campagne (protégée)
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const deletedCampaign = await Campaign.findByIdAndDelete(req.params.id);

        if (!deletedCampaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        res.json({ message: 'Campaign deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
