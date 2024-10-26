const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Référence à l'utilisateur propriétaire
    status: { type: String, default: 'active' },
    prospects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Prospect' }] // Optionnel pour ajouter des prospects plus tard
});

module.exports = mongoose.model('Campaign', CampaignSchema);
