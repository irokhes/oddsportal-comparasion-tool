const { Telegraf } = require('telegraf');
const { botToken, chatId } = require('./config');

const bot = new Telegraf(botToken);

const sendMessage = (message) => {
  bot.telegram.sendMessage(chatId, message);
};
const sendHtmlMessage = (message) => bot.telegram.sendMessage(chatId, `*${message}*`, { parse_mode: 'HTML' }).catch(console.error);
module.exports = { sendMessage, sendHtmlMessage };
