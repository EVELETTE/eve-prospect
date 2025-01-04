// services/IntelligentLinkedInBot.js
const { Anthropic } = require('@anthropic-ai/sdk');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const EventEmitter = require('events');

puppeteer.use(StealthPlugin());

class IntelligentLinkedInBot extends EventEmitter {
    constructor() {
        super();
        this.browser = null;
        this.page = null;
        this.claude = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
        this.systemPrompt = `Tu es un assistant spécialisé dans l'automatisation LinkedIn qui aide à:
1. Analyser les profils LinkedIn
2. Personnaliser les messages en fonction du contexte
3. Gérer les séquences d'actions
4. Prendre des décisions sur les meilleures actions à entreprendre

Tu dois toujours:
- Respecter les limites de LinkedIn
- Agir de manière naturelle et humaine
- Éviter les actions qui pourraient être détectées comme de l'automatisation
- Personnaliser chaque interaction
- Suivre les meilleures pratiques de prospection`;
    }

    async initialize() {
        try {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-notifications',
                    '--start-maximized'
                ]
            });
            this.page = await this.browser.newPage();
            await this._setupDefenses();
            return true;
        } catch (error) {
            console.error('Erreur d\'initialisation:', error);
            return false;
        }
    }

    async _setupDefenses() {
        // Configuration pour éviter la détection
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'languages', {
                get: () => ['fr-FR', 'fr', 'en-US', 'en']
            });
            window.chrome = {
                runtime: {},
                loadTimes: () => {},
                csi: () => {},
                app: {}
            };
        });

        // Configuration des en-têtes HTTP
        await this.page.setExtraHTTPHeaders({
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
    }

    async analyzeProfile(profileUrl) {
        try {
            await this.page.goto(profileUrl, { waitUntil: 'networkidle0' });
            const profileData = await this._extractProfileData();

            // Demander à Claude d'analyser le profil
            const analysis = await this._askClaude(`Analyse ce profil LinkedIn et donne des recommandations pour l'approche:
                ${JSON.stringify(profileData)}`);

            return {
                success: true,
                data: profileData,
                analysis: analysis,
                recommendations: await this._generateRecommendations(profileData)
            };
        } catch (error) {
            console.error('Erreur d\'analyse du profil:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async _extractProfileData() {
        return await this.page.evaluate(() => {
            const data = {};

            // Informations de base
            data.name = document.querySelector('h1')?.textContent.trim() || '';
            data.title = document.querySelector('.text-body-medium')?.textContent.trim() || '';
            data.location = document.querySelector('.text-body-small.inline')?.textContent.trim() || '';

            // Expérience
            data.experience = Array.from(document.querySelectorAll('.experience-item'))
                .map(item => ({
                    title: item.querySelector('.experience-item__title')?.textContent.trim() || '',
                    company: item.querySelector('.experience-item__subtitle')?.textContent.trim() || '',
                    duration: item.querySelector('.date-range')?.textContent.trim() || ''
                }));

            // Formation
            data.education = Array.from(document.querySelectorAll('.education__item'))
                .map(item => ({
                    school: item.querySelector('.education__school')?.textContent.trim() || '',
                    degree: item.querySelector('.education__degree')?.textContent.trim() || '',
                    period: item.querySelector('.education__dates')?.textContent.trim() || ''
                }));

            // À propos
            data.about = document.querySelector('#about')?.textContent.trim() || '';

            return data;
        });
    }

    async generatePersonalizedMessage(profileData) {
        try {
            const prompt = `Génère un message de connexion LinkedIn personnalisé pour ce profil:
                ${JSON.stringify(profileData)}
                
                Le message doit être:
                1. Personnel et basé sur leur parcours
                2. Professionnel et authentique
                3. Court et percutant (max 300 caractères)
                4. Avec une proposition de valeur claire
                5. Une question ouverte pour engager la conversation`;

            const response = await this._askClaude(prompt);
            return {
                success: true,
                message: response
            };
        } catch (error) {
            console.error('Erreur génération message:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async executeSequence(sequence) {
        try {
            for (const action of sequence.steps) {
                // Vérifier si nous devons continuer
                if (sequence.status !== 'active') break;

                // Demander à Claude d'analyser l'action
                const analysisPrompt = `Analyse cette action de séquence LinkedIn:
                    ${JSON.stringify(action)}
                    
                    Vérifie:
                    1. Si l'action est appropriée
                    2. Si le timing est bon
                    3. Si des ajustements sont nécessaires
                    4. Les risques potentiels`;

                const analysis = await this._askClaude(analysisPrompt);

                if (analysis.includes('RISQUE ÉLEVÉ')) {
                    throw new Error('Action jugée risquée par Claude');
                }

                // Exécuter l'action
                await this._executeAction(action);

                // Attendre un délai aléatoire
                await this._randomDelay();
            }

            return {
                success: true,
                message: 'Séquence exécutée avec succès'
            };
        } catch (error) {
            console.error('Erreur exécution séquence:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async _executeAction(action) {
        switch (action.type) {
            case 'visit':
                await this.page.goto(action.url, { waitUntil: 'networkidle0' });
                break;

            case 'connect':
                await this._sendConnectionRequest(action.url, action.message);
                break;

            case 'message':
                await this._sendMessage(action.url, action.message);
                break;

            case 'react':
                await this._reactToPost(action.url);
                break;

            default:
                throw new Error(`Type d'action non supporté: ${action.type}`);
        }
    }

    async _askClaude(prompt) {
        try {
            const message = await this.claude.messages.create({
                model: "claude-3-opus-20240229",
                max_tokens: 1000,
                messages: [{
                    role: "user",
                    content: prompt
                }],
                system: this.systemPrompt
            });

            return message.content;
        } catch (error) {
            console.error('Erreur communication avec Claude:', error);
            throw error;
        }
    }

    async _generateRecommendations(profileData) {
        const prompt = `Basé sur ce profil LinkedIn, fais 3-5 recommandations concrètes pour:
            1. Le meilleur angle d'approche
            2. Les points communs à exploiter
            3. Les sujets de conversation potentiels
            4. La proposition de valeur à mettre en avant
            
            Profil: ${JSON.stringify(profileData)}`;

        return await this._askClaude(prompt);
    }

    async _randomDelay(min = 2000, max = 5000) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    async _sendMessage(profileUrl, message) {
        try {
            await this.page.goto(profileUrl, { waitUntil: 'networkidle0' });

            // Attendre le bouton de message
            await this.page.waitForSelector('button[aria-label*="Message"]');
            await this.page.click('button[aria-label*="Message"]');

            // Attendre la zone de texte
            await this.page.waitForSelector('div[contenteditable="true"]');

            // Simuler une frappe humaine
            for (const char of message) {
                await this.page.keyboard.type(char, {
                    delay: Math.random() * 100 + 30
                });

                if (Math.random() < 0.1) {
                    await this._randomDelay(500, 1500);
                }
            }

            // Attendre avant d'envoyer
            await this._randomDelay(1000, 2000);

            // Envoyer le message
            await this.page.keyboard.press('Enter');

            return true;
        } catch (error) {
            console.error('Erreur envoi message:', error);
            return false;
        }
    }

    async _sendConnectionRequest(profileUrl, message = null) {
        try {
            await this.page.goto(profileUrl, { waitUntil: 'networkidle0' });

            // Trouver et cliquer sur le bouton de connexion
            await this.page.waitForSelector('button[aria-label*="Se connecter"]');
            await this.page.click('button[aria-label*="Se connecter"]');

            if (message) {
                // Ajouter une note
                await this.page.waitForSelector('button[aria-label*="Ajouter une note"]');
                await this.page.click('button[aria-label*="Ajouter une note"]');

                // Saisir le message
                await this.page.waitForSelector('textarea[name="message"]');

                // Frappe humaine
                for (const char of message) {
                    await this.page.keyboard.type(char, {
                        delay: Math.random() * 100 + 30
                    });
                }
            }

            // Envoyer la demande
            await this.page.click('button[aria-label*="Envoyer"]');

            return true;
        } catch (error) {
            console.error('Erreur envoi connexion:', error);
            return false;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }
}

module.exports = IntelligentLinkedInBot;