/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
const puppeteer = require('puppeteer');
const fs = require('fs');
const { delay } = require('./utils.js');

async function getDNBOdds(page, url) {
  console.log('get DNB');
  await page.goto(`${url}#dnb`);

  const dnb = await page.evaluate(() => {
    // get average odds
    const localWinDnbAvg = document.querySelector('#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(2)').textContent;
    const awayWinDnbAvg = document.querySelector('#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(3)').textContent;

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
}

async function getDoubleChanceLineOdds(page, url) {
  console.log('get DC');
  await page.goto(`${url}#double`);

  const doubleChance = await page.evaluate(() => {
    // get average odds
    const localOrDrawAvg = document.querySelector('#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(2)').textContent;
    const awayOrDrawAvg = document.querySelector('#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(4)').textContent;

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
}

async function getMoneyLineOdds(page, url) {
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
    const localAvg = document
      .querySelector('#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(2)').textContent;
    const awayAvg = document
      .querySelector('#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(4)').textContent;

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
}

async function login(page) {
  await page.goto('https://www.oddsportal.com/login/');
  await page.type('#login-username1', 'irokhes');
  await page.type('#login-password1', 'Correoocio09');
  await page.click('button[type="submit"]');
}

async function getOdds(pages, urls) {
  const results = [];
  let index = 1;
  for (const url of urls) {
    if (!url.includes('https://www.oddsportal')) continue;

    console.log(`parsing... ${url} at position ${index++}`);
    const {
      hasBet365Odds, moneyLineOdds, match, date, localAvg, awayAvg,
    } = await getMoneyLineOdds(pages[0], url);

    console.log('hasBet365Odds ', hasBet365Odds);
    if (!hasBet365Odds) continue;

    const { dnbLineOdds, localWinDnbAvg, awayWinDnbAvg } = await getDNBOdds(pages[1], url);

    const { doubleChanceLineOdds, localOrDrawAvg, awayOrDrawAvg } = await getDoubleChanceLineOdds(pages[2], url);

    results.push({
      url,
      match,
      date,
      moneyLineOdds,
      dnbLineOdds,
      doubleChanceLineOdds,
      localAvg,
      awayAvg,
      localWinDnbAvg,
      awayWinDnbAvg,
      localOrDrawAvg,
      awayOrDrawAvg,
    });
  }
  return results;
}

const start = async () => {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('you need to provide a date: node index.js YYYYMMDD');
    process.exit(1);
  }
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--window-size=1024,980'],
  });
  try {
    // Launch the browser
    // Create an instance of the page
    const pages = [];
    for (let index = 0; index < 3; index++) {
      const page = await browser.newPage();
      page.on('console', (consoleObj) => console.log(consoleObj.text()));
      pages.push(page);
    }
    // const page = await browser.newPage();
    // page.on('console', (consoleObj) => console.log(consoleObj.text()));

    await login(pages[0]);
    // Go to the web page that we want to scrap
    // const date = yyymmdd(new Date());
    const date = args[0];
    await pages[0].goto(`https://www.oddsportal.com/matches/soccer/${date}/`);

    // Here we can select elements from the web page
    const matchesUrls = await pages[0].evaluate(() => {
      // const matches = document.querySelectorAll(
      //   '#table-matches > table > tbody > tr.deactivate > td.name.table-participant > a',
      // );
      const matches = Array.from(document.querySelectorAll(
        '#table-matches > table > tbody > tr[xeid]',
      ));
      const result = [];
      matches.forEach((match) => {
        const hasResult = match.querySelector('.table-score');
        if (hasResult) return;
        const matchUrl = Array.from(match.querySelectorAll('td.name.table-participant > a'));
        result.push(matchUrl.length > 1 ? matchUrl[1].href : matchUrl[0].href);
      });
      return result;
    });
    const results = await getOdds(pages, matchesUrls);
    const data = JSON.stringify(results);
    fs.writeFileSync(`${date}.json`, data);
  } catch (error) {
    console.log(error);
  } finally {
    await browser.close();
  }
};

const yyymmdd = (date) => {
  const mm = date.getMonth() + 1; // getMonth() is zero-based
  const dd = date.getDate();
  return [date.getFullYear(),
    (mm > 9 ? '' : '0') + mm,
    (dd > 9 ? '' : '0') + dd,
  ].join('');
};

start();
