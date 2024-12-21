// services/LinkedInBot.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const EventEmitter = require('events');
const logger = require('./logger');
const CONSTANTS = require('./config');
const SessionManager = require('./SessionManager');
const LinkedInActionManager = require('./ActionManager');
const { setupBrowser } = require('./utils/helpers');
const decryptCredentials = require('./utils/decrypt');

puppeteer.use(StealthPlugin());

class LinkedInBot extends EventEmitter {
    constructor() {
        super();
        this.browser = null;
        this.page = null;
        this.sessionManager = new SessionManager();
        this.actionManager = null;
        this.isLoggedIn = false;
        this.sessionId = null;
        this.isClosing = false;
        this.lastLoginCheck = null;
        this.loginCheckInterval = 5 * 60 * 1000; // 5 minutes
    }

    async initialize(sessionId = 'default') {
        try {
            this.sessionId = sessionId;
            logger.info(`Initialisation du bot (Session: ${sessionId})`);
            this.sessionManager.initSession(sessionId);

            const browserConfig = {
                headless: false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-notifications',
                    '--start-maximized',
                    '--disable-blink-features=AutomationControlled',
                    '--window-size=1920,1080'
                ],
                defaultViewport: {
                    width: 1920,
                    height: 1080
                }
            };

            this.browser = await puppeteer.launch(browserConfig);
            this.page = await this.browser.newPage();

            await this._setupAntiDetection();
            this.actionManager = new LinkedInActionManager(this.page, this.sessionManager);

            // Configuration des timeouts
            await this.page.setDefaultNavigationTimeout(CONSTANTS.NAVIGATION_TIMEOUT);
            await this.page.setDefaultTimeout(CONSTANTS.NAVIGATION_TIMEOUT);

            await this._setupEventListeners();

            logger.info('Bot initialisé avec succès');
            return true;

        } catch (error) {
            logger.error('Erreur lors de l\'initialisation:', error);
            await this._takeErrorScreenshot('init-error');
            return false;
        }
    }

    async _setupAntiDetection() {
        const userAgent = CONSTANTS.USER_AGENTS[
            Math.floor(Math.random() * CONSTANTS.USER_AGENTS.length)
            ];

        await this.page.setUserAgent(userAgent);
        await this.page.setExtraHTTPHeaders({
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
        });

        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            window.chrome = {
                runtime: {},
                loadTimes: () => {},
                csi: () => {},
                app: {}
            };
            Object.defineProperty(navigator, 'permissions', {
                get: () => ({
                    query: () => Promise.resolve({ state: 'granted' })
                })
            });
        });
    }

    async login(encryptedEmail, encryptedPassword) {
        try {
            logger.info('Tentative de connexion à LinkedIn');

            // Décrypter les identifiants
            const email = decryptCredentials.decrypt(encryptedEmail);
            const password = decryptCredentials.decrypt(encryptedPassword);

            console.log('Email décrypté:', email); // Pour le debug

            if (!email || !password) {
                logger.error('Identifiants invalides ou non décryptés');
                return false;
            }

            await this.page.goto(CONSTANTS.URLs.LOGIN, {
                waitUntil: 'networkidle0',
                timeout: CONSTANTS.NAVIGATION_TIMEOUT
            });

            await this._wait(2000);

            // Remplir le formulaire avec les identifiants décryptés
            await this._humanType('#username', email);
            await this._wait(2000);
            await this._humanType('#password', password);
            await this._wait(2000);

            // Cliquer sur le bouton de connexion
            await this.page.click('button[type="submit"]');

            // Attendre et vérifier la connexion
            for (let i = 0; i < 5; i++) {
                await this._wait(5000);
                if (await this._checkLoginStatus()) {
                    this.isLoggedIn = true;
                    this.lastLoginCheck = Date.now();
                    logger.info('Connexion réussie');
                    return true;
                }
                logger.info(`Tentative de vérification ${i + 1}/5`);
            }

            logger.warn('Impossible de confirmer la connexion');
            await this._takeErrorScreenshot('login-failed');
            return false;

        } catch (error) {
            logger.error('Erreur lors de la connexion:', error);
            await this._takeErrorScreenshot('login-error');
            return false;
        }
    }

    async _checkLoginStatus() {
        try {
            // Vérifier si la session est encore valide
            if (this.lastLoginCheck &&
                Date.now() - this.lastLoginCheck < this.loginCheckInterval) {
                return true;
            }

            const currentUrl = await this.page.url();

            // Vérification par URL
            if (currentUrl.includes('feed') ||
                currentUrl.includes('mynetwork') ||
                currentUrl.includes('messaging')) {
                return true;
            }

            // Vérification par éléments de la page
            const isLoggedIn = await this.page.evaluate((selectors) => {
                return !!document.querySelector(selectors.NAV.GLOBAL) &&
                    !!document.querySelector(selectors.NAV.IDENTITY);
            }, CONSTANTS.SELECTORS);

            if (isLoggedIn) {
                this.lastLoginCheck = Date.now();
            }

            return isLoggedIn;

        } catch (error) {
            logger.error('Erreur vérification statut:', error);
            return false;
        }
    }

    async _humanType(selector, text) {
        try {
            await this.page.waitForSelector(selector);
            for (const char of text) {
                await this.page.type(selector, char, {
                    delay: Math.random() * 100 + 50
                });
                if (Math.random() < 0.1) {
                    await this._wait(Math.random() * 500 + 200);
                }
            }
        } catch (error) {
            logger.error(`Erreur lors de la frappe sur ${selector}:`, error);
            throw error;
        }
    }

    async _wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async _takeErrorScreenshot(context) {
        if (!this.page) return null;

        try {
            const timestamp = Date.now();
            const filename = path.join(
                CONSTANTS.PATHS.ERROR_SCREENSHOTS,
                `error-${context}-${timestamp}.png`
            );

            await this.page.screenshot({
                path: filename,
                fullPage: true,
                quality: CONSTANTS.SCREENSHOT_QUALITY
            });

            logger.info(`Capture d'écran sauvegardée: ${filename}`);
            return filename;
        } catch (error) {
            logger.error('Erreur lors de la capture d\'écran:', error);
            return null;
        }
    }

    async _setupEventListeners() {
        this.browser.on('disconnected', async () => {
            if (!this.isClosing && this.sessionManager.canRetry(this.sessionId)) {
                logger.warn('Reconnexion après déconnexion...');
                await this.initialize(this.sessionId);
            }
        });

        this.page.on('error', error => {
            logger.error('Erreur de page:', error);
            this.emit('error', error);
        });

        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                logger.error('Console error:', msg.text());
            }
        });
    }

    // Méthodes publiques pour l'interaction
    async getConversations() {
        return await this.actionManager.extractConversations(this.sessionId);
    }

    async getMessages(profileUrl) {
        return await this.actionManager.extractMessages(profileUrl, this.sessionId);
    }

    async sendMessage(profileUrl, message) {
        return await this.actionManager.sendMessage(profileUrl, message, this.sessionId);
    }

    async sendConnectionRequest(profileUrl, message = null) {
        return await this.actionManager.sendConnectionRequest(profileUrl, message, this.sessionId);
    }

    async getProfileInfo(profileUrl) {
        return await this.actionManager.extractProfileInfo(profileUrl, this.sessionId);
    }

    async close() {
        try {
            this.isClosing = true;
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
                this.page = null;
                logger.info('Bot fermé avec succès');
            }
        } catch (error) {
            logger.error('Erreur lors de la fermeture:', error);
        } finally {
            this.isClosing = false;
            this.sessionManager.clearSession(this.sessionId);
        }
    }
}

module.exports = LinkedInBot;