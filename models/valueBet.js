// import npm modules
const mongoose = require('mongoose');

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
  bet: {
    type: Boolean,
    default: false,
  },
  sequence: {
    type: Number,
  },

}, { timestamps: true });
ValueBetSchema.index({ url: 1 });
ValueBetSchema.index({ url: 1, line: 1 });
ValueBetSchema.index({ url: 1, line: 1, lineValue: 1 });
module.exports = mongoose.model('ValueBet', ValueBetSchema);

const CounterSchema = Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const counter = mongoose.model('counter', CounterSchema);

ValueBetSchema.pre('save', function (next) {
  const doc = this;
  counter.findByIdAndUpdate({ _id: 'entityId' }, { $inc: { seq: 1 } }, (error, counter) => {
    if (error) { return next(error); }
    doc.sequence = counter.seq;
    next();
  });
});