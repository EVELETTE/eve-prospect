// services/utils/helpers.js
const fs = require('fs');
const path = require('path');
const CONSTANTS = require('../config');
const logger = require('../logger');

/**
 * Utilitaires pour le bot LinkedIn
 */
const helpers = {
    /**
     * Délai aléatoire entre les actions
     * @param {number} min - Délai minimum (ms)
     * @param {number} max - Délai maximum (ms)
     */
    async randomDelay(min = CONSTANTS.MIN_DELAY, max = CONSTANTS.MAX_DELAY) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    },

    /**
     * Gestion des cookies
     */
    cookieManager: {
        async saveCookies(page, sessionId) {
            try {
                const cookies = await page.cookies();
                const cookiesPath = path.join(CONSTANTS.PATHS.SCREENSHOTS, `cookies_${sessionId}.json`);
                await fs.promises.writeFile(cookiesPath, JSON.stringify(cookies));
                logger.info('Cookies sauvegardés');
                return true;
            } catch (error) {
                logger.error('Erreur sauvegarde cookies:', error);
                return false;
            }
        },

        async loadCookies(page, sessionId) {
            try {
                const cookiesPath = path.join(CONSTANTS.PATHS.SCREENSHOTS, `cookies_${sessionId}.json`);
                if (!fs.existsSync(cookiesPath)) return false;

                const cookiesString = await fs.promises.readFile(cookiesPath);
                const cookies = JSON.parse(cookiesString);
                await page.setCookie(...cookies);
                logger.info('Cookies chargés');
                return true;
            } catch (error) {
                logger.error('Erreur chargement cookies:', error);
                return false;
            }
        }
    },

    /**
     * Manipulations du DOM
     */
    domHelpers: {
        /**
         * Vérifie si un élément est visible
         * @param {Object} page - Instance de page Puppeteer
         * @param {string} selector - Sélecteur CSS
         */
        async isVisible(page, selector) {
            try {
                await page.waitForSelector(selector, {
                    visible: true,
                    timeout: 5000
                });
                return true;
            } catch {
                return false;
            }
        },

        /**
         * Clique sur un élément avec retry
         * @param {Object} page - Instance de page Puppeteer
         * @param {string} selector - Sélecteur CSS
         * @param {number} retries - Nombre de tentatives
         */
        async clickWithRetry(page, selector, retries = 3) {
            for (let i = 0; i < retries; i++) {
                try {
                    await page.waitForSelector(selector, { visible: true });
                    await page.click(selector);
                    return true;
                } catch (error) {
                    if (i === retries - 1) throw error;
                    await helpers.randomDelay(1000, 2000);
                }
            }
            return false;
        },

        /**
         * Attend qu'un sélecteur disparaisse
         * @param {Object} page - Instance de page Puppeteer
         * @param {string} selector - Sélecteur CSS
         */
        async waitForSelectorToDisappear(page, selector, timeout = 5000) {
            try {
                await page.waitForSelector(selector, {
                    hidden: true,
                    timeout
                });
                return true;
            } catch {
                return false;
            }
        }
    },

    /**
     * Gestion des erreurs et captures d'écran
     */
    errorHelpers: {
        /**
         * Prend une capture d'écran
         * @param {Object} page - Instance de page Puppeteer
         * @param {string} context - Contexte de l'erreur
         */
        async takeScreenshot(page, context) {
            try {
                if (!page) return null;

                const timestamp = Date.now();
                const filename = path.join(
                    CONSTANTS.PATHS.ERROR_SCREENSHOTS,
                    `${context}-${timestamp}.png`
                );

                await page.screenshot({
                    path: filename,
                    fullPage: true,
                    quality: CONSTANTS.SCREENSHOT_QUALITY
                });

                logger.info(`Screenshot saved: ${filename}`);
                return filename;
            } catch (error) {
                logger.error('Screenshot error:', error);
                return null;
            }
        },

        /**
         * Vérifie les erreurs courantes de LinkedIn
         * @param {Object} page - Instance de page Puppeteer
         */
        async checkCommonErrors(page) {
            const errorSelectors = {
                captcha: '.challenge-dialog',
                suspended: '.account-restricted',
                maintenance: '.system-maintenance'
            };

            for (const [type, selector] of Object.entries(errorSelectors)) {
                if (await helpers.domHelpers.isVisible(page, selector)) {
                    logger.error(`LinkedIn error detected: ${type}`);
                    await helpers.errorHelpers.takeScreenshot(page, `error-${type}`);
                    return type;
                }
            }

            return null;
        }
    },

    /**
     * Validation et formatage des données
     */
    dataHelpers: {
        /**
         * Nettoie une URL LinkedIn
         * @param {string} url - URL à nettoyer
         */
        cleanProfileUrl(url) {
            if (!url) return '';
            url = url.trim();
            if (!url.includes('linkedin.com')) return '';

            // Retirer les paramètres de tracking
            return url.split('?')[0];
        },

        /**
         * Valide un message LinkedIn
         * @param {string} message - Message à valider
         * @param {number} maxLength - Longueur maximale
         */
        validateMessage(message, maxLength = 300) {
            if (!message || typeof message !== 'string') return '';
            message = message.trim();
            if (message.length > maxLength) {
                return message.substring(0, maxLength);
            }
            return message;
        }
    },

    /**
     * Utilitaires de navigation
     */
    navigationHelpers: {
        /**
         * Attend la navigation avec timeout
         * @param {Object} page - Instance de page Puppeteer
         * @param {string} url - URL cible
         */
        async waitForNavigation(page, url, timeout = CONSTANTS.NAVIGATION_TIMEOUT) {
            try {
                await Promise.all([
                    page.waitForNavigation({
                        waitUntil: 'networkidle0',
                        timeout
                    }),
                    page.goto(url)
                ]);
                return true;
            } catch (error) {
                logger.error('Navigation error:', error);
                return false;
            }
        },

        /**
         * Vérifie si la page est chargée
         * @param {Object} page - Instance de page Puppeteer
         */
        async isPageLoaded(page) {
            try {
                return await page.evaluate(() => document.readyState === 'complete');
            } catch {
                return false;
            }
        }
    }
};

module.exports = helpers;