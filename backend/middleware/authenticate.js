// backend/middleware/authenticate.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    try {
        // Vérifier la présence de l'en-tête d'autorisation
        const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
        }

        // Décoder le token et vérifier le JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Assigner l'ID utilisateur extrait du token à `req.userId`
        req.userId = decoded.id;

        next(); // Passer au middleware ou à la route suivante
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        res.status(401).json({ message: 'Token invalide ou expiré' });
    }
};

module.exports = authenticate;
