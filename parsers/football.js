/* eslint-disable max-len */
// check if the match is live
// .result-live

const constants = require('../utils/parserConstants');

// check if th match is finished
// relative w-4 h-4 mr-1 bg-center bg-no-repeat bg-exclamation-orange-icon
const parse3WaysLine = async (page) => {
  page.on('console', (consoleObj) => console.log(consoleObj.text()));
  const result = await page.evaluate((constants) => {
    const BOOKIE_NAME = 0;
    const LOCAL_WIN = 1;
    const AWAY_WIN = 3;
    const bookiesOdds = Array.from(document.getElementsByClassName('flex text-xs max-sm:h-[60px] h-9 border-b'));
    const result = {
      availableInBet365: false,
      availableInPinnacle: false,
      availableInBwin: false,
      availableInBetfair: false,
      availableInWilliamHill: false,
      numOfBookies: 0,
      localWinSum: 0,
      awayWinSum: 0,
      localWin: 0,
      awayWin: 0,
      localUpTrend: 0,
      localDownTrend: 0,
      awayUpTrend: 0,
      awayDownTrend: 0,
      pinnaLocalWin: 0,
      pinnaAwayWin: 0,
      bwinLocalWin: 0,
      bwinAwayWin: 0,
      williamHillLocalWin: 0,
      williamHillAwayWin: 0,
    };
    bookiesOdds.reduce((result, currentBookie) => {
      const columns = currentBookie.querySelectorAll('.flex.items-center');
      const bookieName = columns[BOOKIE_NAME].textContent;
      const localWin = parseFloat(columns[LOCAL_WIN].textContent);
      const awaylWin = parseFloat(columns[AWAY_WIN].textContent);
      result.localWinSum += localWin;
      result.awayWinSum += awaylWin;
      result.numOfBookies += 1;
      if (bookieName === constants.BET365) {
        result.localWin = localWin;
        result.awayWin = awaylWin;
        result.availableInBet365 = true;
        result.localIsInitalOdd = !lineJSON.movement[key]['0'];
        result.awayIsInitalOdd = !lineJSON.movement[key]['2'];
      }
      return result;
    }, result);
    return result;
  }, constants);
  return result;
};
const linesParsers = {
  '1X2': { func: parse3WaysLine, name: 'moneyLine' },
  double: { func: parse3WaysLine, name: 'doubleChance' },
  bts: { func: () => {}, name: 'bts' },
  dnb: { func: () => {}, name: 'dnb' },
  'over-under': { func: () => {}, name: 'overUnder' },
  ah: { func: () => {}, name: 'asianHandicap' },
};

const extractOdds = async (page, url, line) => {
  console.log(url);
  console.log(line);
  try {
    const odds = {};
    if (!url.includes(line)) return;

    const isValidPage = await page.evaluate(() => {
      const liveResult = document.querySelector('.result-live');
      const finishiedMatch = document.getElementsByClassName('relative w-4 h-4 mr-1 bg-center bg-no-repeat bg-exclamation-orange-icon');
      return !(liveResult || finishiedMatch.length);
    });
    if (isValidPage) { odds[linesParsers[line].name] = await linesParsers[line].func(page); }
    return odds;
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  extractOdds,
};
