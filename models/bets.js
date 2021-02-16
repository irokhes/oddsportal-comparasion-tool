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
    type: String,
  },
  lineValue: {
    type: String,
  },
  valueRatio: {
    type: String,
  },
  sequence: {
    type: Number,
  },
  betTo: {
    type: String,
  },
  odds: {
    type: Number,
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

BetSchema.pre('save', function (next) {
  const doc = this;
  if (!doc.isNew) return next();
  doc.lastAvgOdds = doc.avgOdds;
  doc.lastOddBet365 = doc.odds;
  next();
});

BetSchema.index({ url: 1 });
BetSchema.index({ url: 1, line: 1 });
BetSchema.index({ url: 1, line: 1, lineValue: 1 });
module.exports = mongoose.model('Bet', BetSchema);
