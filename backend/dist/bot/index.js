"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupBot = void 0;
const grammy_1 = require("grammy");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../.env' });
const token = process.env.TELEGRAM_BOT_TOKEN;
const setupBot = () => {
    if (!token || token === 'your_telegram_bot_token_here') {
        console.log('Telegram bot token not configured correctly, skipping bot startup.');
        return;
    }
    const bot = new grammy_1.Bot(token);
    bot.command('start', async (ctx) => {
        const userId = ctx.from?.id.toString();
        const adminIds = (process.env.ADMIN_IDS || '').split(',');
        const isAdmin = userId && adminIds.includes(userId);
        const keyboard = new grammy_1.InlineKeyboard()
            .webApp('🛒 Shop Now', process.env.FRONTEND_URL || 'https://example.com');
        if (isAdmin) {
            keyboard.row().webApp('🔧 Admin Panel', `${process.env.FRONTEND_URL}/admin` || 'https://example.com/admin');
        }
        await ctx.reply('Welcome to our E-Commerce Store!', {
            reply_markup: keyboard,
        });
    });
    bot.command('shop', async (ctx) => {
        const keyboard = new grammy_1.InlineKeyboard()
            .webApp('🛒 Open Shop', process.env.FRONTEND_URL || 'https://example.com');
        await ctx.reply('Click below to open the shop', { reply_markup: keyboard });
    });
    bot.command('orders', async (ctx) => {
        const keyboard = new grammy_1.InlineKeyboard()
            .webApp('📦 My Orders', `${process.env.FRONTEND_URL}/orders` || 'https://example.com/orders');
        await ctx.reply('View your orders:', { reply_markup: keyboard });
    });
    bot.catch((err) => {
        console.error('Error in bot:', err);
    });
    bot.start({
        onStart: (botInfo) => {
            console.log(`Bot @${botInfo.username} started successfully`);
        }
    });
};
exports.setupBot = setupBot;
