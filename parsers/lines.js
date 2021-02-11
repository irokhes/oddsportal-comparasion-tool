/* eslint-disable no-param-reassign */
const BET365 = '16';
const PINNACLE = '18';
const parse3WaysLine = (lineJSON) => {
  if (!lineJSON) return undefined;
  const parsedLine = Object.keys(lineJSON.odds).reduce((result, key) => {
    if (!lineJSON.act[key]) return result;
    result.localWinSum += lineJSON.odds[key]['0'];
    result.awayWinSum += lineJSON.odds[key]['2'];
    result.numOfBookies += 1;
    if (key === BET365) {
      result.localWin = lineJSON.odds[key]['0'];
      result.draw = lineJSON.odds[key]['1'];
      result.awayWin = lineJSON.odds[key]['2'];
      result.availableInBet365 = true;
    }
    return result;
  }, {
    numOfBookies: 0, localWinSum: 0, awayWinSum: 0, localWin: 0, awayWin: 0,
  });
  return parsedLine.availableInBet365 ? {
    localWin: parsedLine.localWin,
    awayWin: parsedLine.awayWin,
    draw: parsedLine.draw,
    localWinAvg: parsedLine.localWinSum / parsedLine.numOfBookies,
    awayWinAvg: parsedLine.awayWinSum / parsedLine.numOfBookies,
  } : undefined;
};
const parse2WaysLine = (lineJSON) => {
  if (!lineJSON) return undefined;
  const parsedLine = Object.keys(lineJSON.odds).reduce((result, key) => {
    if (!lineJSON.act[key]) return result;
    result.localWinSum += lineJSON.odds[key]['0'];
    result.awayWinSum += lineJSON.odds[key]['1'];
    result.numOfBookies += 1;
    if (key === BET365) {
      result.localWin = lineJSON.odds[key]['0'];
      result.awayWin = lineJSON.odds[key]['1'];
      result.availableInBet365 = true;
    }
    return result;
  }, {
    numOfBookies: 0, localWinSum: 0, awayWinSum: 0, localWin: 0, awayWin: 0,
  });
  return parsedLine.availableInBet365 ? {
    localWin: parsedLine.localWin,
    awayWin: parsedLine.awayWin,
    localWinAvg: parsedLine.localWinSum / parsedLine.numOfBookies,
    awayWinAvg: parsedLine.awayWinSum / parsedLine.numOfBookies,
  } : undefined;
};
const parseOverUnderLine = (lineJSON) => {
  if (!lineJSON) return undefined;
  const parsedLine = Object.keys(lineJSON.odds).reduce((result, key) => {
    if (!lineJSON.act[key]) return result;
    result.overOddsSum += lineJSON.odds[key]['0'];
    result.underOddsSum += lineJSON.odds[key]['1'];
    result.numOfBookies += 1;
    if (key === BET365) {
      result.availableInBet365 = true;
      result.overOdds = lineJSON.odds[key]['0'];
      result.underOdds = lineJSON.odds[key]['1'];
    }
    return result;
  }, {
    numOfBookies: 0, overOddsSum: 0, underOddsSum: 0, overOdds: 0, underOdds: 0,
  });
  return parsedLine.availableInBet365 ? {
    overOdds: parsedLine.overOdds,
    underOdds: parsedLine.underOdds,
    overOddsAvg: parsedLine.overOddsSum / parsedLine.numOfBookies,
    underOddsAvg: parsedLine.underOddsSum / parsedLine.numOfBookies,
  } : undefined;
};
module.exports = {
  parse3WaysLine,
  parse2WaysLine,
  parseOverUnderLine,
};