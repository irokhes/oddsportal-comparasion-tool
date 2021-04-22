/* eslint-disable max-len */
const { getMatch, getDate, isElegibleMatch } = require('../utils/parser');
const { getDate } = require('../utils/utils');
const { getFootballOdds } = require('./football');
const { getBasketOdds } = require('./basket');
const Odds = require('../models/odds');

const getOdds = async (page, data) => {
  const { url, sport } = data;
  const isFootball = sport === 'football';
  let odds = {};
  let apiUrl;

  page.on('console', (consoleObj) => console.log(consoleObj.text()));
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url().toString();
    if (url.includes('/feed/match')) { apiUrl = url; }
    request.continue();
  });

  await page.goto(`${url}`);

  if (!apiUrl) {
    console.log('we did not get the base url');
    return;
  }
  const elegibleMatch = await isElegibleMatch(page);
  if (!elegibleMatch) return;

  odds.match = await getMatch(page);
  odds.date = await getDate(page);
  // odds.dateObj = getDateObj(date);
  odds.url = url;
  odds.sport = sport;

  if (isFootball) {
    odds = await getFootballOdds(apiUrl, odds, url);
  } else {
    odds = await getBasketOdds(apiUrl, odds, url);
  }
  // save odds
  if (!odds || (!odds.moneyLine && !odds.homeAway && !odds.dnb && !odds.doubleChance && !odds.bts && (!odds.overUnder || odds.overUnder.length === 0) && (!odds.asianHandicap || odds.asianHandicap.length === 0))) return;
  await Odds.findOneAndUpdate({ url: odds.url }, odds, { upsert: true, setDefaultsOnInsert: true });
};
const getOddsUrls = async (page, url) => {
  const fixture = {};
  page.on('console', (consoleObj) => console.log(consoleObj.text()));
  await page.setRequestInterception(true);
  let apiUrl;
  page.on('request', (request) => {
    const url = request.url().toString();
    if (url.includes('/feed/match')) { apiUrl = url; }
    request.continue();
  });

  await page.goto(`${url}`);
  console.log(url);
  fixture.match = await getMatch(page);
  fixture.date = await getDate(page);
  fixture.url = url;

  const baseTemplate = 'https://fb.oddsportal.com/feed/match/1-1-#MATCH#-#LINE#-#PARAMS#';
  const matchDetails = apiUrl.split('https://fb.oddsportal.com/feed/match/1-1-')[1].split('-');
  const baseUrl = apiUrl.split('https://fb.oddsportal.com')[1].split('?')[0];
  const match = matchDetails[0];
  const parameters = matchDetails[matchDetails.length - 1];
  const moneyLine = '1-2';
  const dnb = '6-2';
  const AH = '5-2';
  const OverUnder = '2-2';
  const BTS = '13-2';
  const DC = '4-2';

  fixture.mlUrl = baseTemplate.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', moneyLine);
  fixture.dnbUrl = baseTemplate.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', dnb);
  fixture.ahUrl = baseTemplate.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', AH);
  fixture.ouUrl = baseTemplate.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', OverUnder);
  fixture.btsUrl = baseTemplate.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', BTS);
  fixture.dcUrl = baseTemplate.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', DC);

  // save fixture
  const fixtureObject = new Fixture(fixture);
  await fixtureObject.save();
};
module.exports = {
  getOdds,
  getOddsUrls,
};
