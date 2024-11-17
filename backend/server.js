const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');


dotenv.config();

const app = express();

// Configuration CORS améliorée
app.use(cors({
    origin: ['http://localhost:3000', 'https://www.linkedin.com', 'chrome-extension://'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Access-Control-Allow-Origin']
}));

app.use(express.json());

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ Connecté à MongoDB avec succès");
}).catch((err) => {
    console.error("❌ Erreur de connexion à MongoDB:", err.message);
    process.exit(1);
});

// Middleware pour les headers CORS sur toutes les routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

const authRoutes = require('./routes/auth');
const prospectRoutes = require('./routes/prospects');
const listsRoutes = require('./routes/lists');
const notificationRoutes = require('./routes/notifications');

app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/prospects', prospectRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/lists', listsRoutes);

// Middleware de gestion des erreurs
app.use((error, req, res, next) => {
    console.error('❌ Erreur serveur:', error);
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Une erreur est survenue sur le serveur',
        status: error.status || 500,
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Erreur non gérée:', err);
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('👋 Arrêt du serveur...');
    process.exit(0);
});