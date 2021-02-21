// import npm modules
const mongoose = require('mongoose');
const counter = require('./counter');

const { Schema } = mongoose;

const DriftedBetSchema = new Schema({
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
  lineValue: {
    type: String,
    required: false,
  },
  linesDifference: {
    type: Number,
    required: false,
  },
  betToLine: {
    type: String,
    required: false,
  },
  betTo: {
    type: String,
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
DriftedBetSchema.index({ url: 1 });
DriftedBetSchema.index({ sequence: 1 });
DriftedBetSchema.index({ url: 1, line: 1 });
DriftedBetSchema.index({ url: 1, line: 1, lineValue: 1 });

DriftedBetSchema.pre('save', function (next) {
  const doc = this;
  if (!doc.isNew) return next();
  counter.findByIdAndUpdate({ _id: 'betSeqNum' }, { $inc: { seq: 1 } }, (error, cnt) => {
    if (error) { return next(error); }
    doc.sequence = cnt.seq;
    next();
  });
});
module.exports = mongoose.model('ValueBet', DriftedBetSchema);
