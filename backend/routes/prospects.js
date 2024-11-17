const express = require('express');
const router = express.Router();
const Prospect = require('../models/Prospect');
const Notification = require('../models/Notification');
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
            // Créer une notification pour le doublon
            await new Notification({
                userId: req.userId,
                title: 'Doublon détecté',
                message: `Le prospect ${prenom} ${nom} existe déjà dans votre liste sous le nom ${existingProspect.firstName} ${existingProspect.lastName}`,
                type: 'warning'
            }).save();

            return res.status(400).json({
                success: false,
                message: `❌ Ce prospect existe déjà dans votre liste avec le nom ${existingProspect.firstName} ${existingProspect.lastName}`,
                prospect: existingProspect
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

        // Créer une notification pour l'ajout réussi
        await new Notification({
            userId: req.userId,
            title: 'Nouveau prospect ajouté',
            message: `${prenom} ${nom} de ${societe} a été ajouté à votre liste`,
            type: 'success',
            link: linkedin // Ajouter le lien LinkedIn pour un accès rapide
        }).save();

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

        // Créer une notification pour l'erreur
        await new Notification({
            userId: req.userId,
            title: 'Erreur d\'ajout',
            message: 'Une erreur est survenue lors de l\'ajout du prospect',
            type: 'error'
        }).save();

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

        // Créer une notification pour l'erreur de chargement
        await new Notification({
            userId: req.userId,
            title: 'Erreur de chargement',
            message: 'Impossible de charger la liste des prospects',
            type: 'error'
        }).save();

        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des prospects'
        });
    }
});

// Route pour supprimer des prospects
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const prospect = await Prospect.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!prospect) {
            return res.status(404).json({
                success: false,
                message: '❌ Prospect non trouvé'
            });
        }

        await prospect.deleteOne();

        // Créer une notification pour la suppression réussie
        await new Notification({
            userId: req.userId,
            title: 'Prospect supprimé',
            message: `${prospect.firstName} ${prospect.lastName} a été retiré de votre liste`,
            type: 'info'
        }).save();

        res.json({
            success: true,
            message: '✅ Prospect supprimé avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);

        // Créer une notification pour l'erreur de suppression
        await new Notification({
            userId: req.userId,
            title: 'Erreur de suppression',
            message: 'Impossible de supprimer le prospect',
            type: 'error'
        }).save();

        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression'
        });
    }
});

module.exports = router;