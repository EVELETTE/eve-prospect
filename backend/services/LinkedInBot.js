// services/LinkedInBot.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('random-useragent');
const { createLogger, format, transports } = require('winston');
const mongoose = require('mongoose');

// Configuration des plugins
puppeteer.use(StealthPlugin());

// Configuration du logger
const logger = createLogger({
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new transports.File({ filename: 'bot-error.log', level: 'error' }),
        new transports.File({ filename: 'bot-activity.log' })
    ]
});

class LinkedInBot {
    constructor() {
        this.browser = null;
        this.page = null;
        this.MIN_DELAY = 2000;
        this.MAX_DELAY = 5000;
        this.MAX_ACTIONS_PER_DAY = 100;
        this.sessionData = new Map();
    }

    async initialize(sessionId) {
        try {
            // Configuration du navigateur avec des options anti-détection
            this.browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-infobars',
                    '--window-position=0,0',
                    '--ignore-certifcate-errors',
                    '--ignore-certifcate-errors-spki-list',
                    '--disable-notifications',
                    '--disable-blink-features=AutomationControlled'
                ],
                defaultViewport: {
                    width: 1920,
                    height: 1080
                }
            });

            // Création d'une nouvelle page
            this.page = await this.browser.newPage();

            // Configuration des headers pour éviter la détection
            await this.page.setUserAgent(randomUseragent.getRandom());
            await this.page.setExtraHTTPHeaders({
                'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
            });

            // Injection de scripts pour contourner la détection
            await this.page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
                window.navigator.chrome = {
                    runtime: {}
                };
            });

            // Initialisation de la session
            this.sessionData.set(sessionId, {
                actionsToday: 0,
                lastActionTime: null
            });

            logger.info(`Bot initialisé pour la session ${sessionId}`);
            return true;

        } catch (error) {
            logger.error('Erreur lors de l\'initialisation du bot:', error);
            throw error;
        }
    }

    async login(email, password) {
        try {
            await this.page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle0' });
            await this.randomDelay();

            // Remplir les champs de connexion
            await this.page.type('#username', email);
            await this.page.type('#password', password);
            await this.randomDelay();

            // Cliquer sur le bouton de connexion
            await this.page.click('button[type="submit"]');
            await this.page.waitForNavigation({ waitUntil: 'networkidle0' });

            // Vérifier si la connexion a réussi
            const isLoggedIn = await this.page.evaluate(() => {
                return document.querySelector('.feed-identity-module') !== null;
            });

            if (!isLoggedIn) {
                throw new Error('Échec de la connexion LinkedIn');
            }

            logger.info(`Connexion réussie pour ${email}`);
            return true;

        } catch (error) {
            logger.error('Erreur de connexion:', error);
            throw error;
        }
    }

    async visitProfile(profileUrl, sessionId) {
        try {
            await this.checkRateLimit(sessionId);
            await this.randomDelay();

            await this.page.goto(profileUrl, { waitUntil: 'networkidle0' });

            // Simuler le scroll
            await this.simulateReading();

            // Extraire les informations du profil
            const profileData = await this.extractProfileInfo();

            logger.info(`Profil visité: ${profileUrl}`);
            return profileData;

        } catch (error) {
            logger.error(`Erreur lors de la visite du profil ${profileUrl}:`, error);
            throw error;
        }
    }

    async sendConnectionRequest(profileUrl, message, sessionId) {
        try {
            await this.checkRateLimit(sessionId);
            await this.page.goto(profileUrl, { waitUntil: 'networkidle0' });
            await this.randomDelay();

            // Cliquer sur le bouton de connexion
            const connectButton = await this.page.$('button[aria-label*="Se connecter"], button[aria-label*="Connect"]');
            if (!connectButton) {
                throw new Error('Bouton de connexion non trouvé');
            }

            await connectButton.click();
            await this.randomDelay();

            // Ajouter un message si fourni
            if (message) {
                const addNoteButton = await this.page.$('button[aria-label*="Ajouter une note"]');
                if (addNoteButton) {
                    await addNoteButton.click();
                    await this.randomDelay();

                    await this.page.type('textarea[name="message"]', message);
                    await this.randomDelay();
                }
            }

            // Envoyer l'invitation
            const sendButton = await this.page.$('button[aria-label*="Envoyer"]');
            if (sendButton) {
                await sendButton.click();
                await this.randomDelay();
            }

            logger.info(`Invitation envoyée à ${profileUrl}`);
            return true;

        } catch (error) {
            logger.error(`Erreur lors de l'envoi de l'invitation à ${profileUrl}:`, error);
            throw error;
        }
    }

    async sendMessage(profileUrl, message, sessionId) {
        try {
            await this.checkRateLimit(sessionId);
            await this.page.goto(profileUrl, { waitUntil: 'networkidle0' });
            await this.randomDelay();

            // Cliquer sur le bouton de message
            const messageButton = await this.page.$('button[aria-label*="Message"]');
            if (!messageButton) {
                throw new Error('Bouton de message non trouvé');
            }

            await messageButton.click();
            await this.randomDelay();

            // Écrire et envoyer le message
            await this.page.type('div[role="textbox"]', message);
            await this.randomDelay();

            const sendButton = await this.page.$('button[aria-label*="Envoyer"]');
            if (sendButton) {
                await sendButton.click();
                await this.randomDelay();
            }

            logger.info(`Message envoyé à ${profileUrl}`);
            return true;

        } catch (error) {
            logger.error(`Erreur lors de l'envoi du message à ${profileUrl}:`, error);
            throw error;
        }
    }

    async extractProfileInfo() {
        try {
            return await this.page.evaluate(() => ({
                name: document.querySelector('h1.text-heading-xlarge')?.textContent.trim(),
                title: document.querySelector('div.text-body-medium')?.textContent.trim(),
                location: document.querySelector('.text-body-small.inline.t-black--light.break-words')?.textContent.trim(),
                company: document.querySelector('.pv-text-details__right-panel .inline-show-more-text')?.textContent.trim(),
                about: document.querySelector('div#about')?.textContent.trim(),
                experience: Array.from(document.querySelectorAll('.experience-section li')).map(exp => ({
                    title: exp.querySelector('.t-bold')?.textContent.trim(),
                    company: exp.querySelector('.t-normal')?.textContent.trim(),
                    duration: exp.querySelector('.t-normal.t-black--light')?.textContent.trim()
                }))
            }));
        } catch (error) {
            logger.error('Erreur lors de l\'extraction des informations du profil:', error);
            throw error;
        }
    }

    async runCampaign(campaignId, profiles, messageTemplate, options = {}) {
        const sessionId = `campaign_${campaignId}`;
        const results = {
            successful: [],
            failed: [],
            skipped: []
        };

        try {
            await this.initialize(sessionId);
            await this.login(options.email, options.password);

            for (const profile of profiles) {
                try {
                    const profileData = await this.visitProfile(profile.url, sessionId);
                    await this.randomDelay();

                    // Personnaliser le message
                    const personalizedMessage = messageTemplate
                        .replace('{{name}}', profileData.name || '')
                        .replace('{{company}}', profileData.company || '');

                    // Envoyer la demande de connexion
                    await this.sendConnectionRequest(profile.url, personalizedMessage, sessionId);

                    results.successful.push({
                        profile: profile.url,
                        data: profileData
                    });

                    await this.randomDelay();

                } catch (error) {
                    logger.error(`Erreur pour le profil ${profile.url}:`, error);
                    results.failed.push({
                        profile: profile.url,
                        error: error.message
                    });
                }
            }

        } catch (error) {
            logger.error(`Erreur lors de la campagne ${campaignId}:`, error);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }

        return results;
    }

    async randomDelay() {
        const delay = Math.floor(Math.random() * (this.MAX_DELAY - this.MIN_DELAY + 1)) + this.MIN_DELAY;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    async checkRateLimit(sessionId) {
        const session = this.sessionData.get(sessionId);
        if (!session) {
            throw new Error('Session non trouvée');
        }

        const now = new Date();
        if (session.lastActionTime) {
            const lastActionDay = new Date(session.lastActionTime).setHours(0, 0, 0, 0);
            const today = now.setHours(0, 0, 0, 0);

            if (lastActionDay < today) {
                session.actionsToday = 0;
            }
        }

        if (session.actionsToday >= this.MAX_ACTIONS_PER_DAY) {
            throw new Error('Limite quotidienne d\'actions atteinte');
        }

        session.lastActionTime = now;
        session.actionsToday++;
        this.sessionData.set(sessionId, session);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }
}

module.exports = LinkedInBot;