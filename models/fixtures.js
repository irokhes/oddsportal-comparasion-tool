// import npm modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const FixtureSchema = new Schema({
  url: {
    type: String,
    required: true,
  },
  match: {
    type: String,
    required: true,
  },
  mlUrl: {
    type: String,
    required: true,
  },
  dnbUrl: {
    type: String,
    required: true,
  },
  dcUrl: {
    tpye: String,
    required: false,
  },
  btsUrl: {
    tpye: String,
    required: false,
  },
  ahUrl: {
    tpye: String,
    required: false,
  },
  ouUrl: {
    tpye: String,
    required: false,
  },

}, { timestamps: true });

FixtureSchema.index({ url: 1 }, { unique: true });
module.exports = mongoose.model('Fixture', FixtureSchema);
