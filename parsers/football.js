/* eslint-disable no-shadow */
/* eslint-disable max-len */
const { delay } = require('../utils/utils.js');
const { getMatch, getActiveTab } = require('../utils/parser');
const getDNBOdds = async (page, url) => {
  console.log('get DNB');
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
  await page.goto(`${url}#dnb`);

  if ((await getActiveTab(page)) !== 'Draw No Bet') return;
  const dnb = await page.evaluate(() => {
    // get average odds
    const localWinDnbAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(2)';
    const localWinDnbAvg = document.querySelector(localWinDnbAvgOddsSelector).textContent;
    const awayWinDnbAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(3)';
    const awayWinDnbAvg = document.querySelector(awayWinDnbAvgOddsSelector).textContent;

    const bookies = Array.from(document.querySelectorAll(
      '#odds-data-table > div:nth-child(1) > table > tbody > tr.lo',
    ));

    const dnbLineOdds = bookies.reduce((odds, bookie) => {
      const nameSelector = bookie.querySelector('.name');
      if (!nameSelector) return odds;
      const name = nameSelector.textContent;

      const oddsSelector = Array.from(bookie.querySelectorAll('.odds'));

      const localWinDnbHigh = oddsSelector[0].classList.contains('high');
      const localWinDnb = oddsSelector[0].querySelector('div') !== null
        ? oddsSelector[0].querySelector('div').textContent
        : oddsSelector[0].querySelector('a').textContent;

      const awayWinDnbHigh = oddsSelector[1].classList.contains('high');
      const awayWinDnb = oddsSelector[1].querySelector('div') !== null
        ? oddsSelector[1].querySelector('div').textContent
        : oddsSelector[1].querySelector('a').textContent;
      odds.push({
        name, localWinDnbHigh, localWinDnb, awayWinDnb, awayWinDnbHigh,
      });
      return odds;
    }, []);
    return { dnbLineOdds, localWinDnbAvg, awayWinDnbAvg };
  });

  return dnb;
};

const getDoubleChanceLineOdds = async (page, url) => {
  console.log('get DC');
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
  await page.goto(`${url}#double`);

  if ((await getActiveTab(page)) !== 'Double Chance') {
    console.log('Wrong Tab!!! we were supose too be in Double Chance');
    return {};
  }

  const doubleChance = await page.evaluate(() => {
    // get average odds
    const localOrDrawAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(2)';
    const localOrDrawAvg = document.querySelector(localOrDrawAvgOddsSelector).textContent;
    const awayOrDrawAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(4)';
    const awayOrDrawAvg = document.querySelector(awayOrDrawAvgOddsSelector).textContent;

    const bookies = Array.from(document.querySelectorAll(
      '#odds-data-table > div:nth-child(1) > table > tbody > tr.lo',
    ));

    const doubleChanceLineOdds = bookies.reduce((odds, bookie) => {
      const nameSelector = bookie.querySelector('.name');
      if (!nameSelector) return odds;
      const name = nameSelector.textContent;

      const oddsSelector = Array.from(bookie.querySelectorAll('.odds'));
      const localOrDrawHigh = oddsSelector[0].classList.contains('high');
      const localOrDraw = oddsSelector[0].querySelector('div') !== null
        ? oddsSelector[0].querySelector('div').textContent
        : oddsSelector[0].querySelector('a').textContent;

      const localOrAway = oddsSelector[1].querySelector('div') !== null
        ? oddsSelector[1].querySelector('div').textContent
        : oddsSelector[1].querySelector('a').textContent;

      const awayOrDrawHigh = oddsSelector[2].classList.contains('high');
      const awayOrDraw = oddsSelector[2].querySelector('div') !== null
        ? oddsSelector[2].querySelector('div').textContent
        : oddsSelector[2].querySelector('a').textContent;
      odds.push({
        name, localOrDraw, localOrDrawHigh, awayOrDraw, awayOrDrawHigh, localOrAway,
      });
      return odds;
    }, []);
    return { doubleChanceLineOdds, localOrDrawAvg, awayOrDrawAvg };
  });
  return doubleChance;
};

const getMoneyLineOdds = async (page, url) => {
  console.log('get ML');
  await page.goto(url);
  const selector = '#bettype-tabs > ul > li.first.active > strong > span';
  const resultSelector = '.result';
  const resultLiveSelector = '.result-live';
  const resultAlertSelector = '.result-alert';
  if (await page.$(resultSelector) !== null
    || await page.$(resultAlertSelector) !== null
    || await page.$(resultLiveSelector) !== null
    || await page.$(selector) === null) {
    return { hasBet365Odds: false };
  }
  const result = await page.evaluate(() => {
    const match = document.querySelector('h1').textContent;
    const date = document.querySelector('.date').textContent;

    // get average odds
    const localWinAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(2)';
    const localAvg = document.querySelector(localWinAvgOddsSelector).textContent;
    const awayWinAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(4)';
    const awayAvg = document.querySelector(awayWinAvgOddsSelector).textContent;

    let hasBet365Odds = false;
    const bookies = Array.from(document.querySelectorAll(
      '#odds-data-table > div:nth-child(1) > table > tbody > tr.lo',
    ));

    const moneyLineOdds = bookies.reduce((odds, bookie) => {
      const nameSelector = bookie.querySelector('.name');
      if (!nameSelector) return odds;
      const name = nameSelector.textContent;

      if (!hasBet365Odds && name === 'bet365') hasBet365Odds = true;

      const oddsSelector = Array.from(bookie.querySelectorAll('.odds'));
      const localWinOddHigh = oddsSelector[0].classList.contains('high');
      const localWin = oddsSelector[0].querySelector('div') !== null
        ? oddsSelector[0].querySelector('div').textContent
        : oddsSelector[0].querySelector('a').textContent;
      const drawOddHigh = oddsSelector[0].classList.contains('high');

      const draw = oddsSelector[1].querySelector('div') !== null
        ? oddsSelector[1].querySelector('div').textContent
        : oddsSelector[1].querySelector('a').textContent;

      const awayWidOddHigh = oddsSelector[0].classList.contains('high');
      const awayWin = oddsSelector[2].querySelector('div') !== null
        ? oddsSelector[2].querySelector('div').textContent
        : oddsSelector[2].querySelector('a').textContent;
      odds.push({
        name, localWin, localWinOddHigh, draw, drawOddHigh, awayWin, awayWidOddHigh,
      });
      return odds;
    }, []);
    return {
      moneyLineOdds, hasBet365Odds, match, date, localAvg, awayAvg,
    };
  });
  return result;
};

const getUnderOverGoalsLines = async (page, url) => {
  page.on('console', (consoleObj) => console.log(consoleObj.text()));
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');


  console.log('get U/O');
  await page.goto(`${url}#over-under`);

  if ((await getActiveTab(page)) !== 'Over/Under') {
    console.log('Wrong Tab!!! we were supose too be in Over/Under');
    return [];
  }
  return (page.evaluate(() => [...document.querySelectorAll('#odds-data-table > div > div')]
    .reduce((list, currentLine) => {
      let numOfBookies = currentLine.querySelector('.odds-cnt')
      if (!numOfBookies) return list;
      numOfBookies = numOfBookies.innerText.replace(/[()]/g, '');
      if (numOfBookies > 6)
        list.push(currentLine.querySelector('strong > a').innerText.replace('Over/Under +', ''));
      return list;
    }, [])));
};

const getUnderOverGoalsOdds = async (page, url, numOfGoals) => {
  console.log(`page ${url} numOfGoals ${numOfGoals}`);
  page.on('console', (consoleObj) => console.log(consoleObj.text()));
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');

  await page.goto(url);

  if ((await getActiveTab(page)) !== 'Over/Under') {
    console.log('Wrong Tab!!! we were supose too be in Over/Under');
    return {};
  }

  const match = await getMatch(page);
  const underOverGoals = await page.evaluate((numOfGoals) => {
    // get average odds
    const overGolasAvgSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(3)';
    const overGoalsAvg = document.querySelector(overGolasAvgSelector).textContent;
    const underGoalsAvgSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(4)';
    const underGoalsAvg = document.querySelector(underGoalsAvgSelector).textContent;

    console.log('numOfGoals ', numOfGoals);
    const tablesWithLines = Array.from(document.querySelectorAll(
      '#odds-data-table > div',
    ));
    let selectedLine;
    tablesWithLines.some((table) => {
      const tableHeaderText = table.querySelector('div > strong > a');
      if (tableHeaderText) console.log(tableHeaderText.innerText);
      if (tableHeaderText && tableHeaderText.innerText === `Over/Under +${numOfGoals}`) {
        selectedLine = table;
        return true;
      }
      return false;
    });

    const bookies = Array.from(selectedLine.querySelectorAll(
      'table > tbody > tr.lo',
    ));

    let underOverGoalsOdds;
    bookies.some((bookie) => {
      const nameSelector = bookie.querySelector('.name');
      if (!nameSelector) return false;

      const name = nameSelector.textContent;
      if (name !== 'bet365') return false;

      // const numOfGoals = bookie.querySelector('.centre').innerText;

      const oddsRowSelector = Array.from(bookie.querySelectorAll('.odds'));

      const oddsSelector = oddsRowSelector[0].querySelector('div');
      if (oddsSelector && oddsSelector.classList.contains('deactivateOdd')) return false;

      const overGoalsHigh = oddsRowSelector[0].classList.contains('high');
      const overGoals = oddsRowSelector[0].querySelector('div') !== null
        ? oddsRowSelector[0].querySelector('div').textContent
        : oddsRowSelector[0].querySelector('a').textContent;

      const underGoalsHigh = oddsRowSelector[1].classList.contains('high');
      const underGoals = oddsRowSelector[1].querySelector('div') !== null
        ? oddsRowSelector[1].querySelector('div').textContent
        : oddsRowSelector[1].querySelector('a').textContent;
      underOverGoalsOdds = {
        name, numOfGoals, overGoals, overGoalsHigh, underGoals, underGoalsHigh,
      };
      return true;
    });
    return { ...underOverGoalsOdds, underGoalsAvg, overGoalsAvg };
  }, numOfGoals);
  return { ...underOverGoals, match, url }

}

const getBothTeamsScoreOdds = async (page, url) => {
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');

  console.log('get Both Teams Score');
  await page.goto(`${url}#bts`);

  if ((await getActiveTab(page)) !== 'Both Teams to Score"') {
    console.log('Wrong Tab!!! we were supose too be in Both Teams to Score"');
    return {};
  }

  const match = await getMatch(page);
  const bothTeamsScore = await page.evaluate(() => {
    // get average odds
    const bothScoreYesAvgSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(2)';
    const bothScoreYesAvg = document.querySelector(bothScoreYesAvgSelector).textContent;
    const bothScoreNoAvgSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(3)';
    const bothScoreNoAvg = document.querySelector(bothScoreNoAvgSelector).textContent;

    const bookies = Array.from(document.querySelectorAll(
      '#odds-data-table > div:nth-child(1) > table > tbody > tr.lo',
    ));
    let bothTeamsScoreOdds;
    bookies.some((bookie) => {
      const nameSelector = bookie.querySelector('.name');
      if (!nameSelector) return false;

      const name = nameSelector.textContent;
      if (name !== 'bet365') return false;

      const oddsSelector = Array.from(bookie.querySelectorAll('.odds'));
      const bothScoreYesHigh = oddsSelector[0].classList.contains('high');
      const bothScoreYes = oddsSelector[0].querySelector('div') !== null
        ? oddsSelector[0].querySelector('div').textContent
        : oddsSelector[0].querySelector('a').textContent;

      const bothScoreNoHigh = oddsSelector[1].classList.contains('high');
      const bothScoreNo = oddsSelector[1].querySelector('div') !== null
        ? oddsSelector[1].querySelector('div').textContent
        : oddsSelector[1].querySelector('a').textContent;
      bothTeamsScoreOdds = {
        name, bothScoreYes, bothScoreYesHigh, bothScoreNo, bothScoreNoHigh,
      };
      return true;
    });
    return { ...bothTeamsScoreOdds, bothScoreYesAvg, bothScoreNoAvg };
  });
  return { ...bothTeamsScore, match, url }
};
module.exports = {
  getMoneyLineOdds,
  getDoubleChanceLineOdds,
  getDNBOdds,
  getUnderOverGoalsLines,
  getBothTeamsScoreOdds,
  getUnderOverGoalsOdds
};
