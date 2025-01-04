// controllers/goalsController.js
const Goals = require('../models/Goals');
const Notification = require('../models/Notification');
const Prospect = require('../models/Prospect');
const Message = require('../models/Message');
const Campaign = require('../models/Campaign');

const goalsController = {
    // Récupérer les objectifs de l'utilisateur
    async getGoals(req, res) {
        try {
            let goals = await Goals.findOne({ userId: req.userId });

            // Si aucun objectif n'existe, créer des objectifs par défaut
            if (!goals) {
                goals = await Goals.create({
                    userId: req.userId,
                    monthly: {
                        prospects: 100,
                        messages: 50,
                        connections: 30,
                        responses: 20,
                        conversions: 10
                    }
                });
            }

            res.json({
                success: true,
                goals
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des objectifs:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des objectifs'
            });
        }
    },

    // Mettre à jour les objectifs
    async updateGoals(req, res) {
        try {
            const { monthly } = req.body;

            // Validation des données
            if (!monthly || typeof monthly !== 'object') {
                return res.status(400).json({
                    success: false,
                    message: 'Données invalides'
                });
            }

            // Mise à jour ou création des objectifs
            const goals = await Goals.findOneAndUpdate(
                { userId: req.userId },
                {
                    $set: {
                        monthly: {
                            prospects: monthly.prospects || 100,
                            messages: monthly.messages || 50,
                            connections: monthly.connections || 30,
                            responses: monthly.responses || 20,
                            conversions: monthly.conversions || 10
                        }
                    }
                },
                { new: true, upsert: true }
            );

            // Créer une notification
            await new Notification({
                userId: req.userId,
                title: 'Objectifs mis à jour',
                message: 'Vos objectifs mensuels ont été mis à jour avec succès.',
                type: 'success'
            }).save();

            res.json({
                success: true,
                goals
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour des objectifs:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour des objectifs'
            });
        }
    },

    // Obtenir les statistiques de progression
    async getProgress(req, res) {
        try {
            const goals = await Goals.findOne({ userId: req.userId });
            if (!goals) {
                return res.status(404).json({
                    success: false,
                    message: 'Objectifs non trouvés'
                });
            }

            // Calculer les statistiques actuelles
            // (Vous devrez adapter cette partie selon votre modèle de données)
            const stats = await calculateCurrentStats(req.userId);

            // Calculer les pourcentages de progression
            const progress = {
                prospects: (stats.prospects / goals.monthly.prospects) * 100,
                messages: (stats.messages / goals.monthly.messages) * 100,
                connections: (stats.connections / goals.monthly.connections) * 100,
                responses: (stats.responses / goals.monthly.responses) * 100,
                conversions: (stats.conversions / goals.monthly.conversions) * 100
            };

            res.json({
                success: true,
                progress,
                stats,
                goals: goals.monthly
            });
        } catch (error) {
            console.error('Erreur lors du calcul de la progression:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du calcul de la progression'
            });
        }
    }
};

async function calculateCurrentStats(userId) {
    try {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

        // Récupérer tous les prospects du mois
        const totalProspects = await Prospect.countDocuments({
            userId,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // Récupérer les messages envoyés du mois
        const totalMessages = await Message.countDocuments({
            userId,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            direction: 'sent'
        });

        // Récupérer les connexions acceptées (prospects avec statut 'contacté')
        const totalConnections = await Prospect.countDocuments({
            userId,
            status: 'contacté',
            lastContactedAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // Récupérer les réponses reçues
        const totalResponses = await Message.countDocuments({
            userId,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            direction: 'received'
        });

        // Récupérer les conversions (prospects avec statut 'converti')
        const totalConversions = await Prospect.countDocuments({
            userId,
            status: 'converti',
            updatedAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // Calculer les statistiques de campagne
        const campaigns = await Campaign.find({
            owner: userId,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // Additionner les résultats des campagnes
        const campaignStats = campaigns.reduce((acc, campaign) => {
            if (campaign.results) {
                acc.prospects += (campaign.results.successful?.length || 0);
                acc.connections += (campaign.results.successful?.length || 0);
                acc.messages += (campaign.results.successful?.length || 0);
            }
            return acc;
        }, { prospects: 0, connections: 0, messages: 0 });

        // Fusionner les statistiques manuelles et automatiques
        return {
            prospects: totalProspects + campaignStats.prospects,
            messages: totalMessages + campaignStats.messages,
            connections: totalConnections + campaignStats.connections,
            responses: totalResponses,
            conversions: totalConversions,
            details: {
                manual: {
                    prospects: totalProspects,
                    messages: totalMessages,
                    connections: totalConnections,
                    responses: totalResponses,
                    conversions: totalConversions
                },
                automated: {
                    prospects: campaignStats.prospects,
                    messages: campaignStats.messages,
                    connections: campaignStats.connections
                }
            }
        };
    } catch (error) {
        console.error('Erreur lors du calcul des statistiques:', error);
        throw error;
    }
}

// Exports
module.exports = {
    ...goalsController,
    calculateCurrentStats  // Si vous voulez l'utiliser ailleurs
};

module.exports = goalsController;