// routes/goals.js
const express = require('express');
const router = express.Router();
const goalsController = require('../controllers/goalsController');
const authenticate = require('../middleware/authenticate');

// Protéger toutes les routes avec l'authentification
router.use(authenticate);

// Récupérer les objectifs de l'utilisateur
router.get('/', goalsController.getGoals);

// Mettre à jour les objectifs
router.post('/', goalsController.updateGoals);

// Obtenir les statistiques de progression
router.get('/progress', goalsController.getProgress);

module.exports = router;