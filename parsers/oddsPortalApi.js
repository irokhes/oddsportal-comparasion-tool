/* eslint-disable max-len */
const { parse3WaysLine, parse2WaysLine, parseOverUnderLine, } = require('./lines');
const { getMatch, getDate } = require('../utils/parser');
const Odds = require('../models/odds');

const getValue3WaysValueBet = () => {
    if ((1 / localWin) + (1 / awayAvg) + (1 / drawAvg) <= valueBetLimit) return (1 / localWin) + (1 / awayAvg) + (1 / drawAvg);
    if ((1 / awayWin) + (1 / localAvg) + (1 / drawAvg) <= valueBetLimit) return (1 / awayWin) + (1 / localAvg) + (1 / drawAvg);
};
const getOdds = async (page, url) => {
    const odds = {};
    page.on('console', (consoleObj) => console.log(consoleObj.text()));
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
    await page.setRequestInterception(true);
    let apiUrl;
    page.on('request', (request) => {
        const url = request.url().toString();
        if (url.includes('/feed/match')) { apiUrl = url; }
        request.continue();
    });

    await page.goto(`${url}`);
    // console.log(url);
    odds.match = await getMatch(page);
    odds.date = await getDate(page);
    odds.url = url;

    const child_process = require('child_process');

    function runCmd(cmd) {
        const resp = child_process.execSync(cmd);
        const result = resp.toString('UTF8');
        return result;
    }

    function execShellCommand(cmd) {
        const exec = require('child_process').exec;
        return new Promise((resolve, reject) => {
            exec(cmd, { maxBuffer: 1024 * 1000 }, (error, stdout, stderr) => {
                if (error) {
                    console.warn(error);
                }
                resolve(stdout ? stdout : stderr);
            });
        });
    }

    const matchDetails = apiUrl.split('https://fb.oddsportal.com/feed/match/1-1-')[1].split('-');
    const baseUrl = apiUrl.split('https://fb.oddsportal.com')[1].split('?')[0];
    const baseUrlTemplate = '/feed/match/1-1-#MATCH#-#LINE#-#PARAMS#';
    const match = matchDetails[0];
    const parameters = matchDetails[matchDetails.length - 1];
    const moneyLine = '1-2';
    const dnb = '6-2';
    const AH = '5-2';
    const OverUnder = '2-2';
    const BTS = '13-2';
    const DC = '4-2';
    const cmd = "curl 'https://fb.oddsportal.com/feed/match/1-1-#MATCH#-#LINE#-#PARAMS#' -H 'authority: fb.oddsportal.com' -H 'sec-ch-ua: \"Chromium\";v=\"88\", \"Google Chrome\";v=\"88\", \";Not A Brand\";v=\"99\"' -H 'sec-ch-ua-mobile: ?0' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36' -H 'accept: */*'  -H 'sec-fetch-site: same-site' -H 'sec-fetch-mode: no-cors' -H 'sec-fetch-dest: script' -H 'referer: https://www.oddsportal.com/' -H 'accept-language: es-ES,es;q=0.9,en;q=0.8' -H 'cookie: _ga=GA1.2.1614190317.1554620476; _gid=GA1.2.1578678168.1611570893'";



    const mlResult = execShellCommand(cmd.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', moneyLine));
    const dnbResult = execShellCommand(cmd.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', dnb));
    const btsResult = execShellCommand(cmd.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', BTS));
    const dcResult = execShellCommand(cmd.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', DC));
    const ahResult = execShellCommand(cmd.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', AH));
    const oUResult = execShellCommand(cmd.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', OverUnder));

    // ML
    try {
        const moneyLineJSON = JSON.parse((await mlResult).replace(`globals.jsonpCallback('${baseUrl}', `, '').replace(');', ''));
        const moneyLineOdds = moneyLineJSON.d.oddsdata ? moneyLineJSON.d.oddsdata.back[`E-${moneyLine}-0-0-0`] : null;
        odds.moneyLine = parse3WaysLine(moneyLineOdds);
    } catch (error) {
        console.log(`error parsing ML for ${url}`);
    }


    // DNB
    try {
        const dnbJSON = JSON.parse((await dnbResult).replace(`globals.jsonpCallback('${baseUrlTemplate.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', dnb).split('?')[0]}', `, '').replace(');', ''));
        const dnbLine = dnbJSON.d.oddsdata ? dnbJSON.d.oddsdata.back[`E-${dnb}-0-0-0`] : null;
        odds.dnb = parse2WaysLine(dnbLine)
    } catch (error) {
        console.log(`error parsing DNB for ${url}`);
    }


    // BTS
    try {
        const bttsJSON = JSON.parse((await btsResult).replace(`globals.jsonpCallback('${baseUrlTemplate.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', BTS).split('?')[0]}', `, '').replace(');', ''));
        const bttsLine = bttsJSON.d.oddsdata ? bttsJSON.d.oddsdata.back[`E-${BTS}-0-0-0`] : null;
        odds.bts = parse2WaysLine(bttsLine)
    } catch (error) {
        console.log(`error parsing BTS for ${url}`);
    }


    // DC
    try {
        const dcJSON = JSON.parse((await dcResult).replace(`globals.jsonpCallback('${baseUrlTemplate.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', DC).split('?')[0]}', `, '').replace(');', ''));
        const dcLine = dcJSON.d.oddsdata ? dcJSON.d.oddsdata.back[`E-${DC}-0-0-0`] : null;
        odds.doubleChance = parse3WaysLine(dcLine)
    } catch (error) {
        console.log(`error parsing DC for ${url}`);

    }


    // // ASIAN HANDICAP
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
        console.log(`error parsing AH for ${url}`);
    }

    // OVER UNDER GOALS
    try {
        const overUnderJSON = JSON.parse((await oUResult).replace(`globals.jsonpCallback('${baseUrlTemplate.replace('#MATCH#', match).replace('#PARAMS#', parameters).replace('#LINE#', OverUnder).split('?')[0]}', `, '').replace(');', ''));
        odds.overUnder = [];
        if (overUnderJSON.d.oddsdata) {
            Object.keys(overUnderJSON.d.oddsdata.back).forEach((key) => {
                const val = overUnderJSON.d.oddsdata.back[key];
                let line = key.replace(`E-${OverUnder}-0-`, '');
                line = line.substring(0, line.length - 2);
                const oddsLine = parseOverUnderLine(overUnderJSON.d.oddsdata.back[key]);
                if (oddsLine) odds.overUnder.push({ ...oddsLine, line });
            });
        }
    } catch (error) {
        console.log(`error parsing O/U for ${url}`);

    }


    // save odds
    if (!odds || (!odds.moneyLine && !odds.dnb && !odds.doubleChance && !odds.bts && odds.overUnder.length === 0 && odds.asianHandicap.length === 0)) return;
    await Odds.findOneAndUpdate({url: odds.url}, odds, { upsert: true, setDefaultsOnInsert: true })
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

    let baseTemplate = 'https://fb.oddsportal.com/feed/match/1-1-#MATCH#-#LINE#-#PARAMS#';
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
    await fixtureObject.save()
}
module.exports = {
    getOdds,
    getOddsUrls,
};
