require('dotenv').config();

const APP_NAME = 'denise-project-';
const NODE_ENV = process.env.NODE_ENV || 'dev';
const MONGO_HOST = process.env.MONGO_HOST || 'localhost';
const MONGO_PORT = process.env.MONGO_PORT || 27017;
const MONGO_URI = process.env.MONGODB_URI || `mongodb://${MONGO_HOST}:${MONGO_PORT}/${APP_NAME}${NODE_ENV}`;
module.exports = {
  env: NODE_ENV,
  botToken: process.env.BOT_TOKEN,
  chatId: process.env.CHAT_ID,
  db: {
    uri: MONGO_URI,
  },

};
