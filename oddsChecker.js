/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
const { CronJob } = require('cron');
const Bet = require('./models/bets');
const Odds = require('./models/odds');
const { sendHtmlMessage } = require('./telegram');
const { oddsCheckerFequency } = require('./config');
const { composeOddsChangeBetMessage } = require('./utils/messages');
const { round } = require('./utils/utils');

const lineWith2WaysBet = (bet, line) => {
  if (bet.betTo === 'home' && line.localWin !== bet.odds) {
    return {
      oddsChange: round(line.localWin - bet.lastOddBet365, 3),
      odds: line.localWin,
      avgOdds: line.localAvg,
    };
  }
  if (bet.betTo === 'away' && line.awayWin !== bet.lastOddBet365) {
    return {
      oddsChange: round(line.awayWin - bet.lastOddBet365, 3),
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
        `cambio de odds? ${line.overOdds !== bet.lastOddBet365} match: ${bet.match}`,
      );
    }
    if (bet.lineValue === line.line && bet.betTo === 'away') {
      console.log(
        `cambio de odds? ${line.underOdds !== bet.lastOddBet365} match: ${bet.match}`,
      );
    }
    if (
      bet.lineValue === line.line
      && bet.betTo === 'home'
      && line.overOdds !== bet.lastOddBet365
    ) {
      result = {
        oddsChange: round(line.overOdds - bet.lastOddBet365, 3),
        odds: line.overOdds,
        avgOdds: line.overOddsAvg,
      };
      return true;
    }
    if (
      bet.lineValue === line.line
      && bet.betTo === 'away'
      && line.underOdds !== bet.lastOddBet365
    ) {
      result = {
        oddsChange: round(line.underOdds - bet.lastOddBet365, 3),
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
    if (result && result.oddsChange) {
      // notify the drop
      promises.push(
        sendHtmlMessage(composeOddsChangeBetMessage(bet, result.oddsChange)),
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
