const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Charger les variables d'environnement
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error(err));

// Import des routes
const authRoutes = require('./routes/auth');
const prospectRoutes = require('./routes/prospects');

// Utilisation des routes
app.use('/api/auth', authRoutes);
app.use('/api/prospects', prospectRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Servir le dossier statique

// Démarrer le serveur
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});