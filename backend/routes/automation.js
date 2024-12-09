const express = require('express');
const router = express.Router();
const sequenceController = require('../controllers/sequenceController');
const authenticate = require('../middleware/authenticate');

// Protéger toutes les routes avec l'authentification
router.use(authenticate);

// Créer une nouvelle séquence
router.post('/sequences', sequenceController.createSequence);

// Récupérer les séquences
router.get('/sequences', sequenceController.getSequences);

// Démarrer une séquence
router.post('/sequences/:sequenceId/start', sequenceController.startSequence);

// Mettre en pause une séquence
router.post('/sequences/:sequenceId/pause', sequenceController.pauseSequence);

// Reprendre une séquence
router.post('/sequences/:sequenceId/resume', sequenceController.resumeSequence);

// Mettre à jour une séquence
router.put('/sequences/:sequenceId', sequenceController.updateSequence);

// Supprimer une séquence
router.delete('/sequences/:sequenceId', sequenceController.deleteSequence);

module.exports = router;
