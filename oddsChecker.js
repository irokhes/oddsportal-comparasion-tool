/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
const { CronJob } = require('cron');
const Bet = require('./models/bets');
const Odds = require('./models/odds');
const { sendHtmlMessage, sendMessage } = require('./telegram');
const { oddsCheckerFequency } = require('./config');

const lineWith2WaysBet = (bet, line) => {
  if (bet.betTo === 'home' && (bet.lastAvgOdds - line.localAvg > 0.01)) {
    return { oddsDrop: bet.lastAvgOdds - line.localAvg, odds: line.localWin, avgOdds: line.localAvg };
  }
  if (bet.betTo === 'away' && (bet.lastAvgOdds - line.awayAvg > 0.01)) {
    return { oddsDrop: bet.lastAvgOdds - line.awayAvg, odds: line.awayWin, avgOdds: line.awayAvg };
  }
};
const lineWithOverUnderBet = (bet, lines) => {
  let result;
  lines.some((line) => {
    if (bet.betTo === 'home' && (bet.lastAvgOdds - line.localAvg > 0.01)) {
      result = { oddsDrop: bet.lastAvgOdds - line.overOddsAvg, odds: line.overOdds, avgOdds: line.overOddsAvg };
      return true;
    }
    if (bet.betTo === 'away' && (bet.lastAvgOdds - line.underOddsAvg > 0.01)) {
      result = { oddsDrop: bet.lastAvgOdds - line.underOddsAvg, odds: line.underOdds, avgOdds: line.underOddsAvg };
      return true;
    }
    return false;
  });
  return result;
};

const lines = {
  ML: { func: lineWith2WaysBet, line: 'moneyLine' },
  DNB: { func: lineWith2WaysBet, line: 'dnb' },
  DC: { func: lineWith2WaysBet, line: 'doubleChance' },
  BTS: { func: lineWith2WaysBet, line: 'bts' },
  AH: { func: lineWithOverUnderBet, line: 'asianHandicap' },
  'O/U': { func: lineWithOverUnderBet, line: 'overUnder' },
};
const checkOddsForExistingBets = async () => {
  const bets = await Bet.find();
  const promises = [];
  for (let i = 0; i < bets.length; i++) {
    const bet = bets[i];
    if (!bet.sequence) continue;
    const odds = await Odds.findOne({ sequence: bet.sequence });
    if (!odds) continue;
    const result = lines[bet.line].func(bet, bet[lines[bet.line].line]);

    if (result && result.oddsDrop) {
      // notify the drop
      promises.push(sendHtmlMessage(bet, result.oddsDrop));
      bet.lastOddBet365 = result.odds;
      bet.lastAvgOdds = result.avgOdds;
      promises.push(bet.save());
    }
  }
  await Promise.all(promises);
};
const start = () => {
  const job = new CronJob(`0 */${frequoddsCheckerFequencyency} * * * *`, (async () => {
    await checkOddsForExistingBets();
  }));
  job.start();
};

module.exports = { start };
