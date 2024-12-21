// models/Conversation.js
const mongoose = require('mongoose');

// Schema du prospect embarqué
const ProspectInfoSchema = new mongoose.Schema({
    linkedinUrl: String,
    prenom: {
        type: String,
        default: 'Inconnu'
    },
    nom: {
        type: String,
        default: 'Inconnu'
    },
    societe: {
        type: String,
        default: 'Inconnue'
    }
}, { _id: false });

// Schema du message
const MessageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    sender: {
        type: String,
        enum: ['utilisateur', 'prospect'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Schema principal de conversation
const ConversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    prospect: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prospect',
        default: null
    },
    prospectInfo: {
        type: ProspectInfoSchema,
        default: () => ({})
    },
    messages: [MessageSchema],
    dernierMessage: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Middleware pour valider qu'il y a soit un prospect soit des infos prospect
ConversationSchema.pre('save', function(next) {
    if (!this.prospect && !this.prospectInfo.linkedinUrl) {
        const err = new Error('Une conversation doit avoir soit un prospect soit des informations de prospect');
        next(err);
    }
    next();
});

const Conversation = mongoose.model('Conversation', ConversationSchema);

module.exports = Conversation;
