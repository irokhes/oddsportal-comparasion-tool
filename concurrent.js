/* eslint-disable no-shadow */
/* eslint-disable max-len */
const { Cluster } = require('puppeteer-cluster');
const { saveFile } = require('./utils/files');
const { enumerateDaysBetweenDates, getDates } = require('./utils/utils');

const {
  getOdds, getMoneyLineOdds, getDNBOdds, getDoubleChanceLineOdds,
  getUnderOverGoalsLines, getBothTeamsScoreOdds, getUnderOverGoalsOdds,
} = require('./parsers/football.js');

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 5,
    monitor: false,
    puppeteerOptions: {
      headless: true,
    },
  });
  const totalResults = [];
  const addZeroes = (num) => {
    const dec = num.split('.')[1];
    const len = dec && dec.length > 2 ? dec.length : 2;
    return Number(num).toFixed(len);
  };

  async function login(page) {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');

    await page.goto('https://www.oddsportal.com/login/');
    await page.type('#login-username1', 'irokhes');
    await page.type('#login-password1', 'Correoocio09');
    await page.click('button[type="submit"]');
  }

  const extractMatchOdds = async ({ page, data: url }) => getOdds(page, url);
  const extractMoneyLineOdds = async ({ page, data: url }) => getMoneyLineOdds(page, url);
  const extractDnbOdds = async ({ page, data: url }) => getDNBOdds(page, url);
  const extractDoubleChanceOdds = async ({ page, data: url }) => getDoubleChanceLineOdds(page, url);
  const extractUnderOverGoalsLines = async ({ page, data: url }) => {
    const lines = await getUnderOverGoalsLines(page, url);
    return lines.map((line) => ({ url: `${url}#over-under;2;${addZeroes(line)};0`, numOfGoals: line }));
  };
  const extractUnderOverGoalsOdds = ({ page, data }) => getUnderOverGoalsOdds(page, data.url, data.numOfGoals);
  const extractBothTeamsScoreOdds = ({ page, data: url }) => getBothTeamsScoreOdds(page, url);

  const extractOdds = async (url) => {
    const odds = await cluster.execute(url, extractMatchOdds).catch((err) => console.log('error getting All odds: ', err));
    totalResults.push(odds);
    // const moneyLine = await cluster.execute(url, extractMoneyLineOdds).catch((err) => console.log('error getting moneyline: ', err));
    // const dnbOdds = await cluster.execute(url, extractDnbOdds(page, url));
    // const doubleChance = await cluster.execute(url, extractDooubleChanceOdds(page, url));

    // const underOverGoalLines = await cluster.execute(url, extractUnderOverGoalsLines).catch((err) => console.log('error getting over under: ', err));

    // const promises = [];
    // underOverGoalLines.forEach(async (line) => {
    //   promises.push(cluster.execute({ url: line.url, numOfGoals: line.numOfGoals }, extractUnderOverGoalsOdds));
    //   if (underOverGoalLine.name) totalResults.push({ ...underOverGoalLine, type: 'O/U' });
    // });
    // const lines = await Promise.all(promises);

    // underOverGoalLines.forEach(async (line) => {
    //   const underOverGoalLine = await cluster.execute({ url: line.url, numOfGoals: line.numOfGoals }, extractUnderOverGoalsOdds);
    //   if (underOverGoalLine.name) totalResults.push({ ...underOverGoalLine, type: 'O/U' });
    // });

    // const bothTeamsScore = await cluster.execute(url, extractBothTeamsScoreOdds).catch((err) => console.log('error getting both teams score line: ', err));
    // if (bothTeamsScore.name) totalResults.push({ ...bothTeamsScore, type: 'BTS' });
  };

  const extractMatches = async ({ page, data: url }) => {
    page.on('console', (consoleObj) => console.log(consoleObj.text()));

    try {
      console.log('starting...');
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
      await page.goto(url);
      (await page.evaluate(() => {
        const matchesListQuerySelector = '#table-matches > table > tbody > tr[xeid]';
        const matches = [...document.querySelectorAll(matchesListQuerySelector)];
        return matches.reduce((matchesUrlList, match) => {
          const matchHasEnded = match.querySelector('.table-score');
          if (matchHasEnded) return matchesUrlList;

          const matchUrlLinks = Array.from(match.querySelectorAll('td.name.table-participant > a'));
          matchesUrlList.push(matchUrlLinks.length > 1 ? matchUrlLinks[1].href : matchUrlLinks[0].href);
          return matchesUrlList;
        }, []);
      })).forEach((matchUrl) => { extractOdds(matchUrl); });
    } catch (error) {
      console.log('Error::::::', error);
    }
  };

  const start = async () => {
    const { startDate, endDate } = getDates(process.argv.slice(2));

    cluster.queue(async ({ page }) => {
      await login(page);
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
      enumerateDaysBetweenDates(startDate, endDate).forEach((date) => {
        cluster.queue(`https://www.oddsportal.com/matches/soccer/${date}/`, extractMatches);
      });
    });

    await cluster.idle();
    await cluster.close();
    saveFile(startDate, totalResults);
    console.log('Done...');
  };
  start();
  // document.querySelector('#odds-data-table > div:nth-child(2) > table')
})();
