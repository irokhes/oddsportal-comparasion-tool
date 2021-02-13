const ValueBet = require('../models/valueBet');
const Bet = require('../models/bets');

const startBetTracking = async (sequence) => {
  const valueBet = await ValueBet.findOne({ sequence });
  if (!valueBet) return null;
  valueBet.bet = true;
  await valueBet.save();
  const bet = new Bet(valueBet.toJSON());
  return bet.save();
};
module.exports = {
  startBetTracking,
};
