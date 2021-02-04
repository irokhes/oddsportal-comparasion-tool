// import npm modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const OddsSchema = new Schema({
  sport: {
    type: String,
    default: 'football',
  },
  match: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  moneyLine: {
  },
  dnb: {
  },
  doubleChance: {
  },
  overUnder: {
  },
  bts: {
  },

}, { collection: 'odds', timestamp: true });

OddsSchema.index({ home: 1, away: 1 }); // compound index on email + username
module.exports = mongoose.model('Odds', OddsSchema); // export model for use
