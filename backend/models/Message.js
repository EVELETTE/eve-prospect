const mongoose = require('mongoose');

const LinkedInMessageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    prospectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prospect',
        required: true
    },
    linkedinMessageId: String,
    content: String,
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'read'],
        default: 'pending'
    },
    type: {
        type: String,
        enum: ['invitation', 'message'],
        required: true
    },
    direction: {
        type: String,
        enum: ['sent', 'received'],
        required: true
    }
}, { timestamps: true });
