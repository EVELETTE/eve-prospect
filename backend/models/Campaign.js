// models/Campaign.js
const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'running', 'paused', 'completed', 'failed'],
        default: 'draft'
    },
    messageTemplate: {
        type: String,
        required: true
    },
    prospects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prospect'
    }],
    results: {
        successful: [{
            profile: String,
            data: mongoose.Schema.Types.Mixed,
            timestamp: { type: Date, default: Date.now }
        }],
        failed: [{
            profile: String,
            error: String,
            timestamp: { type: Date, default: Date.now }
        }],
        skipped: [{
            profile: String,
            reason: String,
            timestamp: { type: Date, default: Date.now }
        }]
    },
    settings: {
        maxActionsPerDay: {
            type: Number,
            default: 100
        },
        minDelay: {
            type: Number,
            default: 2000
        },
        maxDelay: {
            type: Number,
            default: 5000
        },
        runningDays: {
            type: [String],
            default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        },
        activeHours: {
            start: { type: String, default: '09:00' },
            end: { type: String, default: '17:00' }
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Campaign', CampaignSchema);