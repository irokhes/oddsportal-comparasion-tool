const ValueBet = require('../models/valueBet');
const Bet = require('../models/bets');

const startBetTracking = async (sequence) => {
  const valueBet = await ValueBet.findOne({ sequence });
  if (!valueBet) return null;
  valueBet.bet = true;
  await valueBet.save();
  const vb = valueBet.toJSON();
  delete vb._id;
  delete vb.createdAt;
  delete vb.updatedAt;
  const bet = new Bet(vb);
  return bet.save();
};
module.exports = {
  startBetTracking,
};
