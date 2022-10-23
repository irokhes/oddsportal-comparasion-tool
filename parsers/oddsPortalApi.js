/* eslint-disable max-len */
const {
  getMatch, getDate, isElegibleMatch, getLeague,
} = require('../utils/parser');
const { getDateObj } = require('../utils/utils');
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
    const reqUrl = request.url().toString();
    if (reqUrl.includes('/feed/match')) { apiUrl = reqUrl; }
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
  const { league, country } = await getLeague(page);
  odds.league = league;
  odds.country = country;
  odds.date = await getDate(page);
  odds.dateObj = getDateObj(odds.date);
  odds.url = url;
  odds.sport = sport;

  if (isFootball) {
    odds = await getFootballOdds(apiUrl, odds, url);
  } else {
    odds = await getBasketOdds(apiUrl, odds, url);
  }
  // save odds
  if (!odds || (!odds.moneyLine && !odds.moneyLineFirstHalf && !odds.homeAway && !odds.dnb && !odds.doubleChance && !odds.bts && (!odds.overUnder || odds.overUnder.length === 0) && (!odds.asianHandicap || odds.asianHandicap.length === 0))) return;
  await Odds.findOneAndUpdate({ url: odds.url }, odds, { upsert: true, setDefaultsOnInsert: true });
};
module.exports = {
  getOdds,
};
