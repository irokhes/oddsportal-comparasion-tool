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
  league: {
    type: String,
    required: false,
  },
  local: {
    type: String,
    required: false,
  },
  away: {
    type: String,
    required: false,
  },
  country: {
    type: String,
    required: false,
  },
  date: {
    type: String,
    required: true,
  },
  dateObj: {
    type: Date,
  },
  url: {
    type: String,
    required: true,
  },
  moneyLine: {
  },
  moneyLineFirstHalf: {
  },
  homeAway: {
  },
  dnb: {
  },
  doubleChance: {
  },
  bts: {
  },
  overUnder: [],
  asianHandicap: [],

}, { collection: 'odds', timestamps: true });

OddsSchema.index({ url: 1 }, { unique: true });
module.exports = mongoose.model('Odds', OddsSchema); // export model for use
