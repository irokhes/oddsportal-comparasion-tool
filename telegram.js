/* eslint-disable max-len */
/* eslint-disable radix */
const { Telegraf } = require('telegraf');
const { botToken, chatId } = require('./config');
const { startBetTracking } = require('./services/valueBets.service');

const bot = new Telegraf(botToken);
bot.startPolling();

bot.on('channel_post', (ctx, next) => {
  ctx.update.message = ctx.update.channel_post;
  return next();
});

bot.command('bet', async (ctx) => {
  const sequence = parseInt(ctx.message.text.replace('/bet', ''));
  await startBetTracking(sequence);
  ctx.reply('Oido cocina!!');
});

const sendMessage = (message) => {
  bot.telegram.sendMessage(chatId, message);
};
const sendHtmlMessage = (message) => bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' }).catch(console.error);
module.exports = { sendMessage, sendHtmlMessage };
