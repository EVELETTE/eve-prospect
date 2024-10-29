const mongoose = require('mongoose');

const prospectSchema = new mongoose.Schema({
    nom: String,
    prenom: String,
    email: String,
    societe: String,
    linkedin: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Prospect', prospectSchema);