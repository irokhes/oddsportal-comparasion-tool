/* eslint-disable no-case-declarations */
/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
const fs = require('fs');
const { addZeroes, getOddsBelowOpeningValue } = require('./utils/utils');
const db = require('./models/db');
const Odds = require('./models/odds');
const ValueBet = require('./models/valueBet');
const { sendHtmlMessage, sendMessage } = require('./telegram');
const { composeNewValueBetMessage } = require('./utils/messages');
const CronJob = require('cron').CronJob;
const { frequency } = require('./config');


const valueBetLimit = 1.015;

const moneyline = (moneyLine, doubleChance) => {
  const {
    localWin, awayWin, awayWinAvg, localWinAvg, drawAvg,
  } = moneyLine;
  let localAvg = doubleChance && doubleChance.localWinAvg ? (1 / doubleChance.localWinAvg) : (1 / localWinAvg) + (1 / drawAvg);
  let awayAvg = doubleChance && doubleChance.awayWinAvg ? (1 / doubleChance.awayWinAvg) : (1 / awayWinAvg) + (1 / drawAvg);

  if ((1 / localWin) + awayAvg <= valueBetLimit) return { valueRatio: (1 / localWin) + awayAvg, betTo: 'local', odds: localWin, avgOdds: localAvg };
  if ((1 / awayWin) + localAvg <= valueBetLimit) return { valueRatio: (1 / awayWin) + localAvg, betTo: 'away', odds: awayWin, avgOdds: awayAvg };
};
const doubleChance = (doubleChanceLine, moneyLine) => {
  const {
    localwin, awayWin,
  } = doubleChanceLine;
  if (!moneyLine) return false
  if ((1 / localwin) + (1 / moneyLine.awayWinAvg) <= valueBetLimit) return { valueRatio: (1 / localwin) + (1 / moneyLine.awayWinAvg), betTo: 'local', odds: localwin, avgOdds: localAvg };
  if ((1 / awayWin) + (1 / moneyLine.localWinAvg) <= valueBetLimit) return { valueRatio: (1 / awayWin) + (1 / moneyLine.localWinAvg), betTo: 'local', odds: awayWin, avgOdds: awayAvg };
  return false;
};
const drawNoBet = (dnb) => {
  const {
    localWin, localWinAvg, awayWin, awayWinAvg,
  } = dnb;
  if ((1 / localWin) + (1 / awayWinAvg) <= valueBetLimit) return { valueRatio: (1 / localWin) + awayAvg, betTo: 'local', odds: localWin, avgOdds: localAvg };
  if ((1 / awayWin) + (1 / localWinAvg) <= valueBetLimit) return { valueRatio: (1 / awayWin) + localAvg, betTo: 'away', odds: awayWin, avgOdds: awayAvg };
  return false;
};
const bothTeamsScore = (match) => {
  const {
    localWin, localWinAvg, awayWin, awayWinAvg,
  } = match;
  if ((1 / localWin) + (1 / awayWinAvg) <= valueBetLimit) return { valueRatio: (1 / localWin) + awayAvg, betTo: 'local', odds: localWin, avgOdds: localAvg };
  if ((1 / awayWin) + (1 / localWinAvg) <= valueBetLimit) return { valueRatio: (1 / awayWin) + localAvg, betTo: 'away', odds: awayWin, avgOdds: awayAvg };
  return false;
};
const overUnderGoals = (lines) => {
  const valueBets = lines.reduce((list, line) => {
    const {
      overOdds, underOdds, underOddsAvg, overOddsAvg,
    } = line;
    if (overOdds < 13 && ((1 / overOdds) + (1 / underOddsAvg) <= valueBetLimit)) list.push({ ...line, valueRatio: (1 / overOdds) + (1 / underOddsAvg), betTo: 'local', odds: overOdds, avgOdds: overOddsAvg });
    if (underOdds < 13 && ((1 / underOdds) + (1 / overOddsAvg) <= valueBetLimit)) list.push({ ...line, valueRatio: (1 / underOdds) + (1 / overOddsAvg), betTo: 'away', odds: awayWin, avgOdds: underOddsAvg });
    return list;
  }, []);
  return valueBets;
};
const asianHandicap = (lines) => {
  const valueBets = lines.reduce((list, line) => {
    const {
      overOdds, underOdds, overOddsAvg, underOddsAvg
    } = line;

    if (overOdds < 13 && ((1 / overOdds) + (1 / underOddsAvg) <= valueBetLimit)) list.push({ ...line, valueRatio: (1 / overOdds) + (1 / underOddsAvg), betTo: 'local', odds: overOdds, avgOdds: overOddsAvg });
    if (underOdds < 13 && ((1 / underOdds) + (1 / overOddsAvg) <= valueBetLimit)) list.push({ ...line, valueRatio: (1 / underOdds) + (1 / overOddsAvg), betTo: 'away', odds: underOdds, avgOdds: underOddsAvg });
    return list;
  }, []);
  return valueBets;
}

const composeValueBetLine = (match, line, path, valueBet, lineValue) => ({
  match: match.match, date: match.date, line, lineValue, url: match.url + path, valueRatio: valueBet.valueRatio, betTo: valueBet.betTo, odds: valueBet.odds, avgOdds: valueBet.avgOdds
});

async function saveToDatabase(valueBets) {
  const promises = [];
  const newValueBets = [];
  const newEntries = [];
  for (let index = 0; index < valueBets.length; index++) {
    const bet = valueBets[index];

    const filterOptions = { match: bet.match, line: bet.line };
    if (bet.line === 'AH' || bet.line === 'O/U') filterOptions.line = bet.line;

    let vb = await ValueBet.findOne(filterOptions);
    if (vb) {
      vb.valueRatio = bet.valueRatio;
    } else {
      vb = new ValueBet(bet);
      newEntries.push(vb._id.toString());
    }
    promises.push(vb.save());
  }
  (await Promise.all(promises)).forEach(valueBet => {
    if (newEntries.includes(valueBet._id.toString()))
      newValueBets.push({ match: valueBet.match, date: valueBet.date, url: valueBet.url, line: valueBet.line, valueRatio: valueBet.valueRatio, sequence: valueBet.sequence })
  })
  return newValueBets;
}
const analyzeBets = async () => {
  try {
    console.log('looking for new value bets');
    const matches = await Odds.find({});
    const valueBets = [];
    matches.forEach((match) => {
      if (match.moneyLine) {
        const result = moneyline(match.moneyLine, match.doubleChance);
        if (result.valueRatio) valueBets.push(composeValueBetLine(match, 'moneyline', '', result));
      }
      if (match.dnb) {
        const result = drawNoBet(match.dnb);
        if (result.valueRatio) valueBets.push(composeValueBetLine(match, 'dnb', '#dnb;2', result));
      }
      if (match.doubleChance) {
        const valueRatio = doubleChance(match.doubleChance, match.moneyLine);
        if (valueRatio) valueBets.push(composeValueBetLine(match, 'DC', '#double;2', valueRatio));
      }
      if (match.bts) {
        const result = bothTeamsScore(match.bts);
        if (result.valueRatio) valueBets.push(composeValueBetLine(match, 'bts', '#bts;2', result));
      }
      if (match.overUnder.length > 0) {
        const overUnderLines = overUnderGoals(match.overUnder);
        overUnderLines.forEach((line) => valueBets.push(composeValueBetLine(match, 'O/U', `#over-under;2;${addZeroes(line.line)};0`, line.valueRatio, line.line)));
      }
      if (match.asianHandicap.length > 0) {
        const asianHandicapLines = asianHandicap(match.asianHandicap);
        asianHandicapLines.forEach((line) => valueBets.push(composeValueBetLine(match, 'AH', `#ah;2;${addZeroes(line.line)};0`, line.valueRatio, line.line)));
      }
    });

    // Save result to db
    const newValueBets = await saveToDatabase(valueBets);
    const promises = [];
    newValueBets.forEach(valueBet => {
      console.log('new value bet: ', valueBet.url);
      promises.push(sendHtmlMessage(composeNewValueBetMessage(valueBet)));
    })



    //save result to .json file
    // const data = JSON.stringify(valueBets);
    // fs.writeFileSync(`./value_bets/${Date.now()}_valuebets.json`, data);
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





