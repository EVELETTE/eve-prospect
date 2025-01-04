// routes/campaigns.js
const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const authenticate = require('../middleware/authenticate');

// Routes protégées par authentification
router.use(authenticate);

// Lancer une campagne
router.post('/:campaignId/start', campaignController.startCampaign);

// Mettre en pause une campagne
router.put('/:campaignId/pause', campaignController.pauseCampaign);

// Reprendre une campagne
router.put('/:campaignId/resume', campaignController.resumeCampaign);

// Supprimer une campagne
router.delete('/:campaignId', campaignController.deleteCampaign);

// Obtenir le statut d'une campagne
router.get('/:campaignId/status', campaignController.getCampaignStatus);

// Obtenir les analytics d'une campagne
router.get('/:campaignId/analytics', campaignController.getCampaignAnalytics);

module.exports = router;