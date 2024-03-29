// import npm modules
const mongoose = require('mongoose');
const counter = require('./counter');

const { Schema } = mongoose;

const ValueBetSchema = new Schema({
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
  valueRatio: {
    type: Number,
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
  sequence: {
    type: Number,
  },

}, { timestamps: true });
ValueBetSchema.index({ url: 1 });
ValueBetSchema.index({ sequence: 1 });
ValueBetSchema.index({ url: 1, line: 1 });
ValueBetSchema.index({ url: 1, line: 1, lineValue: 1 });

ValueBetSchema.pre('save', function (next) {
  const doc = this;
  if (!doc.isNew) return next();
  counter.findByIdAndUpdate({ _id: 'betSeqNum' }, { $inc: { seq: 1 } }, (error, cnt) => {
    if (error) { return next(error); }
    doc.sequence = cnt.seq;
    next();
  });
});
module.exports = mongoose.model('ValueBet', ValueBetSchema);
