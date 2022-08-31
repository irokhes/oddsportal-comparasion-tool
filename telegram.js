/* eslint-disable max-len */
/* eslint-disable radix */
const { Telegraf } = require('telegraf');
const { botToken, chatId } = require('./config');

const bot = new Telegraf(botToken);
bot.startPolling();

bot.on('channel_post', (ctx, next) => {
  ctx.update.message = ctx.update.channel_post;
  return next();
});

bot.command('info', async (ctx) => {
  console.log(ctx.message.chat.id);
  ctx.reply(ctx.message.chat.id);
});

const sendMessage = (message, channelId = chatId) => {
  bot.telegram.sendMessage(channelId, message);
};
const sendHtmlMessage = (message, channelId = chatId) => bot.telegram.sendMessage(channelId, message, { parse_mode: 'HTML', disable_web_page_preview: true }).catch(console.error);
module.exports = { sendMessage, sendHtmlMessage };
