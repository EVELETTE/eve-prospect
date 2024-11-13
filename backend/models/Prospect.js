// models/Prospect.js
const mongoose = require('mongoose');

const prospectSchema = new mongoose.Schema({
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
        unique: true
    },
    email: String,
    company: String,
    location: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Prospect', prospectSchema);