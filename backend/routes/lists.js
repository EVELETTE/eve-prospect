// routes/lists.js
const express = require('express');
const router = express.Router();
const List = require('../models/List');
const authenticate = require('../middleware/authenticate');

// Créer une nouvelle liste
router.post('/', authenticate, async (req, res) => {
    try {
        const { name } = req.body;

        // Vérifier si une liste avec ce nom existe déjà pour cet utilisateur
        const existingList = await List.findOne({
            name: name,
            userId: req.userId
        });

        if (existingList) {
            return res.status(400).json({
                success: false,
                message: 'Une liste avec ce nom existe déjà'
            });
        }

        const list = new List({
            name,
            userId: req.userId
        });

        await list.save();

        res.status(201).json({
            success: true,
            message: 'Liste créée avec succès',
            list: {
                _id: list._id,
                name: list.name,
                prospectsCount: 0
            }
        });
    } catch (error) {
        console.error('Erreur lors de la création de la liste:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la liste'
        });
    }
});

// Récupérer toutes les listes d'un utilisateur
router.get('/', authenticate, async (req, res) => {
    try {
        const lists = await List.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .populate('prospects', 'prenom nom email societe linkedin');

        const formattedLists = lists.map(list => ({
            _id: list._id,
            name: list.name,
            prospectsCount: list.prospects.length,
            updatedAt: list.updatedAt
        }));

        res.json({
            success: true,
            lists: formattedLists
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des listes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des listes'
        });
    }
});

// Récupérer une liste spécifique avec ses prospects
router.get('/:id', authenticate, async (req, res) => {
    try {
        const list = await List.findOne({
            _id: req.params.id,
            userId: req.userId
        }).populate({
            path: 'prospects',
            select: 'prenom nom email societe linkedin'
        });

        if (!list) {
            return res.status(404).json({
                success: false,
                message: 'Liste non trouvée'
            });
        }

        res.json({
            success: true,
            list: {
                _id: list._id,
                name: list.name,
                prospects: list.prospects,
                prospectsCount: list.prospects.length,
                updatedAt: list.updatedAt
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de la liste:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la liste'
        });
    }
});

// Mettre à jour une liste
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { name } = req.body;

        // Vérifier si le nouveau nom est déjà utilisé
        if (name) {
            const existingList = await List.findOne({
                name,
                userId: req.userId,
                _id: { $ne: req.params.id }
            });

            if (existingList) {
                return res.status(400).json({
                    success: false,
                    message: 'Une liste avec ce nom existe déjà'
                });
            }
        }

        const list = await List.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { name, updatedAt: Date.now() },
            { new: true }
        );

        if (!list) {
            return res.status(404).json({
                success: false,
                message: 'Liste non trouvée'
            });
        }

        res.json({
            success: true,
            message: 'Liste mise à jour avec succès',
            list: {
                _id: list._id,
                name: list.name,
                updatedAt: list.updatedAt
            }
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la liste:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la liste'
        });
    }
});

// Supprimer une liste
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const list = await List.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!list) {
            return res.status(404).json({
                success: false,
                message: 'Liste non trouvée'
            });
        }

        res.json({
            success: true,
            message: 'Liste supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de la liste:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la liste'
        });
    }
});

// Ajouter des prospects à une liste
router.post('/:id/prospects', authenticate, async (req, res) => {
    try {
        const { prospectIds } = req.body;

        const list = await List.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            {
                $addToSet: { prospects: { $each: prospectIds } },
                updatedAt: Date.now()
            },
            { new: true }
        ).populate('prospects');

        if (!list) {
            return res.status(404).json({
                success: false,
                message: 'Liste non trouvée'
            });
        }

        res.json({
            success: true,
            message: 'Prospects ajoutés avec succès',
            list: {
                _id: list._id,
                name: list.name,
                prospects: list.prospects,
                updatedAt: list.updatedAt
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout des prospects:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout des prospects'
        });
    }
});

// Retirer des prospects d'une liste
router.delete('/:id/prospects', authenticate, async (req, res) => {
    try {
        const { prospectIds } = req.body;

        const list = await List.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            {
                $pullAll: { prospects: prospectIds },
                updatedAt: Date.now()
            },
            { new: true }
        ).populate('prospects');

        if (!list) {
            return res.status(404).json({
                success: false,
                message: 'Liste non trouvée'
            });
        }

        res.json({
            success: true,
            message: 'Prospects retirés avec succès',
            list: {
                _id: list._id,
                name: list.name,
                prospects: list.prospects,
                updatedAt: list.updatedAt
            }
        });
    } catch (error) {
        console.error('Erreur lors du retrait des prospects:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du retrait des prospects'
        });
    }
});

module.exports = router;