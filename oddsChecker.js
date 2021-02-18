/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
const { CronJob } = require('cron');
const Bet = require('./models/bets');
const Odds = require('./models/odds');
const { sendHtmlMessage } = require('./telegram');
const { oddsCheckerFequency } = require('./config');
const { composeOddsDropBetMessage } = require('./utils/messages');
const { round } = require('./utils/utils');

const lineWith2WaysBet = (bet, line) => {
  if (bet.betTo === 'home' && line.localAvg - bet.avgOdds > 0.01) {
    return {
      oddsDrop: line.localAvg - bet.avgOdds,
      odds: line.localWin,
      avgOdds: line.localAvg,
    };
  }
  if (bet.betTo === 'away' && line.awayAvg - bet.avgOdds > 0.01) {
    return {
      oddsDrop: line.awayAvg - bet.avgOdds,
      odds: line.awayWin,
      avgOdds: line.awayAvg,
    };
  }
};
const lineWithOverUnderBet = (bet, lines) => {
  let result;
  lines.some((line) => {
    if (bet.lineValue === line.line && bet.betTo === 'home') {
      console.log(
        `cambio de odds ${line.overOddsAvg - bet.avgOdds} match: ${bet.match}`,
      );
    }
    if (bet.lineValue === line.line && bet.betTo === 'away') {
      console.log(
        `cambio de odds  ${line.underOddsAvg - bet.avgOdds} match: ${bet.match}`,
      );
    }
    if (
      bet.lineValue === line.line
      && bet.betTo === 'home'
      && line.overOddsAvg - bet.avgOdds > 0.01
    ) {
      result = {
        oddsDrop: line.overOddsAvg - bet.avgOdds,
        odds: line.overOdds,
        avgOdds: line.overOddsAvg,
      };
      return true;
    }
    if (
      bet.lineValue === line.line
      && bet.betTo === 'away'
      && line.underOddsAvg - bet.avgOdds > 0.01
    ) {
      result = {
        oddsDrop: line.underOddsAvg - bet.avgOdds,
        odds: line.underOdds,
        avgOdds: line.underOddsAvg,
      };
      return true;
    }
    return false;
  });
  return result;
};

const lines = {
  ML: { func: lineWith2WaysBet, line: 'moneyLine' },
  HOMEAWAY: { func: lineWith2WaysBet, line: 'homeAway' },
  DNB: { func: lineWith2WaysBet, line: 'dnb' },
  DC: { func: lineWith2WaysBet, line: 'doubleChance' },
  BTS: { func: lineWith2WaysBet, line: 'bts' },
  AH: { func: lineWithOverUnderBet, line: 'asianHandicap' },
  'O/U': { func: lineWithOverUnderBet, line: 'overUnder' },
};
const checkOddsForExistingBets = async () => {
  const bets = await Bet.find({ open: true });
  const promises = [];
  for (let i = 0; i < bets.length; i++) {
    const bet = bets[i];
    const odds = await Odds.findOne({
      sport: bet.sport,
      match: bet.match,
      date: bet.date,
    });
    if (!odds) continue;
    const result = lines[bet.line].func(bet, odds[lines[bet.line].line]);
    if (result && result.oddsDrop) {
      // notify the drop
      promises.push(
        sendHtmlMessage(composeOddsDropBetMessage(bet, result.oddsDrop)),
      );
      bet.lastOddBet365 = result.odds;
      bet.lastAvgOdds = result.avgOdds;
      promises.push(bet.save());
    }
  }
  await Promise.all(promises);
};
const start = () => {
  const job = new CronJob(`0 */${oddsCheckerFequency} * * * *`, async () => {
    await checkOddsForExistingBets();
  });
  job.start();
};

module.exports = { start };
