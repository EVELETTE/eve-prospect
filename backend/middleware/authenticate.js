// middleware/authenticate.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                message: 'Accès refusé. Aucun token fourni.'
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        message: 'Token expiré. Veuillez vous reconnecter.'
                    });
                }
                return res.status(401).json({
                    message: 'Token invalide'
                });
            }

            req.userId = decoded.id;
            next();
        });
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        res.status(500).json({
            message: 'Erreur serveur lors de l\'authentification.'
        });
    }
};

module.exports = authenticate;