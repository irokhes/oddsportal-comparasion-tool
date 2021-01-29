/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
const fs = require('fs');

const limitPercentage = 1.06;
const topPercentage = 1.2;

const moneyline = (bookies, localAvg, awayAvg) => {
  if (bookies.length < 8) return {};

  const locAvg = parseFloat(localAvg) * limitPercentage;
  const awyAvg = parseFloat(awayAvg) * limitPercentage;
  const locAvgTopLimit = parseFloat(localAvg) * topPercentage;
  const awyAvgTopLimit = parseFloat(awayAvg) * topPercentage;
  const filteredHighBookies = bookies.reduce((filtered, bookie) => {
    // if (bookie.name === 'bet365') {
    if (bookie.name === 'bet365' && bookie.localWinOddHigh) {
      if (bookie.localWin >= locAvg && bookie.localWin < locAvgTopLimit) filtered.localWin = { bookie: bookie.name, odds: parseFloat(bookie.localWin) };
    }
    // if (bookie.name === 'bet365') {
    if (bookie.name === 'bet365' && bookie.awayWinOddHigh) {
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
    // if (bookie.name === 'bet365') {
    if (bookie.name === 'bet365' && bookie.localOrDrawHigh) {
      if (bookie.localOrDraw >= locOrDrawAvg && bookie.localOrDraw < locOrDrawAvgTopLimit) { filtered.localDoubleChance = { bookie: bookie.name, odds: parseFloat(bookie.localOrDraw) }; }
    }
    // if (bookie.name === 'bet365') {
    if (bookie.name === 'bet365' && bookie.awayOrDrawHigh) {
      if (bookie.awayOrDraw >= awyOrDrawAvg && bookie.awayOrDraw < awyOrDrawAvgTopLimit) { filtered.awayDoubleChance = { bookie: bookie.name, odds: parseFloat(bookie.awayOrDraw) }; }
    }
    return filtered;
  }, {});
  return filteredHighBookies;
};
const drawNoBet = (bookies, localWinDnbAvg, awayWinDnbAvg) => {
  if (bookies.length < 8) return {};
  const locDnbAvg = parseFloat(localWinDnbAvg) * limitPercentage;
  const awyDnbAvg = parseFloat(awayWinDnbAvg) * limitPercentage;

  const locDnbAvgTopLimit = parseFloat(localWinDnbAvg) * topPercentage;
  const awyDnbAvgTopLimit = parseFloat(awayWinDnbAvg) * topPercentage;

  const filteredHighBookies = bookies.reduce((filtered, bookie) => {
    // if (bookie.name === 'bet365') {
    if (bookie.name === 'bet365' && bookie.localWinDnbHigh) {
      if (bookie.localWinDnb >= locDnbAvg && bookie.localWinDnb < locDnbAvgTopLimit) filtered.localDnb = { bookie: bookie.name, odds: parseFloat(bookie.localWinDnbHigh) };
    }
    // if (bookie.name === 'bet365') {
    if (bookie.name === 'bet365' && bookie.awayWinDnbHigh) {
      if (bookie.awayWinDnb >= awyDnbAvg && bookie.awayWinDnb < awyDnbAvgTopLimit) filtered.awayDnb = { bookie: bookie.name, odds: parseFloat(bookie.awayWinDnbHigh) };
    }
    return filtered;
  }, {});
  return filteredHighBookies;
};
const composeValueBetLine = (match, line, path) => ({
  match: match.match, date: match.date, line, url: match.url + path,
});

const start = () => {
  try {
    const args = process.argv.slice(2);
    if (args.length < 1) {
      console.log('you need to provide a date: node index.js YYYYMMDD');
      process.exit(1);
    }
    const rawdata = fs.readFileSync(`${args[0]}.json`);
    const matches = JSON.parse(rawdata);
    const valueBets = [];
    matches.forEach((match) => {
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
    });
    const data = JSON.stringify(valueBets);
    fs.writeFileSync('valuebets.json', data);
  } catch (error) {
    console.log('Error: ', error);
  }
};
start();
