/* eslint-disable no-case-declarations */
/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
const fs = require('fs');

const limitPercentage = 1.08;
const topPercentage = 1.5;
const maxOddValue = 25;
const valueBetLimit = 1.02;

const rules = {
  1: 'avgVsBet365MarginWithBetHighest',
  2: 'avgVsBet365Margin',
};

const moneyline = (bookies, localAvg, awayAvg) => {
  if (bookies.length < 8) return {};

  const locAvg = parseFloat(localAvg) * limitPercentage;
  const awyAvg = parseFloat(awayAvg) * limitPercentage;
  const locAvgTopLimit = parseFloat(localAvg) * topPercentage;
  const awyAvgTopLimit = parseFloat(awayAvg) * topPercentage;
  const filteredHighBookies = bookies.reduce((filtered, bookie) => {
    // if (bookie.name === 'bet365' && bookie.localWinOddHigh && bookie.localWin < maxOddValue) {
    if (bookie.name === 'bet365' && bookie.localWin < maxOddValue) {
      if (bookie.localWin >= locAvg && bookie.localWin < locAvgTopLimit) filtered.localWin = { bookie: bookie.name, odds: parseFloat(bookie.localWin) };
    }
    // if (bookie.name === 'bet365' && bookie.awayWinOddHigh && bookie.awayWin < maxOddValue) {
    if (bookie.name === 'bet365' && bookie.awayWin < maxOddValue) {
      if (bookie.awayWin >= awyAvg && bookie.awayWin < awyAvgTopLimit) filtered.localWinOdds = { bookie: bookie.name, odds: parseFloat(bookie.awayWin) };
    }
    return filtered;
  }, {});
  return filteredHighBookies;
};
const doubleChance = (bookies, localOrDrawAvg, awayOrDrawAvg) => {
  if (bookies.length < 8) return {};

  const locOrDrawAvg = parseFloat(localOrDrawAvg) * limitPercentage;
  const awyOrDrawAvg = parseFloat(awayOrDrawAvg) * limitPercentage;

  const locOrDrawAvgTopLimit = parseFloat(localOrDrawAvg) * topPercentage;
  const awyOrDrawAvgTopLimit = parseFloat(awayOrDrawAvg) * topPercentage;

  const filteredHighBookies = bookies.reduce((filtered, bookie) => {
    // if (bookie.name === 'bet365' && bookie.localOrDrawHigh && bookie.localOrDraw < maxOddValue) {
    if (bookie.name === 'bet365' && bookie.localOrDraw < maxOddValue) {
      if (bookie.localOrDraw >= locOrDrawAvg && bookie.localOrDraw < locOrDrawAvgTopLimit) { filtered.localDoubleChance = { bookie: bookie.name, odds: parseFloat(bookie.localOrDraw) }; }
    }
    // if (bookie.name === 'bet365' && bookie.awayOrDrawHigh && bookie.awayOrDraw < maxOddValue) {
    if (bookie.name === 'bet365' && bookie.awayOrDraw < maxOddValue) {
      if (bookie.awayOrDraw >= awyOrDrawAvg && bookie.awayOrDraw < awyOrDrawAvgTopLimit) { filtered.awayDoubleChance = { bookie: bookie.name, odds: parseFloat(bookie.awayOrDraw) }; }
    }
    return filtered;
  }, {});
  return filteredHighBookies;
};
const drawNoBet = (bookies, localWinDnbAvg, awayWinDnbAvg) => {
  if (bookies.length < 8) return {};

  const filteredHighBookies = bookies.reduce((filtered, bookie) => {
    if (bookie.name === 'bet365') {
      if ((1 / bookie.localWinDnb) + (1 / awayWinDnbAvg) <= valueBetLimit) {
        return { bookie: bookie.name, odds: bookie.localWinDnb };
      }
    }
    if (bookie.name === 'bet365' && bookie.awayWinDnb < maxOddValue) {
      if ((1 / bookie.awayWinDnb) + (1 / localWinDnbAvg) <= valueBetLimit) {
        return { bookie: bookie.name, odds: bookie.awayWinDnb };
      }
    }
    return filtered;
  }, {});
  return filteredHighBookies;
};
const bothTeamsScore = (match) => {
  const {
    bothScoreYes, bothScoreYesAvg, bothScoreNo, bothScoreNoAvg,
  } = match;
  if ((1 / bothScoreYes) + (1 / bothScoreNoAvg) <= valueBetLimit) return match;
  if ((1 / bothScoreNo) + (1 / bothScoreYesAvg) <= valueBetLimit) return match;
};
const underOverGoals = (match) => {
  const {
    overGoals, underGoals, underGoalsAvg, overGoalsAvg,
  } = match;
  if ((1 / overGoals) + (1 / underGoalsAvg) <= valueBetLimit) return match;
  if ((1 / underGoals) + (1 / overGoalsAvg) <= valueBetLimit) return match;
};
const composeValueBetLine = (match, line, path) => ({
  match: match.match, date: match.date, line, url: match.url + path,
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
start();
