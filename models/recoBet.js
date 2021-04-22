// import npm modules
const mongoose = require('mongoose');
const counter = require('./counter');

const { Schema } = mongoose;

const RecoBetSchema = new Schema({
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

}, { timestamps: true });
RecoBetSchema.index({ url: 1 });
RecoBetSchema.index({ sequence: 1 });
RecoBetSchema.index({ url: 1, line: 1 });
RecoBetSchema.index({ url: 1, line: 1, lineValue: 1 });

module.exports = mongoose.model('RecoBet', RecoBetSchema);
