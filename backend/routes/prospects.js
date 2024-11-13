const express = require('express');
const router = express.Router();
const Prospect = require('../models/Prospect');
const authenticate = require('../middleware/authenticate');

// Route pour ajouter un prospect
router.post('/add', authenticate, async (req, res) => {
    try {
        const { prenom, nom, email, societe, linkedin, location } = req.body;
        console.log("📥 Données reçues:", req.body);

        // Vérifier si le prospect existe déjà
        const existingProspect = await Prospect.findOne({
            profileLink: linkedin,
            userId: req.userId
        });

        if (existingProspect) {
            return res.status(400).json({
                success: false,
                message: '❌ Ce prospect existe déjà dans votre liste'
            });
        }

        // Créer le nouveau prospect
        const prospect = new Prospect({
            firstName: prenom,
            lastName: nom,
            profileLink: linkedin,
            email: email || 'Non disponible',
            company: societe || 'Non disponible',
            location: location || 'Non disponible',
            userId: req.userId
        });

        await prospect.save();
        console.log('✅ Prospect sauvegardé:', prospect);

        res.status(201).json({
            success: true,
            message: '✅ Prospect ajouté avec succès',
            prospect: {
                _id: prospect._id,
                nom: prospect.lastName,
                prenom: prospect.firstName,
                email: prospect.email,
                societe: prospect.company,
                linkedin: prospect.profileLink,
                location: prospect.location
            }
        });

    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout du prospect:', error);
        res.status(500).json({
            success: false,
            message: '❌ Erreur lors de l\'ajout du prospect',
            error: error.message
        });
    }
});

// Route pour récupérer tous les prospects
router.get('/', authenticate, async (req, res) => {
    try {
        const prospects = await Prospect.find({ userId: req.userId })
            .sort({ createdAt: -1 });

        const transformedProspects = prospects.map(prospect => ({
            _id: prospect._id,
            nom: prospect.lastName,
            prenom: prospect.firstName,
            email: prospect.email,
            societe: prospect.company,
            linkedin: prospect.profileLink,
            location: prospect.location
        }));

        res.json({
            success: true,
            prospects: transformedProspects
        });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des prospects:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des prospects'
        });
    }
});

// Route pour supprimer des prospects
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const result = await Prospect.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: '❌ Prospect non trouvé'
            });
        }

        res.json({
            success: true,
            message: '✅ Prospect supprimé avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression'
        });
    }
});

module.exports = router;