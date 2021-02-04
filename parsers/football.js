/* eslint-disable no-shadow */
/* eslint-disable max-len */
const { getMatch, getDate, getActiveTab, getSectionSelector } = require('../utils/parser');
const Odds = require('../models/odds');

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
  if(!odds) return;
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
      if(oddsSelector[0].querySelector('div') && oddsSelector[0].classList.contains('deactivateOdd'))
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

      if(oddsSelector[0].querySelector('div') && oddsSelector[0].querySelector('div').classList.contains('deactivateOdd'))
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

      if(oddsSelector[0].querySelector('div') && oddsSelector[0].querySelector('div').classList.contains('deactivateOdd'))
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
      if(oddsSelector[0].querySelector('div') && oddsSelector[0].querySelector('div') .classList.contains('deactivateOdd'))
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
const getUnderOverGoalsExp = async (page, url) => {

  const OverUnderLines = await page.evaluate(() => [...document.querySelectorAll('#odds-data-table > div > div')]);

  const underOverLines = [];

  for (let i = 0; i < OverUnderLines.length; i++) {
    const enoughBookies = await page.evaluate((index) => {
      let numOfBookies = document.querySelector(`#odds-data-table > div:nth-child(${index + 1}) > div > span.odds-cnt`);
      if (!numOfBookies) return false;
      numOfBookies = numOfBookies.innerText.replace(/[()]/g, '');
      return parseInt(numOfBookies) > 6 ? true : false
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

    if (enoughBookies) underOverLines.push(await getUnderOverGoalsOddsExp(page, `#odds-data-table > div:nth-child(${i + 1}) > table`))
  }
  return underOverLines;
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
};
