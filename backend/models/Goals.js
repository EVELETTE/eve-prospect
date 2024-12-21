// models/Goals.js
const mongoose = require('mongoose');

const GoalsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    monthly: {
        prospects: {
            type: Number,
            default: 100
        },
        messages: {
            type: Number,
            default: 50
        },
        connections: {
            type: Number,
            default: 30
        },
        responses: {
            type: Number,
            default: 20
        },
        conversions: {
            type: Number,
            default: 10
        }
    }
}, {
    timestamps: true
});