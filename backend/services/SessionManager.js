// SessionManager.js
const logger = require('./logger');
const CONSTANTS = require('./config');

class SessionManager {
    constructor() {
        this.sessions = new Map();
    }

    initSession(sessionId) {
        this.sessions.set(sessionId, {
            actionsToday: 0,
            lastActionTime: null,
            currentRetries: 0
        });
        logger.info(`Session initialisée: ${sessionId}`);
    }

    checkRateLimit(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            logger.error(`Session non trouvée: ${sessionId}`);
            return false;
        }

        const now = new Date();
        const resetTime = new Date(now.setHours(0, 0, 0, 0));

        if (session.lastActionTime && session.lastActionTime < resetTime) {
            session.actionsToday = 0;
        }

        if (session.actionsToday >= CONSTANTS.MAX_ACTIONS_PER_DAY) {
            logger.warn(`Limite quotidienne atteinte pour ${sessionId}`);
            return false;
        }

        session.actionsToday++;
        session.lastActionTime = now;
        this.sessions.set(sessionId, session);

        return true;
    }

    canRetry(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        if (session.currentRetries < CONSTANTS.RETRY_ATTEMPTS) {
            session.currentRetries++;
            this.sessions.set(sessionId, session);
            return true;
        }

        return false;
    }

    resetRetries(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.currentRetries = 0;
            this.sessions.set(sessionId, session);
        }
    }

    getSessionInfo(sessionId) {
        return this.sessions.get(sessionId);
    }

    clearSession(sessionId) {
        this.sessions.delete(sessionId);
    }
}

module.exports = SessionManager;