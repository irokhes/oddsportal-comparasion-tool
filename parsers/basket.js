/* eslint-disable max-len */
const { parse2WaysLine, parseOverUnderLine } = require('./lines');
const { HOME_AWAY, BASKET_AH } = require('../utils/constants');
const { execShellCommand } = require('../utils/utils');

const cmd = "curl 'https://fb.oddsportal.com/feed/match/1-3-#MATCH#-#LINE#-#PARAMS#' -H 'authority: fb.oddsportal.com' -H 'sec-ch-ua: \"Chromium\";v=\"88\", \"Google Chrome\";v=\"88\", \";Not A Brand\";v=\"99\"' -H 'sec-ch-ua-mobile: ?0' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36' -H 'accept: */*'  -H 'sec-fetch-site: same-site' -H 'sec-fetch-mode: no-cors' -H 'sec-fetch-dest: script' -H 'referer: https://www.oddsportal.com/' -H 'accept-language: es-ES,es;q=0.9,en;q=0.8' -H 'cookie: _ga=GA1.2.1614190317.1554620476; _gid=GA1.2.1578678168.1611570893'";

const getBasketOdds = async (apiUrl, odds, url) => {
  const matchDetails = apiUrl.split('https://fb.oddsportal.com/feed/match/1-3-')[1].split('-');
  const baseUrl = apiUrl.split('https://fb.oddsportal.com')[1].split('?')[0];
  const baseUrlTemplate = '/feed/match/1-3-#MATCH#-#LINE#-#PARAMS#';
  const match = matchDetails[0];
  const parameters = matchDetails[matchDetails.length - 1];

  const mlResult = execShellCommand(cmd.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', HOME_AWAY));
  const ahResult = execShellCommand(cmd.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', BASKET_AH));

  // HOME AWAY
  try {
    const homeAwayJSON = JSON.parse((await mlResult).replace(`globals.jsonpCallback('${baseUrl}', `, '').replace(');', ''));
    const homeAwayOdds = homeAwayJSON.d.oddsdata ? homeAwayJSON.d.oddsdata.back[`E-${HOME_AWAY}-0-0-0`] : null;
    odds.homeAway = parse2WaysLine(homeAwayOdds);
  } catch (error) {
    console.log(`error parsing HOME AWAY for ${url}`);
  }
  // ASIAN HANDICAP
  try {
      const asianHandicapJSON = JSON.parse((await ahResult).replace(`globals.jsonpCallback('${baseUrlTemplate.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', BASKET_AH).split('?')[0]}', `, '').replace(');', ''));
      odds.asianHandicap = [];
      if (asianHandicapJSON.d.oddsdata) {
          Object.keys(asianHandicapJSON.d.oddsdata.back).forEach((key) => {
              const val = asianHandicapJSON.d.oddsdata.back[key];
              let line = key.replace(`E-${BASKET_AH}-0-`, '');
              line = line.substring(0, line.length - 2);
              const oddsLine = parseOverUnderLine(asianHandicapJSON.d.oddsdata.back[key]);
              if (oddsLine) odds.asianHandicap.push({ ...oddsLine, line });
          });
      }
  } catch (error) {
      console.log(`error parsing AH for ${url}`);
  }
  return odds;
};

module.exports = {
  getBasketOdds,
};
