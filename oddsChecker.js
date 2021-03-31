/* eslint-disable max-len */
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
  const isBetToLocalAndLineHasChange = bet.betTo === 'local' && line.localWin !== bet.odds;
  if (isBetToLocalAndLineHasChange) {
    return {
      oddsChange: round(line.localWin - bet.lastOddBet365, 3),
      odds: line.localWin,
      avgOdds: line.localAvg,
    };
  }
  const isBetToLocalAndAverageHasChange = bet.betTo === 'local'
    && (bet.odds === bet.lastOddBet365 && bet.odds === line.localWin)
    && (line.localAvg - bet.lastAvgOdds >= 0.01);
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
    && (line.awayAvg - bet.lastAvgOdds >= 0.01);
  if (isBetToAwayAndAverageHasChange) {
    return {
      avgOddsChange: round(line.awayAvg - bet.avgOdds, 3),
      odds: line.awayWin,
      avgOdds: line.awayAvg,
    };
  }
  return null;
};
const lineWithOverUnderBet = (bet, lines) => {
  let result;
  lines.some((line) => {
    if (bet.lineValue !== line.line) return false;

    const isBetToOverAndLineHasChange = bet.betTo === 'local'
      && line.overOdds !== bet.lastOddBet365;
    if (isBetToOverAndLineHasChange) {
      result = {
        oddsChange: round(line.overOdds - bet.lastOddBet365, 3),
        odds: line.overOdds,
        avgOdds: line.overOddsAvg,
      };
      return true;
    }
    if (bet.betTo === 'local' && bet.odds === bet.lastOddBet365) console.log(`la linea no se ha movido ${bet.odds}, orignal avg odds ${bet.lastAvgOdds}, actuales ${line.overOddsAvg} \n ${bet.url}`);
    const isBetToOverAndAverageHasChange = bet.betTo === 'local'
      && (bet.odds === bet.lastOddBet365 && bet.odds === line.overOdds)
      && (line.overOddsAvg - bet.lastAvgOdds >= 0.01);
    if (isBetToOverAndAverageHasChange) {
      result = {
        avgOddsChange: round(line.overOddsAvg - bet.avgOdds, 3),
        odds: line.overOdds,
        avgOdds: line.overOddsAvg,
      };
      return true;
    }
    if (bet.betTo === 'away' && bet.odds === bet.lastOddBet365) console.log(`la linea no se ha movido ${bet.odds}, orignal avg odds ${bet.lastAvgOdds}, actuales ${line.underOddsAvg} \n ${bet.url}`);

    const isBetToUnderAndLineHasChange = bet.betTo === 'away'
      && line.underOdds !== bet.lastOddBet365;
    if (isBetToUnderAndLineHasChange) {
      result = {
        oddsChange: round(line.underOdds - bet.lastOddBet365, 3),
        odds: line.underOdds,
        avgOdds: line.underOddsAvg,
      };
      return true;
    }
    const isBetToUnderAndAverageHasChange = bet.betTo === 'away'
      && (bet.odds === bet.lastOddBet365 && bet.odds === line.underOdds)
      && (line.underOddsAvg - bet.lastAvgOdds >= 0.01);
    if (isBetToUnderAndAverageHasChange) {
      result = {
        avgOddsChange: round(line.underOddsAvg - bet.avgOdds, 3),
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
      promises.push(sendHtmlMessage(composeOddsChangeBetMessage(bet, result)));

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
