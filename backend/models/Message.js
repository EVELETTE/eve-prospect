// models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    sender: {
        type: String,
        enum: ['user', 'prospect'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'error'],
        default: 'pending'
    },
    error: String,
    linkedinMessageId: String,
    read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', MessageSchema);