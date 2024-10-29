// backend/models/ProspectList.js
const mongoose = require('mongoose');

const ProspectSchema = new mongoose.Schema({
    nom: String,
    prenom: String,
    email: String,
    societe: String,
    linkedin: String,
});

const ProspectListSchema = new mongoose.Schema({
    name: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    prospects: [ProspectSchema]
});

module.exports = mongoose.model('ProspectList', ProspectListSchema);