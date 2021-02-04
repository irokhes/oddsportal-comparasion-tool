/* eslint-disable no-case-declarations */
/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
const fs = require('fs');
const { addZeroes } = require('./utils/utils');
const db = require('./models/db');
const Odds = require('./models/odds');

const limitPercentage = 1.08;
const topPercentage = 1.5;
const maxOddValue = 25;
const valueBetLimit = 1.02;

const rules = {
  1: 'avgVsBet365MarginWithBetHighest',
  2: 'avgVsBet365Margin',
};

const moneyline = (moneyLine) => {
  const {
    localOrDraw, awayOrDraw, awayAvg, localAvg, drawAvg,
  } = moneyLine;
  if ((1 / localOrDraw) + (1 / awayAvg) + (1 / drawAvg) <= valueBetLimit) return (1 / localOrDraw) + (1 / awayAvg) + (1 / drawAvg);
  if ((1 / awayOrDraw) + (1 / localAvg) + (1 / drawAvg) <= valueBetLimit) return (1 / awayOrDraw) + (1 / localAvg) + (1 / drawAvg);
};
const doubleChance = (doubleChanceLine, moneyLine) => {
  const {
    localOrDraw, awayOrDraw,
  } = doubleChanceLine;
  if ((1 / localOrDraw) + (1 / moneyLine.awayAvg) <= valueBetLimit) return (1 / localOrDraw) + (1 / moneyLine.awayAvg);
  if ((1 / awayOrDraw) + (1 / moneyLine.localAvg) <= valueBetLimit) return (1 / awayOrDraw) + (1 / moneyLine.localAvg);
  return false;
};
const drawNoBet = (dnb) => {
  const {
    localWinDnb, localWinDnbAvg, awayWinDnb, awayWinDnbAvgs,
  } = dnb;
  if ((1 / localWinDnb) + (1 / awayWinDnbAvgs) <= valueBetLimit) return (1 / localWinDnb) + (1 / awayWinDnbAvgs);
  if ((1 / awayWinDnb) + (1 / localWinDnbAvg) <= valueBetLimit) return (1 / awayWinDnb) + (1 / localWinDnbAvg);
  return false;
};
const bothTeamsScore = (match) => {
  const {
    bothScoreYes, bothScoreYesAvg, bothScoreNo, bothScoreNoAvg,
  } = match;
  if ((1 / bothScoreYes) + (1 / bothScoreNoAvg) <= valueBetLimit) return (1 / bothScoreYes) + (1 / bothScoreNoAvg);
  if ((1 / bothScoreNo) + (1 / bothScoreYesAvg) <= valueBetLimit) return (1 / bothScoreNo) + (1 / bothScoreYesAvg);
  return false;
};
const overUnderGoals = (lines) => {
  const valueBets = lines.reduce((list, line) => {
    const {
      name, overGoals, underGoals, underGoalsAvg, overGoalsAvg,
    } = line;
    if (!name) return list;
    if (overGoals < 13 && ((1 / overGoals) + (1 / underGoalsAvg) <= valueBetLimit)) list.push({ ...line, valueRatio: (1 / overGoals) + (1 / underGoalsAvg) });
    if (underGoals < 13 && ((1 / underGoals) + (1 / overGoalsAvg) <= valueBetLimit)) list.push({ ...line, valueRatio: (1 / underGoals) + (1 / overGoalsAvg) });
    return list;
  }, []);
  return valueBets;
};
const composeValueBetLine = (match, line, path, valueRatio) => ({
  match: match.match, date: match.date, line, url: match.url + path, valueRatio
});

const start = () => {
  try {
    const args = process.argv.slice(2);
    let initialDate;
    let endDate;
    switch (args.length) {
      case 0:
        console.log('you need to provide a date: node index.js YYYYMMDD');
        process.exit(1);
        break;
      case 1:
        // eslint-disable-next-line prefer-destructuring
        initialDate = args[0];
        break;
      case 2:
        // eslint-disable-next-line prefer-destructuring
        endDate = args[1];
        break;

      default:
        break;
    }
    if (args.length < 1) {
      console.log('you need to provide a date: node index.js YYYYMMDD');
      process.exit(1);
    }
    const rawdata = fs.readFileSync(`${initialDate}.json`);
    const matches = JSON.parse(rawdata);
    const valueBets = [];
    let result;
    matches.forEach((match) => {
      switch (match.type) {
        case 'BTS':
          console.log(match);
          result = bothTeamsScore(match);
          if (result) valueBets.push(composeValueBetLine(match, 'bts', '#bts;2'));
          break;
        case 'O/U':
          result = underOverGoals(match);
          if (result) valueBets.push(composeValueBetLine(match, 'O/U', ''));
          break;
        default:
          const { localWin, awayWin } = moneyline(match.moneyLineOdds, match.localAvg, match.awayAvg);
          if (localWin) {
            valueBets.push(composeValueBetLine(match, 'moneyline', ''));
          } else if (awayWin) {
            valueBets.push(composeValueBetLine(match, 'moneyline', ''));
          }

          // eslint-disable-next-line max-len
          const { localDoubleChance, awayDoubleChance } = doubleChance(match.doubleChanceLineOdds, match.localOrDrawAvg, match.awayOrDrawAvg);
          if (localDoubleChance) {
            valueBets.push(composeValueBetLine(match, 'DC', '#double;2'));
          } else if (awayDoubleChance) {
            valueBets.push(composeValueBetLine(match, 'DC', '#double;2'));
          }

          const { localDnb, awayDnb } = drawNoBet(match.dnbLineOdds, match.localWinDnbAvg, match.awayWinDnbAvg);
          if (localDnb) {
            valueBets.push(composeValueBetLine(match, 'dnb', '#dnb;2'));
          } else if (awayDnb) {
            valueBets.push(composeValueBetLine(match, 'dnb', '#dnb;2'));
          }
          break;
      }
    });
    const data = JSON.stringify(valueBets);
    fs.writeFileSync(`${initialDate}_valuebets.json`, data);
  } catch (error) {
    console.log('Error: ', error);
  }
};
const newStart = async () => {
  try {
    const args = process.argv.slice(2);
    db.connect();

    const matches = await Odds.find({});
    const valueBets = [];
    matches.forEach((match) => {
      if (match.moneyLine && match.moneyLine.name) {
        const valueRatio = moneyline(match.moneyLine);
        if (valueRatio) valueBets.push(composeValueBetLine(match, 'moneyline', '#bts;2', valueRatio));
      }
      if (match.dnb && match.dnb.name) {
        const valueRatio = drawNoBet(match.dnb);
        if (valueRatio) valueBets.push(composeValueBetLine(match, 'dnb', '#dnb;2', valueRatio));
      }
      if (match.doubleChance && match.doubleChance.name) {
        const valueRatio = doubleChance(match.doubleChance, match.moneyLine);
        if (valueRatio) valueBets.push(composeValueBetLine(match, 'DC', '#double;2', valueRatio));
      }
      if (match.bts && match.bts.name) {
        const valueRatio = bothTeamsScore(match.bts);
        if (valueRatio) valueBets.push(composeValueBetLine(match, 'bts', '#bts;2', valueRatio));
      }
      if (match.overUnder) {
        const overUnderLines = overUnderGoals(match.overUnder);
        overUnderLines.forEach((line) => valueBets.push(composeValueBetLine(match, 'O/U', `#over-under;2;${addZeroes(line.numOfGoals)};0`, line.valueRatio)));
      }
    });
    const data = JSON.stringify(valueBets);
    fs.writeFileSync(`./value_bets/${Date.now()}_valuebets.json`, data);
  } catch (error) {
    console.log('Error: ', error);
  } finally {
    db.close();
  }
};
newStart();
// start();
