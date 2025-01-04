const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

// Route de synchronisation LinkedIn
router.post('/sync', conversationController.synchroniserConversations);

// Récupérer toutes les conversations
router.get('/', conversationController.getConversations);

// Ajouter un message
router.post('/:conversationId/messages', conversationController.ajouterMessage);

module.exports = router;
