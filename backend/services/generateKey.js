const crypto = require('crypto');

// Générer une clé aléatoire de 32 bytes (256 bits) et la convertir en base64
const generateEncryptionKey = () => {
    const key = crypto.randomBytes(64).toString('base64');
    console.log('ENCRYPTION_KEY=' + key);
};

generateEncryptionKey();