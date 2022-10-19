/* eslint-disable radix */
require('dotenv').config();

const APP_NAME = 'denise-project-';
const NODE_ENV = process.env.NODE_ENV || 'dev';
const MONGO_HOST = process.env.MONGO_HOST || 'localhost';
const MONGO_PORT = process.env.MONGO_PORT || 27017;
const MONGO_URI = process.env.MONGODB_URI || `mongodb://${MONGO_HOST}:${MONGO_PORT}/${APP_NAME}${NODE_ENV}`;
module.exports = {
  env: NODE_ENV,
  frequency: process.env.CRON_FREQUENCY || 5,
  oddsCheckerFequency: process.env.ODDS_CHECKER_FQUENCY || 4,
  maxConcurrency: parseInt(process.env.MAX_CONCURRENCY) || 3,
  valueBetLimit: process.env.VALUE_BET_LIMIT || 1.0101,
  percentageRuleLimit: process.env.PERCENTAGE_RULE || 10,
  percentageDriftedBetLimit: process.env.PERCENTAGE_DRIFTED_BET_LIMIT || 7,
  botToken: process.env.BOT_TOKEN,
  chatId: process.env.CHAT_ID,
  recosChannelId: process.env.RECOS_CHANNEL_ID,
  pinnacleRecoBetChannelId: process.env.PINNACLE_RECOS_CHANNEL_ID,
  driftedChannelId: process.env.DRIFTED_CHANNEL_ID,
  bwinChannelId: process.env.BWIN_CHANNEL_ID,
  williamHillChannelId: process.env.WILLIAM_HILL_CHANNEL_ID,
  pinnacleChannelId: process.env.PINNACLE_CHANNEL_ID,
  betfairChannelId: process.env.BETFAIR_CHANNEL_ID,
  db: {
    uri: MONGO_URI,
  },

};
