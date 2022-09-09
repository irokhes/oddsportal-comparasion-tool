/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-plusplus */
const PinnacleValueBet = require('../models/pinnacleValueBet');

async function saveValueBetsToDatabase(valueBets) {
  const promises = [];
  const newValueBets = [];
  for (let index = 0; index < valueBets.length; index++) {
    const bet = valueBets[index];
    if (isNaN(bet.avgOdds)) console.log(bet);
    const filterOptions = { match: bet.match, line: bet.line };
    if (bet.line === 'AH' || bet.line === 'O/U') filterOptions.line = bet.line;
    let vb = await PinnacleValueBet.findOne(filterOptions);

    if (!vb) {
      vb = new PinnacleValueBet(bet);
      promises.push(vb.save());
    }
  }
  (await Promise.all(promises)).forEach((valueBet) => {
    newValueBets.push(valueBet);
  });
  return newValueBets;
}

module.exports = {
  saveValueBetsToDatabase,
};
