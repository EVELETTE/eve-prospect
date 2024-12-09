// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: function() {
            return `https://ui-avatars.com/api/?name=${this.firstName}%20${this.lastName}&background=random`;
        }
    },
    linkedinCredentials: {
        email: {
            type: String,
            default: null
        },
        password: {
            type: String,
            default: null
        },
        isConnected: {
            type: Boolean,
            default: false
        },
        lastCheck: {
            type: Date,
            default: null
        }
    },
    campaigns: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign'
    }],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);