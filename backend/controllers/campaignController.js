// controllers/campaignController.js
const LinkedInBot = require('../services/LinkedInBot');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

const campaignController = {
    async startCampaign(req, res) {
        try {
            const { campaignId } = req.params;
            const campaign = await Campaign.findById(campaignId)
                .populate('prospects');

            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campagne non trouvée'
                });
            }

            const user = await User.findById(req.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }

            // Initialiser le bot
            const bot = new LinkedInBot();
            const profiles = campaign.prospects.map(prospect => ({
                url: prospect.profileLink
            }));

            // Lancer la campagne en arrière-plan
            const results = await bot.runCampaign(
                campaignId,
                profiles,
                campaign.messageTemplate,
                {
                    email: process.env.LINKEDIN_EMAIL,
                    password: process.env.LINKEDIN_PASSWORD
                }
            );

            // Mettre à jour le statut de la campagne
            campaign.status = 'completed';
            campaign.results = results;
            await campaign.save();

            res.json({
                success: true,
                message: 'Campagne lancée avec succès',
                results
            });

        } catch (error) {
            console.error('Erreur lors du lancement de la campagne:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du lancement de la campagne',
                error: error.message
            });
        }
    },

    async pauseCampaign(req, res) {
        try {
            const { campaignId } = req.params;
            const campaign = await Campaign.findById(campaignId);

            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campagne non trouvée'
                });
            }

            campaign.status = 'paused';
            await campaign.save();

            res.json({
                success: true,
                message: 'Campagne mise en pause'
            });

        } catch (error) {
            console.error('Erreur lors de la mise en pause de la campagne:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise en pause de la campagne'
            });
        }
    },

    async getCampaignStatus(req, res) {
        try {
            const { campaignId } = req.params;
            const campaign = await Campaign.findById(campaignId);

            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campagne non trouvée'
                });
            }

            res.json({
                success: true,
                status: campaign.status,
                results: campaign.results
            });

        } catch (error) {
            console.error('Erreur lors de la récupération du statut:',       error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du statut'
            });
        }
    },

    async resumeCampaign(req, res) {
        try {
            const { campaignId } = req.params;
            const campaign = await Campaign.findById(campaignId)
                .populate('prospects');

            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campagne non trouvée'
                });
            }

            // Reprendre uniquement les prospects non traités
            const remainingProspects = campaign.prospects.filter(
                prospect => !campaign.results?.successful?.find(r => r.profile === prospect.profileLink)
            );

            if (remainingProspects.length === 0) {
                return res.json({
                    success: true,
                    message: 'Tous les prospects ont déjà été traités'
                });
            }

            const bot = new LinkedInBot();
            const profiles = remainingProspects.map(prospect => ({
                url: prospect.profileLink
            }));

            const newResults = await bot.runCampaign(
                campaignId,
                profiles,
                campaign.messageTemplate,
                {
                    email: process.env.LINKEDIN_EMAIL,
                    password: process.env.LINKEDIN_PASSWORD
                }
            );

            // Fusionner les anciens et nouveaux résultats
            campaign.results = {
                successful: [...(campaign.results?.successful || []), ...newResults.successful],
                failed: [...(campaign.results?.failed || []), ...newResults.failed],
                skipped: [...(campaign.results?.skipped || []), ...newResults.skipped]
            };

            campaign.status = 'running';
            await campaign.save();

            res.json({
                success: true,
                message: 'Campagne reprise avec succès',
                newResults
            });

        } catch (error) {
            console.error('Erreur lors de la reprise de la campagne:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la reprise de la campagne',
                error: error.message
            });
        }
    },

    async deleteCampaign(req, res) {
        try {
            const { campaignId } = req.params;
            const campaign = await Campaign.findById(campaignId);

            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campagne non trouvée'
                });
            }

            await Campaign.findByIdAndDelete(campaignId);

            res.json({
                success: true,
                message: 'Campagne supprimée avec succès'
            });

        } catch (error) {
            console.error('Erreur lors de la suppression de la campagne:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de la campagne'
            });
        }
    },

    async getCampaignAnalytics(req, res) {
        try {
            const { campaignId } = req.params;
            const campaign = await Campaign.findById(campaignId);

            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campagne non trouvée'
                });
            }

            const analytics = {
                totalProspects: campaign.prospects.length,
                successfulConnections: campaign.results?.successful?.length || 0,
                failedAttempts: campaign.results?.failed?.length || 0,
                skippedProspects: campaign.results?.skipped?.length || 0,
                completionRate: 0,
                successRate: 0
            };

            const totalAttempts = analytics.successfulConnections + analytics.failedAttempts;
            if (totalAttempts > 0) {
                analytics.successRate = (analytics.successfulConnections / totalAttempts) * 100;
            }

            const totalProcessed = totalAttempts + analytics.skippedProspects;
            if (analytics.totalProspects > 0) {
                analytics.completionRate = (totalProcessed / analytics.totalProspects) * 100;
            }

            res.json({
                success: true,
                analytics
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des analytics'
            });
        }
    }
};

module.exports = campaignController;