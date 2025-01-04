// Import des dépendances principales
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');


dotenv.config();

const app = express();
const server = http.createServer(app);

// Configuration de Socket.IO
const io = socketIO(server, {
    cors: {
        origin: ['http://localhost:3000', 'https://www.linkedin.com', 'chrome-extension://'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Middleware Socket.IO
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        // Vous pouvez ajouter la vérification du token JWT ici si nécessaire
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
});

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
    console.log('Client connecté:', socket.id);

    socket.on('joinRoom', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
    });

    socket.on('disconnect', () => {
        console.log('Client déconnecté:', socket.id);
    });
});

// Configuration CORS
app.use(cors({
    origin: ['http://localhost:3000', 'https://www.linkedin.com', 'chrome-extension://'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Access-Control-Allow-Origin']
}));

app.use(express.json());

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Connecté à MongoDB avec succès");
    }).catch((err) => {
    console.error("❌ Erreur de connexion à MongoDB:", err.message);
    process.exit(1);
});

// Middleware CORS global
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Attacher io à req pour l'utiliser dans les routes
app.use((req, res, next) => {
    req.io = io;
    next();
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
const linkedinroutes = require('./routes/linkedinMessages');
const messageRoutes = require('./routes/messages');
const linkedinRoutes = require('./routes/linkedin');
const linkedinMessages = require('./routes/linkedinMessages');
const conversationsRoutes = require('./routes/conversations');
const goalsRoutes = require('./routes/goals');

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/prospects', prospectRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/lists', listsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/sequences', sequenceRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/linkedin', linkedinRoutes);
app.use('./routes/linkedinMessages', linkedinroutes)
app.use('/api/linkedin', linkedinMessages);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/goals', goalsRoutes);


// Gestion des erreurs
app.use((error, req, res, next) => {
    console.error('❌ Erreur serveur:', error);
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Une erreur est survenue sur le serveur',
        status: error.status || 500,
        timestamp: new Date().toISOString()
    });
});

sequenceProcessor.startProcessing();

// Démarrage du serveur
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
    console.error('❌ Erreur non gérée:', err);
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('👋 Arrêt du serveur...');
    process.exit(0);
});

// Exporter pour utilisation dans d'autres fichiers
module.exports = { app, io };