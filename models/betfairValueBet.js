// import npm modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const BetfairValueBet = new Schema({
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
  dateObj: {
    type: Date,
  },
  url: {
    type: String,
    required: true,
  },
  line: {
    type: String,
    required: false,
  },
  lineValue: {
    type: String,
    required: false,
  },
  betTo: {
    type: String,
    required: false,
  },
  odds: {
    type: Number,
    required: false,
  },
  bet365Odds: {
    type: Number,
    required: false,
  },
  pinnacleOdds: {
    type: Number,
    required: false,
  },
  avgOdds: {
    type: Number,
    required: false,
  },
  upTrend: {
    type: Number,
    required: false,
  },
  downTrend: {
    type: Number,
    required: false,
  },
  bet: {
    type: Boolean,
    default: false,
  },

}, { timestamps: true });
BetfairValueBet.index({ url: 1 });
BetfairValueBet.index({ url: 1, line: 1 });
BetfairValueBet.index({ url: 1, line: 1, lineValue: 1 });

module.exports = mongoose.model('BetfairValueBet', BetfairValueBet);
