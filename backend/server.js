const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

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
const campaignRoutes = require('./routes/campaigns');

// Utilisation des routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes); // Lien avec les routes de campagnes
app.use('/uploads', express.static('uploads'));

//log
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

