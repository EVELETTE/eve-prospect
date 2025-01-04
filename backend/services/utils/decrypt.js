// services/utils/decrypt.js
const crypto = require('crypto');

const decryptCredentials = {
    decrypt(encryptedValue) {
        try {
            if (!encryptedValue || !process.env.ENCRYPTION_KEY) {
                console.log('Valeurs manquantes pour le décryptage');
                return null;
            }

            const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
            const textParts = encryptedValue.split(':');
            const iv = Buffer.from(textParts.shift(), 'hex');
            const encryptedText = Buffer.from(textParts.join(':'), 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            return decrypted.toString();
        } catch (error) {
            console.error('Erreur de décryptage:', error);
            return null;
        }
    },

    encrypt(text) {
        try {
            const iv = crypto.randomBytes(16);
            const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
            const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

            let encrypted = cipher.update(text);
            encrypted = Buffer.concat([encrypted, cipher.final()]);

            return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
        } catch (error) {
            console.error('Erreur de cryptage:', error);
            return null;
        }
    }
};

module.exports = decryptCredentials;