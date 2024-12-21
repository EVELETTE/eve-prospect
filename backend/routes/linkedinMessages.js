// services/LinkedInMessageService.js
const LinkedInBot = require('./LinkedInBot');
const Message = require('../models/Message');
const User = require('../models/User');
const Prospect = require('../models/Prospect');

class LinkedInMessageService {
    constructor() {
        this.bot = null;
    }

    async initBot(userId) {
        try {
            const user = await User.findById(userId);
            if (!user?.linkedinCredentials?.email || !user?.linkedinCredentials?.password) {
                throw new Error('LinkedIn credentials not found');
            }

            this.bot = new LinkedInBot();
            await this.bot.initialize(userId);
            await this.bot.login(
                user.linkedinCredentials.email,
                user.linkedinCredentials.password
            );
            return this.bot;
        } catch (error) {
            console.error('Init bot error:', error);
            throw error;
        }
    }

    async getMessages(userId, prospectId) {
        try {
            const prospect = await Prospect.findById(prospectId);
            if (!prospect?.linkedin) {
                throw new Error('LinkedIn profile URL not found');
            }

            const bot = await this.initBot(userId);
            const linkedInMessages = await bot.getMessages(prospect.linkedin, userId);

            // Sauvegarde des messages dans la base de données
            const savedMessages = await Promise.all(
                linkedInMessages.map(async msg => {
                    const message = new Message({
                        userId,
                        prospectId,
                        content: msg.content,
                        direction: msg.direction,
                        timestamp: msg.timestamp || new Date(),
                        status: 'sent'
                    });
                    return message.save();
                })
            );

            await bot.close();
            return savedMessages;

        } catch (error) {
            console.error('Get messages error:', error);
            throw error;
        }
    }

    async sendMessage(userId, prospectId, content) {
        try {
            const prospect = await Prospect.findById(prospectId);
            if (!prospect?.linkedin) {
                throw new Error('LinkedIn profile URL not found');
            }

            const bot = await this.initBot(userId);
            await bot.sendMessage(prospect.linkedin, content, userId);

            const message = new Message({
                userId,
                prospectId,
                content,
                direction: 'sent',
                status: 'sent'
            });

            await message.save();
            await bot.close();
            return message;

        } catch (error) {
            console.error('Send message error:', error);
            throw error;
        }
    }
}

module.exports = new LinkedInMessageService();