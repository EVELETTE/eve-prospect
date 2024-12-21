// services/ActionManager.js
const logger = require('./logger');
const CONSTANTS = require('./config');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class LinkedInActionManager {
    constructor(page, sessionManager) {
        this.page = page;
        this.sessionManager = sessionManager;
        this.logger = createLogger({
            format: format.combine(
                format.timestamp(),
                format.json()
            ),
            transports: [
                new transports.Console(),
                new transports.File({
                    filename: path.join(__dirname, '../logs/linkedin-error.log'),
                    level: 'error'
                }),
                new transports.File({
                    filename: path.join(__dirname, '../logs/linkedin-activity.log')
                })
            ]
        });
    }

    async typeMessage(message, selector = CONSTANTS.SELECTORS.MESSAGING.TEXTBOX) {
        try {
            await this.page.waitForSelector(selector);
            await this.page.focus(selector);

            for (const char of message) {
                await this.page.type(selector, char, {
                    delay: Math.random() * 200 + 50
                });

                if (Math.random() < 0.1) {
                    await delay(Math.random() * 1000 + 500);
                }
            }
        } catch (error) {
            logger.error('Erreur lors de la frappe:', error);
            throw error;
        }
    }

    async sendMessage(profileUrl, message, sessionId) {
        try {
            if (!this.sessionManager.checkRateLimit(sessionId)) {
                throw new Error('Limite de taux atteinte');
            }

            await this.page.goto(profileUrl, { waitUntil: 'networkidle0' });
            await this.randomDelay();

            await this.typeMessage(message);
            await this.randomDelay();

            const sendButton = await this.page.$(CONSTANTS.SELECTORS.MESSAGING.SEND);
            if (sendButton) {
                await sendButton.click();
                await this.randomDelay();
                return true;
            }

            throw new Error('Bouton d\'envoi non trouvé');

        } catch (error) {
            logger.error(`Erreur envoi message à ${profileUrl}:`, error);
            return false;
        }
    }

    async sendConnectionRequest(profileUrl, message, sessionId) {
        try {
            if (!this.sessionManager.checkRateLimit(sessionId)) {
                throw new Error('Limite de taux atteinte');
            }

            await this.page.goto(profileUrl, { waitUntil: 'networkidle0' });
            await this.randomDelay();

            const connectButton = await this.page.$(CONSTANTS.SELECTORS.CONNECT.BUTTON);
            if (!connectButton) {
                throw new Error('Bouton de connexion non trouvé');
            }

            await connectButton.click();
            await this.randomDelay();

            if (message) {
                const addNoteButton = await this.page.$(CONSTANTS.SELECTORS.CONNECT.ADD_NOTE);
                if (addNoteButton) {
                    await addNoteButton.click();
                    await this.randomDelay();
                    await this.typeMessage(message, CONSTANTS.SELECTORS.CONNECT.MESSAGE);
                }
            }

            const sendButton = await this.page.$(CONSTANTS.SELECTORS.MESSAGING.SEND);
            if (sendButton) {
                await sendButton.click();
                await this.randomDelay();
            }

            logger.info(`Invitation envoyée à ${profileUrl}`);
            return true;

        } catch (error) {
            logger.error(`Erreur envoi invitation à ${profileUrl}:`, error);
            return false;
        }
    }

    async extractConversations(sessionId) {
        try {
            if (!this.sessionManager.checkRateLimit(sessionId)) {
                throw new Error('Limite de taux atteinte');
            }

            // Vérifier l'URL actuelle
            const currentUrl = await this.page.url();
            logger.info(`URL actuelle: ${currentUrl}`);

            // Si nous ne sommes pas déjà sur la page de messagerie
            if (!currentUrl.includes('messaging')) {
                // Utiliser une navigation plus douce
                try {
                    await this.page.evaluate(() => {
                        window.location.href = 'https://www.linkedin.com/messaging';
                    });

                    // Attendre que l'URL change
                    await this.page.waitForFunction(
                        () => window.location.href.includes('messaging'),
                        { timeout: 30000 }
                    );
                } catch (navError) {
                    logger.error('Erreur de navigation douce:', navError);
                    // Fallback à la navigation directe
                    await this.page.goto('https://www.linkedin.com/messaging', {
                        waitUntil: 'domcontentloaded',
                        timeout: 30000
                    });
                }
            }

            // Attendre que le contenu soit chargé
            await this._wait(5000);

            // Vérifier si nous sommes bien sur la page de messagerie
            const isMessagingPage = await this.page.evaluate(() => {
                return window.location.href.includes('messaging');
            });

            if (!isMessagingPage) {
                throw new Error('Navigation vers la messagerie échouée');
            }

            // Attendre le chargement des conversations avec plusieurs sélecteurs
            const conversationSelectors = [
                '.msg-conversations-container__conversations-list',
                '.msg-conversation-listitem',
                '.msg-conversations-container'
            ];

            let found = false;
            for (const selector of conversationSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 10000 });
                    found = true;
                    logger.info(`Sélecteur trouvé: ${selector}`);
                    break;
                } catch (e) {
                    logger.info(`Sélecteur non trouvé: ${selector}`);
                }
            }

            if (!found) {
                throw new Error('Conteneur de conversations non trouvé');
            }

            // Extraire les conversations
            const conversations = await this.page.evaluate(() => {
                const items = Array.from(document.querySelectorAll('.msg-conversation-listitem, .msg-conversations-container__conversations-list > *'));
                return items.map(item => {
                    const nameEl = item.querySelector('.msg-conversation-listitem__participant-names');
                    const messageEl = item.querySelector('.msg-conversation-listitem__message-snippet');
                    const linkEl = item.querySelector('a[data-control-name="conversation_item"]');
                    const timeEl = item.querySelector('time');

                    return {
                        profileUrl: linkEl?.href || '',
                        name: nameEl?.textContent.trim() || '',
                        lastMessage: messageEl?.textContent.trim() || '',
                        timestamp: timeEl?.getAttribute('datetime') || new Date().toISOString()
                    };
                }).filter(conv => conv.name); // Filtrer les conversations vides
            });

            logger.info(`${conversations.length} conversations extraites`);
            return conversations;

        } catch (error) {
            logger.error('Erreur extraction conversations:', error);
            await this._takeScreenshot('conversations-error');
            throw error;
        }
    }

    async _wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async _takeScreenshot(context) {
        try {
            if (!this.page) return null;

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filePath = path.join(
                CONSTANTS.PATHS.ERROR_SCREENSHOTS,
                `${context}-${timestamp}.png`
            );

            await this.page.screenshot({
                path: filePath,
                fullPage: true
            });

            logger.info(`Screenshot saved: ${filePath}`);
            return filePath;
        } catch (error) {
            logger.error('Screenshot error:', error);
            return null;
        }
    }


    async extractMessages(profileUrl, sessionId) {
        try {
            if (!this.sessionManager.checkRateLimit(sessionId)) {
                throw new Error('Limite de taux atteinte');
            }

            await this.page.goto(profileUrl, { waitUntil: 'networkidle0' });
            await this.randomDelay();

            await this.page.waitForSelector(CONSTANTS.SELECTORS.MESSAGING.MESSAGES);

            const messages = await this.page.evaluate((selectors) => {
                const messageElements = document.querySelectorAll(selectors.MESSAGING.MESSAGES);
                return Array.from(messageElements).map(msg => ({
                    content: msg.querySelector('.msg-s-event-listitem__body')?.textContent.trim() || '',
                    isFromUser: msg.classList.contains('msg-s-message-list__event--from-sender'),
                    timestamp: msg.querySelector('time')?.dateTime || new Date().toISOString()
                }));
            }, CONSTANTS.SELECTORS);

            return messages;

        } catch (error) {
            logger.error(`Erreur extraction messages pour ${profileUrl}:`, error);
            throw error;
        }
    }

    async extractProfileInfo(profileUrl, sessionId) {
        try {
            if (!this.sessionManager.checkRateLimit(sessionId)) {
                throw new Error('Limite de taux atteinte');
            }

            await this.page.goto(profileUrl, { waitUntil: 'networkidle0' });
            await this.randomDelay();

            const profileData = await this.page.evaluate((selectors) => ({
                name: document.querySelector(selectors.PROFILE.NAME)?.textContent.trim() || '',
                title: document.querySelector(selectors.PROFILE.TITLE)?.textContent.trim() || '',
                location: document.querySelector(selectors.PROFILE.LOCATION)?.textContent.trim() || '',
                company: document.querySelector(selectors.PROFILE.COMPANY)?.textContent.trim() || '',
                about: document.querySelector(selectors.PROFILE.ABOUT)?.textContent.trim() || '',
                experience: Array.from(document.querySelectorAll(selectors.PROFILE.EXPERIENCE)).map(exp => ({
                    title: exp.querySelector('.t-bold')?.textContent.trim() || '',
                    company: exp.querySelector('.t-normal')?.textContent.trim() || '',
                    duration: exp.querySelector('.date-range')?.textContent.trim() || ''
                }))
            }), CONSTANTS.SELECTORS);

            logger.info(`Informations extraites pour ${profileUrl}`);
            return profileData;

        } catch (error) {
            logger.error(`Erreur extraction profil ${profileUrl}:`, error);
            return null;
        }
    }
}

module.exports = LinkedInActionManager;