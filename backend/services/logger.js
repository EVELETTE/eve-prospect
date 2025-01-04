// logger.js
const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const path = require('path');
const CONSTANTS = require('./config');

// Création des dossiers nécessaires
Object.values(CONSTANTS.PATHS).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const logger = createLogger({
    format: format.combine(
        format.timestamp(),
        format.printf(({ level, message, timestamp }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new transports.File({
            filename: path.join(CONSTANTS.PATHS.LOGS, 'error.log'),
            level: 'error'
        }),
        new transports.File({
            filename: path.join(CONSTANTS.PATHS.LOGS, 'activity.log')
        }),
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            )
        })
    ]
});

module.exports = logger;