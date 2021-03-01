/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
const { CronJob } = require('cron');
const Bet = require('./models/bets');
const Odds = require('./models/odds');
const { sendHtmlMessage } = require('./telegram');
const { oddsCheckerFequency } = require('./config');
const { composeOddsChangeBetMessage, composeAvgOddsChangeBetMessage } = require('./utils/messages');
const { round } = require('./utils/utils');

const lineWith2WaysBet = (bet, line) => {
  const isBetToLocalAndLineHasChange = bet.betTo === 'home' && line.localWin !== bet.odds;
  if (isBetToLocalAndLineHasChange) {
    return {
      oddsChange: round(line.localWin - bet.lastOddBet365, 3),
      odds: line.localWin,
      avgOdds: line.localAvg,
    };
  }
  const isBetToLocalAndAverageHasChange = bet.betTo === 'home'
    && (bet.odds === bet.lastOddBet365 && bet.odds === line.localWin)
    && (line.localAvg - bet.avgOdds >= 1);
  if (isBetToLocalAndAverageHasChange) {
    return {
      avgOddsChange: round(line.localAvg - bet.avgOdds, 3),
      odds: line.localWin,
      avgOdds: line.localAvg,
    };
  }
  const isBetToAwayAndLineHasChange = bet.betTo === 'away' && line.awayWin !== bet.lastOddBet365;
  if (isBetToAwayAndLineHasChange) {
    return {
      oddsChange: round(line.awayWin - bet.lastOddBet365, 3),
      odds: line.awayWin,
      avgOdds: line.awayAvg,
    };
  }
  const isBetToAwayAndAverageHasChange = bet.betTo === 'away'
    && (bet.odds === bet.lastOddBet365 && bet.odds === line.awayWin)
    && (line.awayAvg - bet.avgOdds >= 1);
  if (isBetToAwayAndAverageHasChange) {
    return {
      avgOddsChange: round(line.awayAvg - bet.avgOdds, 3),
      odds: line.awayWin,
      avgOdds: line.awaylAvg,
    };
  }
  return null;
};
const lineWithOverUnderBet = (bet, lines) => {
  let result;
  lines.some((line) => {
    const isBetToOverAndLineHasChange = bet.lineValue === line.line
      && bet.betTo === 'home'
      && line.overOdds !== bet.lastOddBet365;
    if (isBetToOverAndLineHasChange) {
      result = {
        oddsChange: round(line.overOdds - bet.lastOddBet365, 3),
        odds: line.overOdds,
        avgOdds: line.overOddsAvg,
      };
      return true;
    }
    const isBetToOverAndAverageHasChange = bet.lineValue === line.line
      && bet.betTo === 'home'
      && (bet.odds === bet.lastOddBet365 && bet.odds === line.overOdds)
      && (line.overOddsAvg - bet.avgOdds >= 1);
    if (isBetToOverAndAverageHasChange) {
      result = {
        avgOddsChange: round(line.overOddsAvg - bet.avgOdds, 3),
        odds: line.overOdds,
        avgOdds: line.overOddsAvg,
      };
      return true;
    }

    const isBetToUnderAndLineHasChange = bet.lineValue === line.line
      && bet.betTo === 'away'
      && line.underOdds !== bet.lastOddBet365;
    if (
      isBetToUnderAndLineHasChange
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
    if (result && (result.oddsChange || result.avgOddsChange)) {
      // notify the drop
      const msg = result.oddsChange
        ? composeOddsChangeBetMessage(bet, result)
        : composeAvgOddsChangeBetMessage(bet, result);
      promises.push(sendHtmlMessage(msg));

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
