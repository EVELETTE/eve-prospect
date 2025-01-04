const mongoose = require('mongoose');

const SequenceModel = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    prospectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prospect',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'paused', 'completed', 'failed'],
        default: 'draft'
    },
    templateId: {
        type: String,
        required: true
    },
    steps: [{
        type: {
            type: String,
            enum: ['connection', 'message', 'email'],
            required: true
        },
        template: {
            type: String,
            required: true
        },
        delay: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ['pending', 'scheduled', 'completed', 'failed'],
            default: 'pending'
        },
        scheduledDate: Date,
        completedDate: Date,
        error: String
    }],
    currentStep: {
        type: Number,
        default: 0
    },
    lastExecutionDate: Date,
    nextExecutionDate: Date,
    executionLogs: [{
        date: { type: Date, default: Date.now },
        action: String,
        status: String,
        message: String
    }],
    settings: {
        maxRetries: { type: Number, default: 3 },
        retryDelay: { type: Number, default: 60 }, // minutes
        workingHours: {
            start: { type: String, default: '09:00' },
            end: { type: String, default: '17:00' }
        },
        workingDays: {
            type: [String],
            default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
    }
}, {
    timestamps: true
});

SequenceModel.index({ userId: 1, prospectId: 1 });
SequenceModel.index({ status: 1, nextExecutionDate: 1 });

module.exports = mongoose.model('Sequence', SequenceModel);