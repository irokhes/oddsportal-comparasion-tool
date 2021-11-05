const { parse2WaysLine, parseOverUnderLine, parse3WaysLine} = require('./lines');
const { MONEYLINE, DNB, DC, AH, OVER_UNDER, BTS, MONEYLINE_FIRST_HALF } = require('../utils/constants');
const { execShellCommand } = require('../utils/utils');

const cmd = "curl 'https://fb.oddsportal.com/feed/match/1-1-#MATCH#-#LINE#-#PARAMS#' -H 'authority: fb.oddsportal.com' -H 'sec-ch-ua: \"Chromium\";v=\"88\", \"Google Chrome\";v=\"88\", \";Not A Brand\";v=\"99\"' -H 'sec-ch-ua-mobile: ?0' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36' -H 'accept: */*'  -H 'sec-fetch-site: same-site' -H 'sec-fetch-mode: no-cors' -H 'sec-fetch-dest: script' -H 'referer: https://www.oddsportal.com/' -H 'accept-language: es-ES,es;q=0.9,en;q=0.8' -H 'cookie: _ga=GA1.2.1614190317.1554620476; _gid=GA1.2.1578678168.1611570893'";

const getFootballOdds = async (apiUrl, odds, url) => {
    const matchDetails = apiUrl.split('https://fb.oddsportal.com/feed/match/1-1-')[1].split('-');
    const baseUrl = apiUrl.split('https://fb.oddsportal.com')[1].split('?')[0];
    const baseUrlTemplate = '/feed/match/1-1-#MATCH#-#LINE#-#PARAMS#';
    const match = matchDetails[0];
    const parameters = matchDetails[matchDetails.length - 1];


    const mlResult = execShellCommand(cmd.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', MONEYLINE));
    const mlFirstHalfResult = execShellCommand(cmd.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', MONEYLINE_FIRST_HALF));
    const dnbResult = execShellCommand(cmd.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', DNB));
    const btsResult = execShellCommand(cmd.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', BTS));
    const dcResult = execShellCommand(cmd.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', DC));
    const oUResult = execShellCommand(cmd.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', OVER_UNDER));
    const ahResult = execShellCommand(cmd.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', AH));
    // ML
    try {
        const moneyLineJSON = JSON.parse((await mlResult).replace(`globals.jsonpCallback('${baseUrl}', `, '').replace(');', ''));
        const moneyLineOdds = moneyLineJSON.d.oddsdata ? moneyLineJSON.d.oddsdata.back[`E-${MONEYLINE}-0-0-0`] : null;
        odds.moneyLine = parse3WaysLine(moneyLineOdds);
    } catch (error) {
        // console.log(`error parsing ML for ${url}`);
    }
    // ML 1ST HALF
    try {
        const moneyLineFirstHalfJSON = JSON.parse((await mlFirstHalfResult).replace(`globals.jsonpCallback('${baseUrl}', `, '').replace(');', ''));
        console.log(moneyLineFirstHalfJSON)
        const moneyLineFirstHalfOdds = moneyLineFirstHalfJSON.d.oddsdata ? moneyLineFirstHalfJSON.d.oddsdata.back[`E-${MONEYLINE_FIRST_HALF}-0-0-0`] : null;
        odds.moneyLineFirstHalf = parse3WaysLine(moneyLineFirstHalfOdds);
    } catch (error) {
        // console.log(`error parsing ML for ${url}`);
    }
    // DNB
    try {
        const dnbJSON = JSON.parse((await dnbResult).replace(`globals.jsonpCallback('${baseUrlTemplate.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', DNB).split('?')[0]}', `, '').replace(');', ''));
        const dnbLine = dnbJSON.d.oddsdata ? dnbJSON.d.oddsdata.back[`E-${DNB}-0-0-0`] : null;
        odds.dnb = parse2WaysLine(dnbLine)
    } catch (error) {
        // console.log(`error parsing DNB for ${url}`);
    }
    // BTS
    try {
        const bttsJSON = JSON.parse((await btsResult).replace(`globals.jsonpCallback('${baseUrlTemplate.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', BTS).split('?')[0]}', `, '').replace(');', ''));
        const bttsLine = bttsJSON.d.oddsdata ? bttsJSON.d.oddsdata.back[`E-${BTS}-0-0-0`] : null;
        odds.bts = parse2WaysLine(bttsLine)
    } catch (error) {
        // console.log(`error parsing BTS for ${url}`);
    }
    // DC
    try {
        const dcJSON = JSON.parse((await dcResult).replace(`globals.jsonpCallback('${baseUrlTemplate.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', DC).split('?')[0]}', `, '').replace(');', ''));
        const dcLine = dcJSON.d.oddsdata ? dcJSON.d.oddsdata.back[`E-${DC}-0-0-0`] : null;
        odds.doubleChance = parse3WaysLine(dcLine)
    } catch (error) {
        // console.log(`error parsing DC for ${url}`);

    }
    // OVER UNDER GOALS
    try {
        const overUnderJSON = JSON.parse((await oUResult).replace(`globals.jsonpCallback('${baseUrlTemplate.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', OVER_UNDER).split('?')[0]}', `, '').replace(');', ''));
        odds.overUnder = [];
        if (overUnderJSON.d.oddsdata) {
            Object.keys(overUnderJSON.d.oddsdata.back).forEach((key) => {
                const val = overUnderJSON.d.oddsdata.back[key];
                let line = key.replace(`E-${OVER_UNDER}-0-`, '');
                line = line.substring(0, line.length - 2);
                const oddsLine = parseOverUnderLine(overUnderJSON.d.oddsdata.back[key]);
                if (oddsLine) odds.overUnder.push({ ...oddsLine, line });
            });
        }
    } catch (error) {
        // console.log(`error parsing O/U for ${url}`);

    }
    // ASIAN HANDICAP
    try {
        const asianHandicapJSON = JSON.parse((await ahResult).replace(`globals.jsonpCallback('${baseUrlTemplate.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', AH).split('?')[0]}', `, '').replace(');', ''));
        odds.asianHandicap = [];
        if (asianHandicapJSON.d.oddsdata) {
            Object.keys(asianHandicapJSON.d.oddsdata.back).forEach((key) => {
                const val = asianHandicapJSON.d.oddsdata.back[key];
                let line = key.replace(`E-${AH}-0-`, '');
                line = line.substring(0, line.length - 2);
                const oddsLine = parseOverUnderLine(asianHandicapJSON.d.oddsdata.back[key]);
                if (oddsLine) odds.asianHandicap.push({ ...oddsLine, line });
            });
        }
    } catch (error) {
        // console.log(`error parsing AH for ${url}`);
    }

    return odds;
};

module.exports = {
    getFootballOdds,
};
