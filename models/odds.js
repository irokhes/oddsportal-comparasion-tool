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
  asianHandicap: {
  },

}, { collection: 'odds', timestamps: true });

OddsSchema.index({ url: 1 }, { unique: true });
module.exports = mongoose.model('Odds', OddsSchema); // export model for use
