/* eslint-disable no-case-declarations */
/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
const fs = require('fs');
const { addZeroes, getOddsBelowOpeningValue, round } = require('./utils/utils');
const Odds = require('./models/odds');
const ValueBet = require('./models/valueBet');
const { sendHtmlMessage, sendMessage } = require('./telegram');
const { composeNewValueBetMessage, composeNewPercentageBetMessage } = require('./utils/messages');
const CronJob = require('cron').CronJob;
const { frequency, valueBetLimit, percentageRuleLimit } = require('./config');


const moneyline = (moneyLine, doubleChance) => {
  const {
    localWin, awayWin, awayWinAvg, localWinAvg, drawAvg,
  } = moneyLine;
  let localAvg = doubleChance && doubleChance.localWinAvg ? (1 / doubleChance.localWinAvg) : (1 / localWinAvg) + (1 / drawAvg);
  let awayAvg = doubleChance && doubleChance.awayWinAvg ? (1 / doubleChance.awayWinAvg) : (1 / awayWinAvg) + (1 / drawAvg);

  if ((1 / localWin) + awayAvg <= valueBetLimit) return { valueRatio: round((1 / localWin) + awayAvg, 2), betTo: 'local', odds: localWin, avgOdds: localAvg };
  if ((1 / awayWin) + localAvg <= valueBetLimit) return { valueRatio: round((1 / awayWin) + localAvg, 2), betTo: 'away', odds: awayWin, avgOdds: awayAvg };
};
const percentageRule = (line) => {
  const {
    localWin, awayWin, awayWinAvg, localWinAvg,
  } = line;
  const localBetMargin = ((localWin * 100) / localWinAvg) - 100;
  if (localWin < 4 && (localBetMargin > percentageRuleLimit)) return { percentage: localBetMargin };
  const awayBetMargin = ((awayWin * 100) / awayWinAvg) - 100;
  if (awayWin < 4 && (awayBetMargin > percentageRuleLimit)) return { percentage: awayBetMargin };
  return false;
};
const overUnderPercentageRule = (lines) => {
  const valueBets = lines.reduce((list, line) => {
    const {
      overOdds, underOdds, underOddsAvg, overOddsAvg,
    } = line;
    const overBetMargin = ((overOdds * 100) / overOddsAvg) - 100;
    if (overOdds < 4 && (overBetMargin > percentageRuleLimit)) list.push({ ...line, percentage: overBetMargin });
    const underBetMargin = ((underOdds * 100) / underOddsAvg) - 100;
    if (underOdds < 4 && (underBetMargin > percentageRuleLimit)) list.push({ ...line, percentage: underBetMargin });
    return list;
  }, []);
  return valueBets;
};
const doubleChance = (doubleChanceLine, moneyLine) => {
  const {
    localwin, awayWin, localWinAvg, awayWinAvg
  } = doubleChanceLine;
  if (!moneyLine) return false
  if ((1 / localwin) + (1 / moneyLine.awayWinAvg) <= valueBetLimit) return { valueRatio: round((1 / localwin) + (1 / moneyLine.awayWinAvg), 2), betTo: 'local', odds: localwin, avgOdds: localWinAvg };
  if ((1 / awayWin) + (1 / moneyLine.localWinAvg) <= valueBetLimit) return { valueRatio: round((1 / awayWin) + (1 / moneyLine.localWinAvg), 2), betTo: 'local', odds: awayWin, avgOdds: awayWinAvg };
  return false;
};
const drawNoBet = (dnb) => {
  const {
    localWin, localWinAvg, awayWin, awayWinAvg,
  } = dnb;
  if ((1 / localWin) + (1 / awayWinAvg) <= valueBetLimit) return { valueRatio: round((1 / localwin) + (1 / awayWinAvg), 2), betTo: 'local', odds: localWin, avgOdds: localWinAvg };
  if ((1 / awayWin) + (1 / localWinAvg) <= valueBetLimit) return { valueRatio: round((1 / awayWin) + (1 / localWinAvg), 2), betTo: 'away', odds: awayWin, avgOdds: awayWinAvg };
  return false;
};
const bothTeamsScore = (match) => {
  const {
    localWin, localWinAvg, awayWin, awayWinAvg,
  } = match;
  if ((1 / localWin) + (1 / awayWinAvg) <= valueBetLimit) return { valueRatio: round((1 / localwin) + (1 / awayWinAvg), 2), betTo: 'local', odds: localWin, avgOdds: localWinAvg };
  if ((1 / awayWin) + (1 / localWinAvg) <= valueBetLimit) return { valueRatio: round((1 / awayWin) + (1 / localWinAvg), 2), betTo: 'away', odds: awayWin, avgOdds: awayWinAvg };
  return false;
};
const overUnderGoals = (lines) => {
  const valueBets = lines.reduce((list, line) => {
    const {
      overOdds, underOdds, underOddsAvg, overOddsAvg,
    } = line;
    if (overOdds < 13 && ((1 / overOdds) + (1 / underOddsAvg) <= valueBetLimit)) list.push({ ...line, valueRatio: round((1 / overOdds) + (1 / underOddsAvg), 2), betTo: 'local', odds: overOdds, avgOdds: overOddsAvg });
    if (underOdds < 13 && ((1 / underOdds) + (1 / overOddsAvg) <= valueBetLimit)) list.push({ ...line, valueRatio: round((1 / underOdds) + (1 / overOddsAvg), 2), betTo: 'away', odds: underOdds, avgOdds: underOddsAvg });
    return list;
  }, []);
  return valueBets;
};
const asianHandicap = (lines) => {
  const valueBets = lines.reduce((list, line) => {
    const {
      overOdds, underOdds, overOddsAvg, underOddsAvg
    } = line;

    if (overOdds < 13 && ((1 / overOdds) + (1 / underOddsAvg) <= valueBetLimit)) list.push({ ...line, valueRatio: round((1 / overOdds) + (1 / underOddsAvg), 2), betTo: 'local', odds: overOdds, avgOdds: overOddsAvg });
    if (underOdds < 13 && ((1 / underOdds) + (1 / overOddsAvg) <= valueBetLimit)) list.push({ ...line, valueRatio: round((1 / underOdds) + (1 / overOddsAvg), 2), betTo: 'away', odds: underOdds, avgOdds: underOddsAvg });
    return list;
  }, []);
  return valueBets;
}

const composeValueBetLine = (match, line, path, valueBet, lineValue) => ({
  match: match.match, date: match.date, line, lineValue, url: match.url + path, valueRatio: valueBet.valueRatio, betTo: valueBet.betTo, odds: valueBet.odds, avgOdds: valueBet.avgOdds
});
const composePercentageBetLine = (match, line, path, valueBet, lineValue) => ({
  match: match.match, date: match.date, line, lineValue, url: match.url + path, percentage: valueBet.percentage, betTo: valueBet.betTo, odds: valueBet.odds, avgOdds: valueBet.avgOdds
});

async function saveToDatabase(valueBets) {
  const promises = [];
  const newValueBets = [];
  const entriesToNotify = [];
  for (let index = 0; index < valueBets.length; index++) {
    const bet = valueBets[index];

    const filterOptions = { match: bet.match, line: bet.line };
    if (bet.line === 'AH' || bet.line === 'O/U') filterOptions.line = bet.line;

    let vb = await ValueBet.findOne(filterOptions);
    if (vb) {
      console.log(vb.valueRatio - bet.valueRatio)
      if (vb.valueRatio > bet.valueRatio) console.log(`line improved old ${vb.valueRatio} new ${bet.valueRatio}  ${bet.url}`)
      if (vb.valueRatio - bet.valueRatio >= 0.02) entriesToNotify.push(vb._id.toString());
      vb.valueRatio = bet.valueRatio;
    } else {
      vb = new ValueBet(bet);
      entriesToNotify.push(vb._id.toString());
    }
    promises.push(vb.save());
  }
  (await Promise.all(promises)).forEach(valueBet => {
    if (entriesToNotify.includes(valueBet._id.toString()))
      newValueBets.push({ match: valueBet.match, date: valueBet.date, url: valueBet.url, line: valueBet.line, valueRatio: valueBet.valueRatio, sequence: valueBet.sequence })
  })
  return newValueBets;
}
const analyzeBets = async () => {
  try {
    console.log('looking for new value bets');

    const matches = await Odds.find();
    const valueBets = [];
    const percentageBets = []
    matches.forEach((match) => {
      valueBets.push(...getMatchValueBets(match));
      // percentageBets.push(...getMatchValueBetsByPercentage(match));
    });


    // Save result to db
    const newValueBets = await saveToDatabase(valueBets);
    const promises = [];
    newValueBets.forEach(valueBet => {
      console.log('new value bet: ', valueBet.url);
      promises.push(sendHtmlMessage(composeNewValueBetMessage(valueBet)));
    })
    // percentageBets.forEach(valueBet => {
    //   console.log(`new percentage bet: ${valueBet.url} %: ${valueBet.percentage}`);
    //   promises.push(sendHtmlMessage(composeNewPercentageBetMessage(valueBet)));
    // })
  } catch (error) {
    console.log('Error: ', error);
  } finally {
    console.log('done');
  }
};

const start = () => {
  const job = new CronJob(`0 */${frequency} * * * *`, async function () {
    await analyzeBets();
  });
  job.start();
}

module.exports = { start }





function getMatchValueBetsByPercentage(match) {
  const results = [];
  if (match.moneyLine) {
    const result = percentageRule(match.moneyLine);
    if (result)
      results.push(composePercentageBetLine(match, 'ML', '', result));
  }
  if (match.dnb) {
    const result = percentageRule(match.dnb);
    if (result)
      results.push(composePercentageBetLine(match, 'DNB', '#dnb;2', result));
  }
  if (match.doubleChance) {
    const result = percentageRule(match.doubleChance);
    if (result)
      results.push(composePercentageBetLine(match, 'DC', '#double;2', result));
  }
  if (match.bts) {
    const result = bothTeamsScore(match.bts);
    if (result)
      results.push(composePercentageBetLine(match, 'BTS', '#bts;2', result));
  }
  if (match.overUnder.length > 0) {
    const overUnderLines = overUnderPercentageRule(match.overUnder);
    overUnderLines.forEach((line) => results.push(composePercentageBetLine(match, 'O/U', `#over-under;2;${addZeroes(line.line)};0`, line, line.line)));
  }
  if (match.asianHandicap.length > 0) {
    const asianHandicapLines = overUnderPercentageRule(match.asianHandicap);
    asianHandicapLines.forEach((line) => results.push(composePercentageBetLine(match, 'AH', `#ah;2;${addZeroes(line.line)};0`, line, line.line)));
  }
  return results;
}

function getMatchValueBets(match) {
  const results = [];
  if (match.moneyLine) {
    const result = moneyline(match.moneyLine, match.doubleChance);
    if (result)
      results.push(composeValueBetLine(match, 'moneyline', '', result));
  }
  if (match.dnb) {
    const result = drawNoBet(match.dnb);
    if (result)
      results.push(composeValueBetLine(match, 'dnb', '#dnb;2', result));
  }
  if (match.doubleChance) {
    const result = doubleChance(match.doubleChance, match.moneyLine);
    if (result)
      results.push(composeValueBetLine(match, 'DC', '#double;2', result));
  }
  if (match.bts) {
    const result = bothTeamsScore(match.bts);
    if (result)
      results.push(composeValueBetLine(match, 'bts', '#bts;2', result));
  }
  if (match.overUnder.length > 0) {
    const overUnderLines = overUnderGoals(match.overUnder);
    overUnderLines.forEach((line) => results.push(composeValueBetLine(match, 'O/U', `#over-under;2;${addZeroes(line.line)};0`, line, line.line)));
  }
  if (match.asianHandicap.length > 0) {
    const asianHandicapLines = asianHandicap(match.asianHandicap);
    asianHandicapLines.forEach((line) => results.push(composeValueBetLine(match, 'AH', `#ah;2;${addZeroes(line.line)};0`, line, line.line)));
  }
  return results;
}

