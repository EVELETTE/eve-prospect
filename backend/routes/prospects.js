const express = require('express');
const router = express.Router();
const Prospect = require('../models/Prospect');
const Notification = require('../models/Notification');
const authenticate = require('../middleware/authenticate');

// Ajout d'un prospect
router.post('/add', authenticate, async (req, res) => {
    try {
        const { prenom, nom, email, societe, linkedin, location, position, description } = req.body;
        console.log("📥 Données reçues:", req.body);

        // Vérification du doublon
        const existingProspect = await Prospect.findOne({
            profileLink: linkedin,
            userId: req.userId
        });

        if (existingProspect) {
            // Mise à jour du prospect existant
            const updatedProspect = await Prospect.findByIdAndUpdate(
                existingProspect._id,
                {
                    $set: {
                        firstName: prenom,
                        lastName: nom,
                        email: email || existingProspect.email,
                        company: societe || existingProspect.company,
                        location: location || existingProspect.location,
                        position: position || existingProspect.position,
                        description: description || existingProspect.description,
                        extractedAt: new Date()
                    }
                },
                { new: true }
            );

            await new Notification({
                userId: req.userId,
                title: 'Prospect mis à jour',
                message: `Les informations de ${prenom} ${nom} ont été mises à jour.`,
                type: 'info'
            }).save();

            return res.json({
                success: true,
                message: '✅ Prospect mis à jour',
                prospect: updateProspectFormat(updatedProspect),
                updated: true
            });
        }

        // Création d'un nouveau prospect
        const prospect = new Prospect({
            firstName: prenom,
            lastName: nom,
            profileLink: linkedin,
            email: email || 'Non disponible',
            company: societe || 'Non disponible',
            location: location || 'Non disponible',
            position: position || 'Non disponible',
            description: description || 'Non disponible',
            userId: req.userId,
            source: req.body.source || 'profil',
            extractedAt: new Date()
        });

        await prospect.save();
        console.log('✅ Prospect sauvegardé:', prospect);

        await new Notification({
            userId: req.userId,
            title: 'Nouveau prospect ajouté',
            message: `${prenom} ${nom} de ${societe} a été ajouté avec succès.`,
            type: 'success',
            link: linkedin
        }).save();

        res.status(201).json({
            success: true,
            message: '✅ Prospect ajouté avec succès',
            prospect: updateProspectFormat(prospect),
            created: true
        });
    } catch (error) {
        console.error('❌ Erreur:', error);
        await new Notification({
            userId: req.userId,
            title: 'Erreur d\'ajout',
            message: 'Une erreur est survenue lors de l\'ajout du prospect.',
            type: 'error'
        }).save();

        res.status(500).json({
            success: false,
            message: '❌ Erreur lors de l\'ajout du prospect',
            error: error.message
        });
    }
});

// Ajout en batch de prospects
router.post('/batch', authenticate, async (req, res) => {
    try {
        const { prospects } = req.body;
        if (!Array.isArray(prospects)) {
            throw new Error('Les données doivent être un tableau de prospects');
        }

        const results = {
            created: 0,
            updated: 0,
            failed: 0,
            details: []
        };

        for (const prospectData of prospects) {
            try {
                const { prenom, nom, linkedin, ...otherData } = prospectData;

                const existingProspect = await Prospect.findOne({
                    profileLink: linkedin,
                    userId: req.userId
                });

                if (existingProspect) {
                    await Prospect.findByIdAndUpdate(
                        existingProspect._id,
                        {
                            $set: {
                                firstName: prenom,
                                lastName: nom,
                                ...otherData,
                                extractedAt: new Date()
                            }
                        }
                    );
                    results.updated++;
                } else {
                    const newProspect = new Prospect({
                        firstName: prenom,
                        lastName: nom,
                        profileLink: linkedin,
                        ...otherData,
                        userId: req.userId,
                        source: 'recherche',
                        extractedAt: new Date()
                    });
                    await newProspect.save();
                    results.created++;
                }
            } catch (error) {
                console.error('Erreur prospect individuel:', error);
                results.failed++;
                results.details.push({
                    prospect: prospectData,
                    error: error.message
                });
            }
        }

        await new Notification({
            userId: req.userId,
            title: 'Import de prospects',
            message: `${results.created} créés, ${results.updated} mis à jour, ${results.failed} échoués`,
            type: 'info'
        }).save();

        res.json({
            success: true,
            message: 'Traitement terminé',
            results
        });
    } catch (error) {
        console.error('❌ Erreur batch:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du traitement batch',
            error: error.message
        });
    }
});

// Récupération des prospects
router.get('/', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 50, status, source, search } = req.query;
        const query = { userId: req.userId };

        // Application des filtres
        if (status) query.status = status;
        if (source) query.source = source;
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } }
            ];
        }

        // Récupération avec pagination
        const prospects = await Prospect.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Prospect.countDocuments(query);

        const transformedProspects = prospects.map(updateProspectFormat);

        res.json({
            success: true,
            prospects: transformedProspects,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des prospects:', error);

        await new Notification({
            userId: req.userId,
            title: 'Erreur de chargement',
            message: 'Impossible de charger la liste des prospects.',
            type: 'error'
        }).save();

        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des prospects'
        });
    }
});

// Suppression d'un prospect
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

        await new Notification({
            userId: req.userId,
            title: 'Prospect supprimé',
            message: `${prospect.firstName} ${prospect.lastName} a été retiré de votre liste.`,
            type: 'info'
        }).save();

        res.json({
            success: true,
            message: '✅ Prospect supprimé avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);

        await new Notification({
            userId: req.userId,
            title: 'Erreur de suppression',
            message: 'Impossible de supprimer le prospect.',
            type: 'error'
        }).save();

        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression'
        });
    }
});

// Mise à jour du statut d'un prospect
router.put('/:id/status', authenticate, async (req, res) => {
    try {
        const { status } = req.body;

        const prospect = await Prospect.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            {
                $set: {
                    status,
                    lastContactedAt: status === 'contacté' ? new Date() : undefined
                }
            },
            { new: true }
        );

        if (!prospect) {
            return res.status(404).json({
                success: false,
                message: '❌ Prospect non trouvé'
            });
        }

        await new Notification({
            userId: req.userId,
            title: 'Statut mis à jour',
            message: `Le statut de ${prospect.firstName} ${prospect.lastName} a été mis à jour en "${status}".`,
            type: 'info'
        }).save();

        res.json({
            success: true,
            message: '✅ Statut mis à jour avec succès',
            prospect: updateProspectFormat(prospect)
        });
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du statut:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du statut'
        });
    }
});

// Fonction utilitaire pour formater les données de prospect
function updateProspectFormat(prospect) {
    return {
        _id: prospect._id,
        nom: prospect.lastName,
        prenom: prospect.firstName,
        email: prospect.email,
        societe: prospect.company,
        linkedin: prospect.profileLink,
        location: prospect.location,
        position: prospect.position,
        status: prospect.status,
        source: prospect.source,
        extractedAt: prospect.extractedAt,
        createdAt: prospect.createdAt,
        lastContactedAt: prospect.lastContactedAt
    };
}

module.exports = router;