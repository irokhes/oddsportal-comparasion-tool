/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-plusplus */
const WilliamHillValueBet = require('../models/williamHillValueBet');

async function saveValueBetsToDatabase(valueBets) {
  const promises = [];
  const newValueBets = [];
  for (let index = 0; index < valueBets.length; index++) {
    const bet = valueBets[index];
    if (isNaN(bet.avgOdds)) console.log(bet);
    const filterOptions = { match: bet.match, line: bet.line };
    if (bet.line === 'AH' || bet.line === 'O/U') filterOptions.line = bet.line;
    let vb = await WilliamHillValueBet.findOne(filterOptions);

    if (!vb) {
      vb = new WilliamHillValueBet(bet);
      promises.push(vb.save());
    }
  }
  (await Promise.all(promises)).forEach((valueBet) => {
    newValueBets.push({
      match: valueBet.match,
      date: valueBet.date,
      url: valueBet.url,
      line: valueBet.line,
      lineValue: valueBet.lineValue,
      valueRatio: valueBet.valueRatio,
      sequence: valueBet.sequence,
      betTo: valueBet.betTo,
      odds: valueBet.odds,
      avgOdds: valueBet.avgOdds,
      upTrend: valueBet.upTrend,
      downTrend: valueBet.downTrend,
      pinnacleOdds: valueBet.pinnacleOdds,
    });
  });
  return newValueBets;
}

module.exports = {
  saveValueBetsToDatabase,
};
