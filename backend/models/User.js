const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: {
        type: String,
        default: function() {
            return `https://avatars.dicebear.com/api/initials/${this.firstName}%20${this.lastName}.svg`;
        }
    },
    campaigns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
});

module.exports = mongoose.model('User', UserSchema);
