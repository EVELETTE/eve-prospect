const mongoose = require('mongoose');

const prospectSchema = new mongoose.Schema({
    // Informations de base (existantes)
    firstName: {
        type: String,
        required: [true, 'Le prénom est requis'],
        get: v => v ? v.trim() : v
    },
    lastName: {
        type: String,
        required: [true, 'Le nom est requis'],
        get: v => v ? v.trim() : v
    },
    profileLink: {
        type: String,
        required: [true, 'Le lien du profil est requis'],
        unique: true,
        index: true
    },
    email: {
        type: String,
        default: 'Non disponible',
        trim: true
    },
    company: {
        type: String,
        default: 'Non disponible',
        trim: true
    },
    location: {
        type: String,
        default: 'Non disponible',
        trim: true
    },

    // Nouvelles informations
    position: {
        type: String,
        default: 'Non disponible',
        trim: true
    },
    description: {
        type: String,
        default: 'Non disponible',
        trim: true
    },

    // Métadonnées
    status: {
        type: String,
        enum: ['nouveau', 'contacté', 'intéressé', 'converti', 'refusé'],
        default: 'nouveau'
    },
    source: {
        type: String,
        enum: ['recherche', 'profil', 'suggestion'],
        default: 'profil'
    },
    extractedAt: {
        type: Date,
        default: Date.now
    },
    lastContactedAt: Date,

    // Relations (existantes + nouvelles)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    listId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'List',
        default: null
    }
}, {
    timestamps: true,
    toJSON: { getters: true }
});

// Index composé pour l'unicité par utilisateur
prospectSchema.index({ profileLink: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Prospect', prospectSchema);