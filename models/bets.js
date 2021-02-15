// import npm modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const BetSchema = new Schema({
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
  line: {
    tpye: String,
    required: false,
  },
  lineValue: {
    tpye: String,
    required: false,
  },
  valueRatio: {
    tpye: String,
    required: false,
  },
  sequence: {
    type: Number,
  },
  betTo: {
    type: String,
    required: false,
  },
  odds: {
    type: Number,
    required: false,
  },
  lastOddBet365: {
    type: Number,
    required: false,
  },
  avgOdds: {
    type: String,
    required: false,
  },
  lastAvgOdds: {
    type: Number,
    required: false,
  },
  result: {
    type: String,
  },
  open: {
    type: Boolean,
    default: true,
  },

}, { timestamps: true });

BetSchema.index({ url: 1 });
BetSchema.index({ url: 1, line: 1 });
BetSchema.index({ url: 1, line: 1, lineValue: 1 });
module.exports = mongoose.model('Bet', BetSchema);
