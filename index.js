/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
const puppeteer = require('puppeteer');
const fs = require('fs');
const football = require('./parsers/football.js');

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
    } = await football.getMoneyLineOdds(pages[0], url);

    console.log('hasBet365Odds ', hasBet365Odds);
    if (!hasBet365Odds) continue;

    const { dnbLineOdds, localWinDnbAvg, awayWinDnbAvg } = await football.getDNBOdds(pages[1], url);

    const { doubleChanceLineOdds, localOrDrawAvg, awayOrDrawAvg } = await football.getDoubleChanceLineOdds(pages[2], url);

    // const {
    //   underOverGoalsOdds, underAvg, overAvg, numGoals,
    // } = await football.getUnderOverGoalsOdds(pages[0], url);

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
    // results.push({});
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
    console.log('lets go');
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
