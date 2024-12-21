// config.js
const path = require('path');

const CONSTANTS = {
    MIN_DELAY: 2000,
    MAX_DELAY: 5000,
    MAX_ACTIONS_PER_DAY: 100,
    NAVIGATION_TIMEOUT: 60000,
    RETRY_ATTEMPTS: 3,
    SCREENSHOT_QUALITY: 100,
    USER_AGENTS: [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ],
    SELECTORS: {
        LOGIN: {
            USERNAME: '#username',
            PASSWORD: '#password',
            SUBMIT: 'button[type="submit"]'
        },
        MESSAGING: {
            TEXTBOX: 'div[role="textbox"]',
            SEND: 'button[aria-label*="Envoyer"]',
            CONVERSATIONS: '.msg-conversation-listitem',
            MESSAGES: '.msg-s-message-list__event'
        },
        PROFILE: {
            NAME: 'h1.text-heading-xlarge',
            TITLE: '.text-body-medium',
            LOCATION: '.text-body-small.inline.t-black--light',
            COMPANY: '.inline-show-more-text',
            ABOUT: 'div#about',
            EXPERIENCE: '.experience-section li'
        },
        CONNECT: {
            BUTTON: 'button[aria-label*="Se connecter"], button[aria-label*="Connect"]',
            ADD_NOTE: 'button[aria-label*="Ajouter une note"]',
            MESSAGE: 'textarea[name="message"]'
        },
        NAV: {
            GLOBAL: '.global-nav',
            IDENTITY: '.feed-identity-module'
        }
    },
    PATHS: {
        LOGS: path.join(__dirname, '../logs'),
        SCREENSHOTS: path.join(__dirname, '../screenshots'),
        ERROR_SCREENSHOTS: path.join(__dirname, '../error-screenshots')
    },
    URLs: {
        LOGIN: 'https://www.linkedin.com/login',
        MESSAGING: 'https://www.linkedin.com/messaging'
    }
};

module.exports = CONSTANTS;