const { Telegraf } = require('telegraf');
const { botToken, chatId } = require('./config');

const bot = new Telegraf(botToken);
bot.startPolling();

bot.command('bet', (ctx) => {
  console.log('command received');
  ctx.reply('Oido cocina!!');
});

bot.launch();

const sendMessage = (message) => {
  bot.telegram.sendMessage(chatId, message);
};
const sendHtmlMessage = (message) => bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' }).catch(console.error);
module.exports = { sendMessage, sendHtmlMessage };
