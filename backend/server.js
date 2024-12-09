// Import des dépendances principales
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config(); // Charge les variables d'environnement depuis le fichier `.env`

const app = express();

// Configuration avancée de CORS pour gérer les requêtes de différentes origines
app.use(cors({
    origin: ['http://localhost:3000', 'https://www.linkedin.com', 'chrome-extension://'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Access-Control-Allow-Origin']
}));

// Middleware pour analyser le corps des requêtes en JSON
app.use(express.json());

// Connexion à la base de données MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ Connecté à MongoDB avec succès");
}).catch((err) => {
    console.error("❌ Erreur de connexion à MongoDB:", err.message);
    process.exit(1); // Quitte le processus en cas d'erreur critique
});

// Middleware pour configurer les headers CORS sur toutes les routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200); // Répond immédiatement aux requêtes OPTIONS
    } else {
        next();
    }
});

// Import des routes
const authRoutes = require('./routes/auth');
const prospectRoutes = require('./routes/prospects');
const listsRoutes = require('./routes/lists');
const notificationsRoutes = require('./routes/notifications');
const campaignRoutes = require('./routes/campaigns');
const sequenceRoutes = require('./routes/sequences');
const automationRoutes = require('./routes/automation');
const sequenceProcessor = require('./services/SequenceProcessor');



// Déclaration des routes API
app.use('/api/auth', authRoutes); // Gestion de l'authentification
app.use('/api/prospects', prospectRoutes); // Gestion des prospects
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Accès aux fichiers statiques
app.use('/api/lists', listsRoutes); // Gestion des listes
app.use('/api/notifications', notificationsRoutes); // Gestion des notifications
app.use('/api/campaigns', campaignRoutes);
app.use('/api/sequences', sequenceRoutes);
app.use('/api/automation', automationRoutes);

// Middleware pour gérer les erreurs globales
app.use((error, req, res, next) => {
    console.error('❌ Erreur serveur:', error); // Affiche l'erreur dans la console
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Une erreur est survenue sur le serveur',
        status: error.status || 500,
        timestamp: new Date().toISOString()
    });
});

sequenceProcessor.startProcessing();

// Démarrage du serveur sur le port défini dans les variables d'environnement ou sur le port 5001 par défaut
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});

// Gestion des promesses non gérées
process.on('unhandledRejection', (err) => {
    console.error('❌ Erreur non gérée:', err);
    process.exit(1); // Quitte le processus proprement en cas d'erreur non capturée
});

// Gestion de l'arrêt du serveur (SIGTERM)
process.on('SIGTERM', () => {
    console.log('👋 Arrêt du serveur...');
    process.exit(0);
});
