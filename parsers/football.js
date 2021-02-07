/* eslint-disable no-shadow */
/* eslint-disable max-len */
const { getMatch, getDate, getActiveTab, getBookies, getAverage,
  getSectionSelector, getInitialOdds, getName } = require('../utils/parser');
const Odds = require('../models/odds');

const getOdds5Bookies = async (page, url) => {
  const odds = {};
  page.on('console', (consoleObj) => console.log(consoleObj.text()));
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');

  await page.goto(`${url}`);
  const cookies = await page.cookies()
  console.log(cookies);
  odds.match = await getMatch(page);
  odds.date = await getDate(page);
  odds.url = url;

  // MONEYLINE
  odds.moneyLine = await getMoneyLines5BookiesWithOpeningOdds(page);

  //DNB

  const selector = await getSectionSelector(page, 'DNB');
  if (selector) {
    await page.evaluate(selector => {
      document.querySelector(selector).style.display === 'none';
      document.querySelector(selector).style.display = 'block';
    }, selector)
    await page.click(selector);
    await page.waitForSelector('#odds-data-table > div > table');
    odds.dnb = await getDnb5BookiesWithOpeningOdds(page);
  }

  //DoubleChance
  const selectorDC = await getSectionSelector(page, 'DC');
  if (selector) {
    await page.evaluate(selector => {
      document.querySelector(selector).style.display === 'none';
      document.querySelector(selector).style.display = 'block';
    }, selectorDC)
    await page.click(selectorDC);
    await page.waitForSelector('#odds-data-table > div > table');
    odds.doubleChance = await getDoubleChance5BookiesWithOpeningOdds(page);
  }

  //BothTeamsScore
  const selectorBTS = await getSectionSelector(page, 'BTS');
  if (selectorBTS) {
    await page.evaluate(selector => {
      document.querySelector(selector).style.display === 'none';
      document.querySelector(selector).style.display = 'block';
    }, selectorBTS)
    await page.click(selectorBTS);

    await page.waitForSelector('#odds-data-table > div > table');
    odds.bts = await getBothTeamsToScore5BookiesWithOpeningOdds(page);
  }

  //Over/Under Goals
  const selectorOverUnder = await getSectionSelector(page, 'O/U');
  if (selectorOverUnder) {
    await page.evaluate(selector => {
      if (document.querySelector(selector).style.display === 'none')
        document.querySelector(selector).style.display = 'block';
    }, selectorOverUnder)
    await page.click(selectorOverUnder);
    await page.waitForSelector('#odds-data-table > div:nth-child(1)');

    odds.overUnder = await getUnderOverGoalsExp(page);
  }

  //Asian Handicap
  const selectorAH = await getSectionSelector(page, 'AH');
  if (selectorAH) {
    await page.evaluate(selector => {
      if (document.querySelector(selector).style.display === 'none')
        document.querySelector(selector).style.display = 'block';
    }, selectorAH)
    await page.click(selectorAH);
    await page.waitForSelector('#odds-data-table > div:nth-child(1)');

    odds.asianHandicap = await getAHLines5Bookies(page);
  }

  // save odds
  const matchDoesNotHaveSuitableLines = !odds.moneyLine && !odds.dnb && !odds.doubleChance
    && !odds.bts && odds.overUnder.length === 0 && odds.asianHandicap.length === 0;
  if (!odds || matchDoesNotHaveSuitableLines) return;
  const oddsObject = new Odds(odds);
  await oddsObject.save()
}
const getMoneyLine5Bookies = async (page) => {
  const selector = '#bettype-tabs > ul > li.first.active > strong > span';
  const resultSelector = '.result';
  const resultLiveSelector = '.result-live';
  const resultAlertSelector = '.result-alert';
  if (await page.$(resultSelector) !== null
    || await page.$(resultAlertSelector) !== null
    || await page.$(resultLiveSelector) !== null
    || await page.$(selector) === null) {
    return null;
  }
  const result = await page.evaluate(() => {
    // get average odds
    const localWinAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(2)';
    const localAvg = document.querySelector(localWinAvgOddsSelector).textContent;
    const drawAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(3)';
    const drawAvg = document.querySelector(drawAvgOddsSelector).textContent;
    const awayWinAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(4)';
    const awayAvg = document.querySelector(awayWinAvgOddsSelector).textContent;

    const bookies = Array.from(document.querySelectorAll(
      '#odds-data-table > div:nth-child(1) > table > tbody > tr.lo',
    ));
    let numOfBookies = 0;

    const moneyLineOdds = bookies.reduce((selectedBookies, bookie) => {
      const nameSelector = bookie.querySelector('.name');
      if (!nameSelector) return selectedBookies;

      const name = nameSelector.textContent;
      if (name !== 'bet365' && name !== 'Pinnacle' && name !== 'Marathonbet' && name !== '1xBet' && name !== '188BET') return selectedBookies;

      const oddsSelector = Array.from(bookie.querySelectorAll('.odds'));
      const localWinOddHigh = oddsSelector[0].classList.contains('high');
      if (oddsSelector[0].querySelector('div') && oddsSelector[0].classList.contains('deactivateOdd'))
        return selectedBookies;

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

      numOfBookies++;
      selectedBookies[`_${name}`] = {
        name, localWin: parseFloat(localWin), localWinOddHigh: parseFloat(localWinOddHigh), awayWin: parseFloat(awayWin), awayWidOddHigh: (awayWidOddHigh),
      };
      return selectedBookies;
    }, {});
    return numOfBookies === 5 ? moneyLineOdds : null
  });
  return result;
};
const getMoneyLines5BookiesWithOpeningOdds = async (page) => {
  const selector = '#bettype-tabs > ul > li.first.active > strong > span';
  const resultSelector = '.result';
  const resultLiveSelector = '.result-live';
  const resultAlertSelector = '.result-alert';
  if (await page.$(resultSelector) !== null
    || await page.$(resultAlertSelector) !== null
    || await page.$(resultLiveSelector) !== null
    || await page.$(selector) === null) {
    return null;
  }

  const averages = await page.evaluate(() => {
    console.log(JSON.stringify(window.globals.requestMap));

    // get average odds
    const localWinAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(2)';
    const localAvg = document.querySelector(localWinAvgOddsSelector).textContent;
    const drawAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(3)';
    const drawAvg = document.querySelector(drawAvgOddsSelector).textContent;
    const awayWinAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(4)';
    const awayAvg = document.querySelector(awayWinAvgOddsSelector).textContent;
    return { localAvg, awayAvg, drawAvg };
  });

  const bookies = await getBookies(page);

  let numOfBookies = 0;
  let selectedBookies = {};
  for (let i = 0; i < bookies.length; i++) {
    const name = await getName(page, i + 1);
    if (!name || (name !== 'bet365' && name !== 'Pinnacle' && name !== 'Marathonbet' && name !== '1xBet' && name !== '188BET')) continue;

    const localOpeningOdds = await getInitialOdds(page, i + 1, 2);
    const awayOpeningOdds = await getInitialOdds(page, i + 1, 4);

    const result = await page.evaluate((index) => {
      const oddsSelector = Array.from(document.querySelectorAll(`#odds-data-table > div:nth-child(1) > table > tbody > tr.lo:nth-child(${index + 1}) > .odds`));
      const localWinOddHigh = oddsSelector[0].classList.contains('high');
      if (oddsSelector[0].querySelector('div') && oddsSelector[0].classList.contains('deactivateOdd'))
        return null;
      const localWin = oddsSelector[0].querySelector('div') !== null
        ? oddsSelector[0].querySelector('div').textContent
        : oddsSelector[0].querySelector('a').textContent;
      const drawOddHigh = oddsSelector[0].classList.contains('high');

      const draw = oddsSelector[1].querySelector('div') !== null
        ? oddsSelector[1].querySelector('div').textContent
        : oddsSelector[1].querySelector('a').textContent;

      const awayWidOddHigh = oddsSelector[2].classList.contains('high');
      const awayWin = oddsSelector[2].querySelector('div') !== null
        ? oddsSelector[2].querySelector('div').textContent
        : oddsSelector[2].querySelector('a').textContent;

      return {
        localWin: parseFloat(localWin), localWinOddHigh, awayWin: parseFloat(awayWin), awayWidOddHigh: parseFloat(awayWidOddHigh),
      };
    }, i);
    if (!result) continue;
    numOfBookies++;
    selectedBookies[`_${name}`] = { ...result, name, localOpeningOdds, awayOpeningOdds, localAvg: averages.localAvg, awayAvg: averages.awayAvg }
  }
  return numOfBookies === 5 ? selectedBookies : null

}

//DNB
const getDnb5Bookies = async (page) => {

  if ((await getActiveTab(page)) !== 'Draw No Bet') return;
  const result = await page.evaluate(() => {
    // get average odds
    const localWinDnbAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(2)';
    const localWinDnbAvg = document.querySelector(localWinDnbAvgOddsSelector).textContent;
    const awayWinDnbAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(3)';
    const awayWinDnbAvg = document.querySelector(awayWinDnbAvgOddsSelector).textContent;

    const bookies = Array.from(document.querySelectorAll(
      '#odds-data-table > div:nth-child(1) > table > tbody > tr.lo',
    ));
    let numOfBookies = 0;
    const dnbOdds = bookies.reduce((selectedBookies, bookie) => {
      const nameSelector = bookie.querySelector('.name');
      if (!nameSelector) return selectedBookies;

      const name = nameSelector.textContent;
      if (name !== 'bet365' && name !== 'Pinnacle' && name !== 'Marathonbet' && name !== '1xBet' && name !== '188BET') return selectedBookies;

      const oddsSelector = Array.from(bookie.querySelectorAll('.odds'));

      if (oddsSelector[0].querySelector('div') && oddsSelector[0].querySelector('div').classList.contains('deactivateOdd'))
        return selectedBookies;

      const localWinDnbHigh = oddsSelector[0].classList.contains('high');
      const localWinDnb = oddsSelector[0].querySelector('div') !== null
        ? oddsSelector[0].querySelector('div').textContent
        : oddsSelector[0].querySelector('a').textContent;

      const awayWinDnbHigh = oddsSelector[1].classList.contains('high');
      const awayWinDnb = oddsSelector[1].querySelector('div') !== null
        ? oddsSelector[1].querySelector('div').textContent
        : oddsSelector[1].querySelector('a').textContent;

      numOfBookies++;
      selectedBookies[`_${name}`] = {
        name, localWinDnb: parseFloat(localWinDnb), localWinDnbHigh: parseFloat(localWinDnbHigh), awayWinDnb: parseFloat(awayWinDnb), awayWinDnbHigh: (awayWinDnbHigh),
      };
      return selectedBookies;
    }, {});
    return numOfBookies === 5 ? dnbOdds : null;
  });

  return result;
}
const getDnb5BookiesWithOpeningOdds = async (page) => {
  const averages = await page.evaluate(() => {
    // get average odds
    const localWinDnbAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(2)';
    const localWinDnbAvg = document.querySelector(localWinDnbAvgOddsSelector).textContent;
    const awayWinDnbAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(3)';
    const awayWinDnbAvg = document.querySelector(awayWinDnbAvgOddsSelector).textContent;
    return { localWinDnbAvg, awayWinDnbAvg };
  });

  const bookies = await getBookies(page);

  let numOfBookies = 0;
  let selectedBookies = {};
  for (let i = 0; i < bookies.length; i++) {
    const name = await getName(page, i + 1);
    if (!name || (name !== 'bet365' && name !== 'Pinnacle' && name !== 'Marathonbet' && name !== '1xBet' && name !== '188BET')) continue;

    const localOpeningOdds = await getInitialOdds(page, i + 1, 2);
    const awayOpeningOdds = await getInitialOdds(page, i + 1, 3);

    const result = await page.evaluate((index) => {
      const oddsSelector = Array.from(document.querySelectorAll(`#odds-data-table > div:nth-child(1) > table > tbody > tr.lo:nth-child(${index + 1}) > .odds`));

      if (oddsSelector[0].querySelector('div') && oddsSelector[0].querySelector('div').classList.contains('deactivateOdd'))
        return null;

      const localWinDnbHigh = oddsSelector[0].classList.contains('high');
      const localWinDnb = oddsSelector[0].querySelector('div') !== null
        ? oddsSelector[0].querySelector('div').textContent
        : oddsSelector[0].querySelector('a').textContent;

      const awayWinDnbHigh = oddsSelector[1].classList.contains('high');
      const awayWinDnb = oddsSelector[1].querySelector('div') !== null
        ? oddsSelector[1].querySelector('div').textContent
        : oddsSelector[1].querySelector('a').textContent;

      return {
        name, localWinDnb: parseFloat(localWinDnb), localWinDnbHigh, awayWinDnb: parseFloat(awayWinDnb), awayWinDnbHigh: (awayWinDnbHigh),
      };
    }, i);
    if (!result) continue;
    numOfBookies++;
    selectedBookies[`_${name}`] = { ...result, name, localOpeningOdds: parseFloat(localOpeningOdds), awayOpeningOdds: parseFloat(awayOpeningOdds), localAvg: averages.localAvg, awayAvg: averages.awayAvg }
  }
  return numOfBookies === 5 ? selectedBookies : null
}
// END of DNB


// DOUBLE CHANCE
const getDoubleChance5Bookies = async (page) => {
  const doubleChance = await page.evaluate(() => {
    // get average odds
    const localOrDrawAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(2)';
    const localOrDrawAvg = document.querySelector(localOrDrawAvgOddsSelector).textContent;
    const awayOrDrawAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(4)';
    const awayOrDrawAvg = document.querySelector(awayOrDrawAvgOddsSelector).textContent;

    const bookies = Array.from(document.querySelectorAll(
      '#odds-data-table > div:nth-child(1) > table > tbody > tr.lo',
    ));

    let numOfBookies = 0;
    const doubleChanceLineOdds = bookies.reduce((selectedBookies, bookie) => {
      const nameSelector = bookie.querySelector('.name');
      if (!nameSelector) return selectedBookies;

      const name = nameSelector.textContent;
      if (name !== 'bet365' && name !== 'Pinnacle' && name !== 'Marathonbet' && name !== '1xBet' && name !== '188BET') return selectedBookies

      const oddsSelector = Array.from(bookie.querySelectorAll('.odds'));

      if (oddsSelector[0].querySelector('div') && oddsSelector[0].querySelector('div').classList.contains('deactivateOdd'))
        return selectedBookies;

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

      numOfBookies++;
      selectedBookies[`_${name}`] = {
        name, localOrDraw: parseFloat(localOrDraw), localOrDrawHigh: parseFloat(localOrDrawHigh), awayOrDraw: parseFloat(awayOrDraw), awayOrDrawHigh: (awayOrDrawHigh),
      };
      return selectedBookies;
    }, {});
    return numOfBookies === 5 ? doubleChanceLineOdds : null;
  });
  return doubleChance;
};
const getDoubleChance5BookiesWithOpeningOdds = async (page) => {
  const averages = await page.evaluate(() => {
    // get average odds
    const localOrDrawAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(2)';
    const localOrDrawAvg = document.querySelector(localOrDrawAvgOddsSelector).textContent;
    const awayWinDnbAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(3)';
    const awayWinDnbAvg = document.querySelector(awayWinDnbAvgOddsSelector).textContent;
    return { localOrDrawAvg, awayWinDnbAvg };
  });
  const bookies = await getBookies(page);

  let numOfBookies = 0;
  let selectedBookies = {};
  for (let i = 0; i < bookies.length; i++) {

    const name = await getName(page, i + 1)
    if (!name || (name !== 'bet365' && name !== 'Pinnacle' && name !== 'Marathonbet' && name !== '1xBet' && name !== '188BET')) continue;

    const localOpeningOdds = await getInitialOdds(page, i + 1, 2);
    const awayOpeningOdds = await getInitialOdds(page, i + 1, 4);


    const result = await page.evaluate((index) => {
      const oddsSelector = Array.from(document.querySelectorAll(`#odds-data-table > div:nth-child(1) > table > tbody > tr.lo:nth-child(${index + 1}) > .odds`));

      if (oddsSelector[0].querySelector('div') && oddsSelector[0].querySelector('div').classList.contains('deactivateOdd'))
        return null;

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
      return {
        name, localOrDraw: parseFloat(localOrDraw), localOrDrawHigh, awayOrDraw: parseFloat(awayOrDraw), awayOrDrawHigh: parseFloat(awayOrDrawHigh),
      };
    }, i)
    if (!result) continue;
    numOfBookies++;
    selectedBookies[`_${name}`] = { ...result, name, localOpeningOdds: parseFloat(localOpeningOdds), awayOpeningOdds: parseFloat(awayOpeningOdds), localOrDrawAvg: averages.localOrDrawAvg, awayWinDnbAvg: averages.awayWinDnbAvg }
  }
  return numOfBookies === 5 ? selectedBookies : null
}
// END of DOUBLE CHANGE

// BOTH TEAMS TO SCORE
const getBothTeamsToScore5Bookies = async (page, url) => {
  if ((await getActiveTab(page)) !== 'Both Teams to Score') {
    console.log(`Wrong Tab!!! Both Teams to Score ${url}#bts`);
    return {};
  }

  const bothTeamsScore = await page.evaluate(() => {
    // get average odds
    const bothScoreYesAvgSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(2)';
    const bothScoreYesAvg = document.querySelector(bothScoreYesAvgSelector).textContent;
    const bothScoreNoAvgSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(3)';
    const bothScoreNoAvg = document.querySelector(bothScoreNoAvgSelector).textContent;

    const bookies = Array.from(document.querySelectorAll(
      '#odds-data-table > div:nth-child(1) > table > tbody > tr.lo',
    ));
    let numOfBookies = 0;
    const bothTeamsScoreOdds = bookies.reduce((selectedBookies, bookie) => {
      const nameSelector = bookie.querySelector('.name');
      if (!nameSelector) return selectedBookies;

      const name = nameSelector.textContent;
      if (name !== 'bet365' && name !== 'Pinnacle' && name !== 'Marathonbet' && name !== '1xBet' && name !== '188BET') return selectedBookies;

      const oddsSelector = Array.from(bookie.querySelectorAll('.odds'));
      if (oddsSelector[0].querySelector('div') && oddsSelector[0].querySelector('div').classList.contains('deactivateOdd'))
        return selectedBookies;

      const bothScoreYesHigh = oddsSelector[0].classList.contains('high');
      const bothScoreYes = oddsSelector[0].querySelector('div') !== null
        ? oddsSelector[0].querySelector('div').textContent
        : oddsSelector[0].querySelector('a').textContent;

      const bothScoreNoHigh = oddsSelector[1].classList.contains('high');
      const bothScoreNo = oddsSelector[1].querySelector('div') !== null
        ? oddsSelector[1].querySelector('div').textContent
        : oddsSelector[1].querySelector('a').textContent;

      numOfBookies++;
      selectedBookies[`_${name}`] = {
        name, bothScoreYes: parseFloat(bothScoreYes), bothScoreYesHigh: parseFloat(bothScoreYesHigh), bothScoreNo: parseFloat(bothScoreNo), bothScoreNoHigh: (bothScoreNoHigh),
      };
      return selectedBookies;
    }, {});
    return numOfBookies === 5 ? bothTeamsScoreOdds : null;
  });
  return bothTeamsScore;
};
const getBothTeamsToScore5BookiesWithOpeningOdds = async (page, url) => {
  const averages = await page.evaluate(() => {
    // get average odds
    const bothScoreYesAvgSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(2)';
    const bothScoreYesAvg = document.querySelector(bothScoreYesAvgSelector).textContent;
    const bothScoreNoAvgSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(3)';
    const bothScoreNoAvg = document.querySelector(bothScoreNoAvgSelector).textContent;
    return { bothScoreYesAvg, bothScoreNoAvg };
  });

  const bookies = await getBookies(page);

  let numOfBookies = 0;
  let selectedBookies = {};
  for (let i = 0; i < bookies.length; i++) {
    const name = await getName(page, i + 1)
    if (!name || (name !== 'bet365' && name !== 'Pinnacle' && name !== 'Marathonbet' && name !== '1xBet' && name !== '188BET')) continue;

    const btsYesOpeningOdds = await getInitialOdds(page, i + 1, 2);
    const btsNoOpeningOdds = await getInitialOdds(page, i + 1, 3);

    const result = await page.evaluate((index) => {
      const oddsSelector = Array.from(document.querySelectorAll(`#odds-data-table > div:nth-child(1) > table > tbody > tr.lo:nth-child(${index + 1}) > .odds`));
      if (oddsSelector[0].querySelector('div') && oddsSelector[0].querySelector('div').classList.contains('deactivateOdd'))
        return null;

      const bothScoreYesHigh = oddsSelector[0].classList.contains('high');
      const bothScoreYes = oddsSelector[0].querySelector('div') !== null
        ? oddsSelector[0].querySelector('div').textContent
        : oddsSelector[0].querySelector('a').textContent;

      const bothScoreNoHigh = oddsSelector[1].classList.contains('high');
      const bothScoreNo = oddsSelector[1].querySelector('div') !== null
        ? oddsSelector[1].querySelector('div').textContent
        : oddsSelector[1].querySelector('a').textContent;

      return {
        name, bothScoreYes: parseFloat(bothScoreYes), bothScoreYesHigh, bothScoreNo: parseFloat(bothScoreNo), bothScoreNoHigh,
      };
    }, i)
    if (!result) continue;
    numOfBookies++;
    selectedBookies[`_${name}`] = {
      ...result, name, btsYesOpeningOdds: parseFloat(btsYesOpeningOdds), btsNoOpeningOdds: parseFloat(btsNoOpeningOdds),
      bothScoreYesAvg: averages.bothScoreYesAvg, bothScoreNoAvg: averages.bothScoreNoAvg
    }
  }
  return numOfBookies === 5 ? selectedBookies : null
}
// END of BOTH TEAMS TO SCOORE


// OVER UNDER GOALS
const getUnderOverGoalsExp = async (page, url) => {

  const OverUnderLines = await page.evaluate(() => [...document.querySelectorAll('#odds-data-table > div > div')]);

  const underOverLines = [];

  for (let i = 0; i < OverUnderLines.length; i++) {
    const enoughBookies = await page.evaluate((index) => {
      let numOfBookies = document.querySelector(`#odds-data-table > div:nth-child(${index + 1}) > div > span.odds-cnt`);
      if (!numOfBookies) return false;
      numOfBookies = numOfBookies.innerText.replace(/[()]/g, '');
      return parseInt(numOfBookies) > 3 ? true : false
    }, i);

    if (!enoughBookies) continue;

    const visibleLine = await page.evaluate((index) => {
      const openCloseLink = document.querySelector(`#odds-data-table > div:nth-child(${index + 1}) > div > .odds-co > a`);
      return openCloseLink && openCloseLink.innerText === 'Compare odds' ? false : true;
    }, i)
    if (!visibleLine) {
      await page.click(`#odds-data-table > div:nth-child(${i + 1}) > div > strong > a`);
      await page.waitForSelector(`#odds-data-table > div:nth-child(${i + 1}) > table`);
    }

    const line = await getUnderOverGoalsOdds5BookiesWithOpeningOdds(page, `#odds-data-table > div:nth-child(${i + 1}) > table`, i + 1);
    if (enoughBookies && line) underOverLines.push(line)
  }
  return underOverLines;
};
const getUnderOverGoalsOdds5Bookies = async (page, tableSelector) => {
  const underOverGoals = await page.evaluate((tableSelector) => {
    // get average odds
    const overGolasAvgSelector = `${tableSelector} > tfoot > tr.aver > td:nth-child(3)`;
    const overGoalsAvg = document.querySelector(overGolasAvgSelector).textContent;
    const underGoalsAvgSelector = `${tableSelector} > tfoot > tr.aver > td:nth-child(4)`;
    const underGoalsAvg = document.querySelector(underGoalsAvgSelector).textContent;


    const bookies = [...document.querySelectorAll(`${tableSelector} > tbody > tr.lo`)];

    let numOfBookies = 0;
    const underOverGoalsOdds = bookies.reduce((selectedBookies, bookie) => {
      const nameSelector = bookie.querySelector('.name');
      if (!nameSelector) return selectedBookies;

      const name = nameSelector.textContent;
      if (name !== 'bet365' && name !== 'Pinnacle' && name !== 'Marathonbet' && name !== '1xBet' && name !== '188BET') return selectedBookies;

      const numOfGoals = bookie.querySelector('.center').innerText;

      const oddsRowSelector = Array.from(bookie.querySelectorAll('.odds'));

      const oddsSelector = oddsRowSelector[0].querySelector('div');
      if (oddsSelector && oddsSelector.classList.contains('deactivateOdd')) return selectedBookies;

      const overGoalsHigh = oddsRowSelector[0].classList.contains('high');
      const overGoals = oddsRowSelector[0].querySelector('div') !== null
        ? oddsRowSelector[0].querySelector('div').textContent
        : oddsRowSelector[0].querySelector('a').textContent;

      const underGoalsHigh = oddsRowSelector[1].classList.contains('high');
      const underGoals = oddsRowSelector[1].querySelector('div') !== null
        ? oddsRowSelector[1].querySelector('div').textContent
        : oddsRowSelector[1].querySelector('a').textContent;

      numOfBookies++;
      selectedBookies[`_${name}`] = {
        name, numOfGoals: parseFloat(numOfGoals), overGoals: parseFloat(overGoals), overGoalsHigh: parseFloat(overGoalsHigh), underGoals: parseFloat(underGoals), underGoalsHigh: (underGoalsHigh),
      };
      return selectedBookies;
    }, {});

    return numOfBookies === 5 ? underOverGoalsOdds : null;
  }, tableSelector);
  return underOverGoals
}
const getUnderOverGoalsOdds5BookiesWithOpeningOdds = async (page, tableSelector, tableIndex) => {

  const averages = await page.evaluate((tableSelector) => {
    // get average odds
    const overGolasAvgSelector = `${tableSelector} > tfoot > tr.aver > td:nth-child(3)`;
    const overGoalsAvg = document.querySelector(overGolasAvgSelector).textContent;
    const underGoalsAvgSelector = `${tableSelector} > tfoot > tr.aver > td:nth-child(4)`;
    const underGoalsAvg = document.querySelector(underGoalsAvgSelector).textContent;
    return { overGoalsAvg, underGoalsAvg };
  }, tableSelector);
  const bookies = await getBookies(page, tableIndex);

  let numOfBookies = 0;
  let selectedBookies = {};
  for (let i = 0; i < bookies.length; i++) {
    const name = await getName(page, i + 1, tableIndex)
    if (!name || (name !== 'bet365' && name !== 'Pinnacle' && name !== 'Marathonbet' && name !== '1xBet' && name !== '188BET')) continue;

    const overGoalsOpeningOdds = await getInitialOdds(page, i + 1, 3, tableIndex);
    const underGoalsOpeningOdds = await getInitialOdds(page, i + 1, 4, tableIndex);

    const result = await page.evaluate(({ tableSelector, i: index }) => {
      const bookie = document.querySelector(`${tableSelector} > tbody > tr.lo:nth-child(${index + 1})`)
      const numOfGoals = bookie.querySelector('.center').innerText;

      const oddsRowSelector = Array.from(bookie.querySelectorAll('.odds'));

      const oddsSelector = oddsRowSelector[0].querySelector('div');
      if (oddsSelector && oddsSelector.classList.contains('deactivateOdd')) return null;

      const overGoalsHigh = oddsRowSelector[0].classList.contains('high');
      const overGoals = oddsRowSelector[0].querySelector('div') !== null
        ? oddsRowSelector[0].querySelector('div').textContent
        : oddsRowSelector[0].querySelector('a').textContent;

      const underGoalsHigh = oddsRowSelector[1].classList.contains('high');
      const underGoals = oddsRowSelector[1].querySelector('div') !== null
        ? oddsRowSelector[1].querySelector('div').textContent
        : oddsRowSelector[1].querySelector('a').textContent;

      return {
        name, numOfGoals: parseFloat(numOfGoals), overGoals: parseFloat(overGoals), overGoalsHigh,
        underGoals: parseFloat(underGoals), underGoalsHigh,
      };
    }, { tableSelector, i })

    if (!result) continue;
    numOfBookies++;
    selectedBookies[`_${name}`] = {
      ...result, overGoalsOpeningOdds: parseFloat(overGoalsOpeningOdds), underGoalsOpeningOdds: parseFloat(underGoalsOpeningOdds),
      overGoalsAvg: averages.overGoalsAvg, underGoalsAvg: averages.underGoalsAvg
    }
  }
  return numOfBookies === 5 ? selectedBookies : null
}
// END of O/U GOALS

// ASIAN HANDICUP
const getAH5Bookies = async (page, tableSelector) => {
  const asianHandicap = await page.evaluate((tableSelector) => {
    // get average odds
    const asianHandicapSelector = `${tableSelector} > tfoot > tr.aver > td:nth-child(3)`;
    const localAHAvg = document.querySelector(asianHandicapSelector).textContent;
    const underGoalsAvgSelector = `${tableSelector} > tfoot > tr.aver > td:nth-child(4)`;
    const awayAHAvg = document.querySelector(underGoalsAvgSelector).textContent;


    const bookies = [...document.querySelectorAll(`${tableSelector} > tbody > tr.lo`)];

    let numOfBookies = 0;
    const asianHandicapOdds = bookies.reduce((selectedBookies, bookie) => {
      const nameSelector = bookie.querySelector('.name');
      if (!nameSelector) return selectedBookies;

      const name = nameSelector.textContent;
      if (name !== 'bet365' && name !== 'Pinnacle' && name !== 'Marathonbet' && name !== '1xBet' && name !== '188BET') return selectedBookies;

      const handicap = bookie.querySelector('.center').innerText;

      const oddsRowSelector = Array.from(bookie.querySelectorAll('.odds'));

      const oddsSelector = oddsRowSelector[0].querySelector('div');
      if (oddsSelector && oddsSelector.classList.contains('deactivateOdd')) return selectedBookies;

      const localAHHigh = oddsRowSelector[0].classList.contains('high');
      const localAH = oddsRowSelector[0].querySelector('div') !== null
        ? oddsRowSelector[0].querySelector('div').textContent
        : oddsRowSelector[0].querySelector('a').textContent;

      const awayAHHigh = oddsRowSelector[1].classList.contains('high');
      const awayAH = oddsRowSelector[1].querySelector('div') !== null
        ? oddsRowSelector[1].querySelector('div').textContent
        : oddsRowSelector[1].querySelector('a').textContent;

      numOfBookies++;
      selectedBookies[`_${name}`] = {
        name, handicap, localAH, localAHHigh, awayAH, awayAHHigh,
      };
      return selectedBookies;
    }, {});

    return numOfBookies === 5 ? asianHandicapOdds : null;
  }, tableSelector);
  return asianHandicap
}

const getAHLines5BookiesWithOpeningOdds = async (page, tableSelector, tableIndex) => {
  const averages = await page.evaluate((tableSelector) => {
    // get average odds
    const asianHandicapSelector = `${tableSelector} > tfoot > tr.aver > td:nth-child(3)`;
    const localAHAvg = document.querySelector(asianHandicapSelector).textContent;
    const underGoalsAvgSelector = `${tableSelector} > tfoot > tr.aver > td:nth-child(4)`;
    const awayAHAvg = document.querySelector(underGoalsAvgSelector).textContent;
    return { localAHAvg, awayAHAvg };
  }, tableSelector);
  const bookies = await getBookies(page, tableIndex);

  let numOfBookies = 0;
  let selectedBookies = {};
  for (let i = 0; i < bookies.length; i++) {
    const name = await getName(page, i + 1, tableIndex)
    if (!name || (name !== 'bet365' && name !== 'Pinnacle' && name !== 'Marathonbet' && name !== '1xBet' && name !== '188BET')) continue;

    const localAHOpeningOdds = await getInitialOdds(page, i + 1, 3, tableIndex);
    const awayAHOpeningOdds = await getInitialOdds(page, i + 1, 4, tableIndex);

    const result = await page.evaluate(({ tableSelector, i: index }) => {
      const bookie = document.querySelector(`${tableSelector} > tbody > tr.lo:nth-child(${index + 1})`)

      const handicap = bookie.querySelector('.center').innerText;

      const oddsRowSelector = Array.from(bookie.querySelectorAll('.odds'));

      const oddsSelector = oddsRowSelector[0].querySelector('div');
      if (oddsSelector && oddsSelector.classList.contains('deactivateOdd')) return null;

      const localAHHigh = oddsRowSelector[0].classList.contains('high');
      const localAH = oddsRowSelector[0].querySelector('div') !== null
        ? oddsRowSelector[0].querySelector('div').textContent
        : oddsRowSelector[0].querySelector('a').textContent;

      const awayAHHigh = oddsRowSelector[1].classList.contains('high');
      const awayAH = oddsRowSelector[1].querySelector('div') !== null
        ? oddsRowSelector[1].querySelector('div').textContent
        : oddsRowSelector[1].querySelector('a').textContent;

      return {
        handicap, localAH: parseFloat(localAH), awayAH: parseFloat(awayAH), localAHHigh, awayAHHigh
      };

    }, { tableSelector, i })

    if (!result) continue;
    numOfBookies++;
    selectedBookies[`_${name}`] = {
      ...result, localAHOpeningOdds: parseFloat(localAHOpeningOdds), awayAHOpeningOdds: parseFloat(awayAHOpeningOdds),
      localAHAvg: averages.localAHAvg, awayAHAvg: averages.awayAHAvg
    }
  }
  return numOfBookies === 5 ? selectedBookies : null
}

const getAHLines5Bookies = async (page, url) => {

  const asianHandicapLines = await page.evaluate(() => [...document.querySelectorAll('#odds-data-table > div > div')]);

  const selectedAsianHandicapLines = [];

  for (let i = 0; i < asianHandicapLines.length; i++) {
    const enoughBookies = await page.evaluate((index) => {
      let numOfBookies = document.querySelector(`#odds-data-table > div:nth-child(${index + 1}) > div > span.odds-cnt`);
      if (!numOfBookies) return false;
      numOfBookies = numOfBookies.innerText.replace(/[()]/g, '');
      return parseInt(numOfBookies) > 3 ? true : false
    }, i);

    if (!enoughBookies) continue;

    const visibleLine = await page.evaluate((index) => {
      const openCloseLink = document.querySelector(`#odds-data-table > div:nth-child(${index + 1}) > div > .odds-co > a`);
      return openCloseLink && openCloseLink.innerText === 'Compare odds' ? false : true;
    }, i)
    if (!visibleLine) {
      await page.click(`#odds-data-table > div:nth-child(${i + 1}) > div > strong > a`);
      await page.waitForSelector(`#odds-data-table > div:nth-child(${i + 1}) > table`);
    }

    const line = await getAHLines5BookiesWithOpeningOdds(page, `#odds-data-table > div:nth-child(${i + 1}) > table`, i + 1);
    if (enoughBookies && line) selectedAsianHandicapLines.push(line)
  }
  return selectedAsianHandicapLines;
};


const getOdds = async (page, url) => {
  const odds = {};
  page.on('console', (consoleObj) => console.log(consoleObj.text()));
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');

  await page.goto(`${url}`);
  console.log(url);
  odds.match = await getMatch(page);
  odds.date = await getDate(page);
  odds.url = url;


  //MONEYLINE
  odds.moneyLine = await getMoneyLineExp(page);

  //DNB
  const selector = await getSectionSelector(page, 'DNB');
  if (selector) {
    await page.evaluate(selector => {
      document.querySelector(selector).style.display === 'none';
      document.querySelector(selector).style.display = 'block';
    }, selector)
    await page.click(selector);
    // await page.waitForFunction(`document.querySelector('#bettype-tabs > ul > li.active > strong > span').innerText == Draw No Bet`);
    await page.waitForSelector('#odds-data-table > div > table');
    odds.dnb = await getDnbExp(page);
  }

  //DoubleChance
  const selectorDC = await getSectionSelector(page, 'DC');
  if (selector) {
    await page.evaluate(selector => {
      document.querySelector(selector).style.display === 'none';
      document.querySelector(selector).style.display = 'block';
    }, selectorDC)
    await page.click(selectorDC);
    await page.waitForSelector('#odds-data-table > div > table');
    odds.doubleChance = await getDoubleChanceExp(page);
  }

  //BothTeamsScore
  const selectorBTS = await getSectionSelector(page, 'BTS');
  if (selectorBTS) {
    await page.evaluate(selector => {
      document.querySelector(selector).style.display === 'none';
      document.querySelector(selector).style.display = 'block';
    }, selectorBTS)
    await page.click(selectorBTS);

    await page.waitForSelector('#odds-data-table > div > table');
    odds.bts = await getBothTeamsToScoreExp(page);
  }

  //Over/Under Goals
  const selectorOverUnder = await getSectionSelector(page, 'O/U');
  if (selectorOverUnder) {
    await page.evaluate(selector => {
      if (document.querySelector(selector).style.display === 'none')
        document.querySelector(selector).style.display = 'block';
    }, selectorOverUnder)
    await page.click(selectorOverUnder);
    await page.waitForSelector('#odds-data-table > div:nth-child(1)');

    odds.overUnder = await getUnderOverGoalsExp(page);
  }

  // save odds
  if (!odds) return;
  const oddsObject = new Odds(odds);
  await oddsObject.save()
}
const getMoneyLineExp = async (page) => {
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
    // get average odds
    const localWinAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(2)';
    const localAvg = document.querySelector(localWinAvgOddsSelector).textContent;
    const drawAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(3)';
    const drawAvg = document.querySelector(drawAvgOddsSelector).textContent;
    const awayWinAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(4)';
    const awayAvg = document.querySelector(awayWinAvgOddsSelector).textContent;

    const bookies = Array.from(document.querySelectorAll(
      '#odds-data-table > div:nth-child(1) > table > tbody > tr.lo',
    ));
    let moneyLineOdds;
    bookies.some((bookie) => {
      const nameSelector = bookie.querySelector('.name');
      if (!nameSelector) return false;

      const name = nameSelector.textContent;
      if (name !== 'bet365') return false;

      const oddsSelector = Array.from(bookie.querySelectorAll('.odds'));
      const localWinOddHigh = oddsSelector[0].classList.contains('high');
      if (oddsSelector[0].querySelector('div') && oddsSelector[0].classList.contains('deactivateOdd'))
        return false;
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

      moneyLineOdds = {
        name, localWin, localWinOddHigh, draw, drawAvg, drawOddHigh, awayWin, awayWidOddHigh,
      };
      return true;
    });
    return {
      ...moneyLineOdds, localAvg, awayAvg,
    };
  });
  return result;
};
const getDnbExp = async (page) => {

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
    let dnbLineOdds;
    bookies.some((bookie) => {
      const nameSelector = bookie.querySelector('.name');
      if (!nameSelector) return false;

      const name = nameSelector.textContent;
      if (name !== 'bet365') return false;

      const oddsSelector = Array.from(bookie.querySelectorAll('.odds'));

      if (oddsSelector[0].querySelector('div') && oddsSelector[0].querySelector('div').classList.contains('deactivateOdd'))
        return false;

      const localWinDnbHigh = oddsSelector[0].classList.contains('high');
      const localWinDnb = oddsSelector[0].querySelector('div') !== null
        ? oddsSelector[0].querySelector('div').textContent
        : oddsSelector[0].querySelector('a').textContent;

      const awayWinDnbHigh = oddsSelector[1].classList.contains('high');
      const awayWinDnb = oddsSelector[1].querySelector('div') !== null
        ? oddsSelector[1].querySelector('div').textContent
        : oddsSelector[1].querySelector('a').textContent;
      dnbLineOdds = {
        name, localWinDnbHigh, localWinDnb, awayWinDnb, awayWinDnbHigh,
      };
      return true;
    });
    return { ...dnbLineOdds, localWinDnbAvg, awayWinDnbAvg };
  });

  return dnb;
};
const getDoubleChanceExp = async (page) => {
  const doubleChance = await page.evaluate(() => {
    // get average odds
    const localOrDrawAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(2)';
    const localOrDrawAvg = document.querySelector(localOrDrawAvgOddsSelector).textContent;
    const awayOrDrawAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(4)';
    const awayOrDrawAvg = document.querySelector(awayOrDrawAvgOddsSelector).textContent;

    const bookies = Array.from(document.querySelectorAll(
      '#odds-data-table > div:nth-child(1) > table > tbody > tr.lo',
    ));

    let doubleChanceLineOdds;
    bookies.some(bookie => {
      const nameSelector = bookie.querySelector('.name');
      if (!nameSelector) return false;

      const name = nameSelector.textContent;
      if (name !== 'bet365') return false;

      const oddsSelector = Array.from(bookie.querySelectorAll('.odds'));

      if (oddsSelector[0].querySelector('div') && oddsSelector[0].querySelector('div').classList.contains('deactivateOdd'))
        return false;

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

      doubleChanceLineOdds = {
        name, localOrDraw, localOrDrawHigh, awayOrDraw, awayOrDrawHigh, localOrAway,
      };
      return true;
    });
    return { ...doubleChanceLineOdds, localOrDrawAvg, awayOrDrawAvg };
  });
  return doubleChance;
};
const getBothTeamsToScoreExp = async (page, url) => {
  if ((await getActiveTab(page)) !== 'Both Teams to Score') {
    console.log(`Wrong Tab!!! Both Teams to Score ${url}#bts`);
    return {};
  }

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
      if (oddsSelector[0].querySelector('div') && oddsSelector[0].querySelector('div').classList.contains('deactivateOdd'))
        return false;

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
  return bothTeamsScore;
};
const getUnderOverGoalsOddsExp = async (page, tableSelector) => {
  const underOverGoals = await page.evaluate((tableSelector) => {
    // get average odds
    const overGolasAvgSelector = `${tableSelector} > tfoot > tr.aver > td:nth-child(3)`;
    const overGoalsAvg = document.querySelector(overGolasAvgSelector).textContent;
    const underGoalsAvgSelector = `${tableSelector} > tfoot > tr.aver > td:nth-child(4)`;
    const underGoalsAvg = document.querySelector(underGoalsAvgSelector).textContent;


    const bookies = [...document.querySelectorAll(`${tableSelector} > tbody > tr.lo`)];

    let underOverGoalsOdds;
    bookies.some((bookie) => {
      const nameSelector = bookie.querySelector('.name');
      if (!nameSelector) return false;

      const name = nameSelector.textContent;
      if (name !== 'bet365') return false;

      const numOfGoals = bookie.querySelector('.center').innerText;

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
  }, tableSelector);
  return underOverGoals

}

module.exports = {
  getOdds,
  getOdds5Bookies
};
