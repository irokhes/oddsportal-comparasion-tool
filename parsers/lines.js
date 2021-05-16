/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
const { round, binarySearch } = require('../utils/utils');

const BET365 = '16';
const PINNACLE = '18';
const excludedBookies = [45, 49, 411, 453, 455, 419, 141, 392, 129, 53, 163, 322, 139, 558, 46, 164, 149, 531, 414, 406, 165, 472, 160, 157, 372, 467];

const parse3WaysLine = (lineJSON) => {
  if (!lineJSON) return undefined;
  const parsedLine = Object.keys(lineJSON.odds).reduce(
    (result, key) => {
      if (binarySearch(excludedBookies, key) !== -1) { console.log(`key ${key} search result ${binarySearch(excludedBookies, key)}`); }
      if (!lineJSON.act[key] || binarySearch(excludedBookies, key) !== -1) return result;
      result.localWinSum += lineJSON.odds[key]['0'];
      result.awayWinSum += lineJSON.odds[key]['2'];
      result.numOfBookies += 1;
      if (key === BET365) {
        result.localWin = lineJSON.odds[key]['0'];
        result.draw = lineJSON.odds[key]['1'];
        result.awayWin = lineJSON.odds[key]['2'];
        result.availableInBet365 = true;
        result.localIsInitalOdd = !lineJSON.movement[key]['0'];
        result.awayIsInitalOdd = !lineJSON.movement[key]['2'];
      }

      if (lineJSON.movement[key]['0'] === 'up') result.localUpTrend += 1;
      if (lineJSON.movement[key]['0'] === 'down') result.localDownTrend += 1;
      if (lineJSON.movement[key]['2'] === 'up') result.awayUpTrend += 1;
      if (lineJSON.movement[key]['2'] === 'down') result.awayDownTrend += 1;

      return result;
    },
    {
      numOfBookies: 0,
      localWinSum: 0,
      awayWinSum: 0,
      localWin: 0,
      awayWin: 0,
      localUpTrend: 0,
      localDownTrend: 0,
      awayUpTrend: 0,
      awayDownTrend: 0,
    },
  );
  return {
    availableInBet365: parsedLine.availableInBet365,
    localWin: parsedLine.localWin,
    awayWin: parsedLine.awayWin,
    draw: parsedLine.draw,
    localWinAvg: round(parsedLine.localWinSum / parsedLine.numOfBookies, 3),
    awayWinAvg: round(parsedLine.awayWinSum / parsedLine.numOfBookies, 3),
    localUpTrend: round((parsedLine.localUpTrend / parsedLine.numOfBookies) * 100, 1),
    localDownTrend: round((parsedLine.localDownTrend / parsedLine.numOfBookies) * 100, 1),
    awayUpTrend: round((parsedLine.awayUpTrend / parsedLine.numOfBookies) * 100, 1),
    awayDownTrend: round((parsedLine.awayDownTrend / parsedLine.numOfBookies) * 100, 1),
  };
};
const parse2WaysLine = (lineJSON) => {
  if (!lineJSON) return undefined;

  const parsedLine = Object.keys(lineJSON.odds).reduce(
    (result, key) => {
      if (binarySearch(excludedBookies, key) !== -1) { console.log(`key ${key} search result ${binarySearch(excludedBookies, key)}`); }
      if (!lineJSON.act[key] || binarySearch(excludedBookies, key) !== -1) return result;
      result.localWinSum += lineJSON.odds[key]['0'];
      result.awayWinSum += lineJSON.odds[key]['1'];
      result.numOfBookies += 1;
      if (key === BET365) {
        result.localWin = lineJSON.odds[key]['0'];
        result.awayWin = lineJSON.odds[key]['1'];
        result.availableInBet365 = true;
        result.localIsInitalOdd = !lineJSON.movement[key]['0'];
        result.awayIsInitalOdd = !lineJSON.movement[key]['1'];
      }

      if (lineJSON.movement[key]['0'] === 'up') result.localUpTrend += 1;
      if (lineJSON.movement[key]['0'] === 'down') result.localDownTrend += 1;
      if (lineJSON.movement[key]['1'] === 'up') result.awayUpTrend += 1;
      if (lineJSON.movement[key]['1'] === 'down') result.awayDownTrend += 1;

      return result;
    },
    {
      numOfBookies: 0,
      localWinSum: 0,
      awayWinSum: 0,
      localWin: 0,
      awayWin: 0,
      localUpTrend: 0,
      localDownTrend: 0,
      awayUpTrend: 0,
      awayDownTrend: 0,
    },
  );
  return {
    availableInBet365: parsedLine.availableInBet365,
    localWin: parsedLine.localWin,
    awayWin: parsedLine.awayWin,
    localWinAvg: round(parsedLine.localWinSum / parsedLine.numOfBookies, 3),
    awayWinAvg: round(parsedLine.awayWinSum / parsedLine.numOfBookies, 3),
    localUpTrend: round((parsedLine.localUpTrend / parsedLine.numOfBookies) * 100, 1),
    localDownTrend: round((parsedLine.localDownTrend / parsedLine.numOfBookies) * 100, 1),
    awayUpTrend: round((parsedLine.awayUpTrend / parsedLine.numOfBookies) * 100, 1),
    awayDownTrend: round((parsedLine.awayDownTrend / parsedLine.numOfBookies) * 100, 1),
  };
};
const parseOverUnderLine = (lineJSON) => {
  if (!lineJSON) return undefined;
  const parsedLine = Object.keys(lineJSON.odds).reduce(
    (result, key) => {
      if (binarySearch(excludedBookies, key) !== -1) { console.log(`key ${key} search result ${binarySearch(excludedBookies, key)}`); }
      if (!lineJSON.act[key] || binarySearch(excludedBookies, key) !== -1) return result;
      result.overOddsSum += lineJSON.odds[key]['0'];
      result.underOddsSum += lineJSON.odds[key]['1'];
      result.numOfBookies += 1;
      if (key === BET365) {
        result.availableInBet365 = true;
        result.overOdds = lineJSON.odds[key]['0'];
        result.overIsInitalOdd = !lineJSON.movement[key]['0'];
        result.underOdds = lineJSON.odds[key]['1'];
        result.underIsInitalOdd = !lineJSON.movement[key]['1'];
      }

      if (lineJSON.movement[key]['0'] === 'up') result.localUpTrend += 1;
      if (lineJSON.movement[key]['0'] === 'down') result.localDownTrend += 1;
      if (lineJSON.movement[key]['1'] === 'up') result.awayUpTrend += 1;
      if (lineJSON.movement[key]['1'] === 'down') result.awayDownTrend += 1;

      return result;
    },
    {
      numOfBookies: 0,
      overOddsSum: 0,
      underOddsSum: 0,
      overOdds: 0,
      underOdds: 0,
      localUpTrend: 0,
      localDownTrend: 0,
      awayUpTrend: 0,
      awayDownTrend: 0,
    },
  );
  return {
    availableInBet365: parsedLine.availableInBet365,
    numOfBookies: parsedLine.numOfBookies,
    overOdds: parsedLine.overOdds,
    underOdds: parsedLine.underOdds,
    overOddsAvg: round(parsedLine.overOddsSum / parsedLine.numOfBookies, 3),
    underOddsAvg: round(parsedLine.underOddsSum / parsedLine.numOfBookies, 3),
    localUpTrend: round((parsedLine.localUpTrend / parsedLine.numOfBookies) * 100, 1),
    localDownTrend: round((parsedLine.localDownTrend / parsedLine.numOfBookies) * 100, 1),
    awayUpTrend: round((parsedLine.awayUpTrend / parsedLine.numOfBookies) * 100, 1),
    awayDownTrend: round((parsedLine.awayDownTrend / parsedLine.numOfBookies) * 100, 1),
  };
};
module.exports = {
  parse3WaysLine,
  parse2WaysLine,
  parseOverUnderLine,
};
