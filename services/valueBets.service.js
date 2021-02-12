const ValueBet = require('../models/valueBet');
const Bet = require('../models/bets');

const startBetTracking = async (sequence) => {
  const valueBet = await ValueBet.findOne({ sequence });
  if (!valueBet) return null;
  const bet = new Bet(valueBet);
  return bet.save();
};
module.exports = {
  startBetTracking,
};
