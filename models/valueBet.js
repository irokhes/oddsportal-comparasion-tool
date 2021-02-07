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

}, { timestamps: true });

ValueBetSchema.index({ url: 1 }, { unique: true });
ValueBetSchema.index({ url: 1, line: 1 }, { unique: true });
ValueBetSchema.index({ url: 1, line: 1, lineValue: 1 }, { unique: true });
module.exports = mongoose.model('ValueBet', ValueBetSchema);
