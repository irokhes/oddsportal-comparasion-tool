/* eslint-disable no-await-in-loop */
/* eslint-disable no-shadow */
/* eslint-disable max-len */
const { Cluster } = require('puppeteer-cluster');
const { enumerateDaysBetweenDates, getDates } = require('./utils/utils');
const { maxConcurrency } = require('./config');

const {
  getOdds5Bookies,
} = require('./parsers/football');
const { getOdds } = require('./parsers/oddsPortalApi');
const db = require('./models/db');
const analytics = require('./analytics');
const oddsChecker = require('./oddsChecker');

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency,
    monitor: false,
    retryLimit: 3,
    puppeteerOptions: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-dev-profile',
        '--single-process',
        '--proxy-server=de.proxymesh.com:31280',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list ',
      ],
    },
  });
  cluster.on('taskerror', (err, data, willRetry) => {
    if (willRetry) {
      console.warn(`Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`);
    } else {
      console.error(`Failed to crawl ${data}: ${err.message}`);
    }
  });

  async function login(page) {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
    console.log('login...');
    await page.goto('https://www.oddsportal.com/login/');
    await page.type('#login-username1', 'irokhes');
    await page.type('#login-password1', 'Correoocio09');
    await page.click('button[type="submit"]');
    console.log('login ok!');
  }

  const extractMatchOdds = async ({ page, data }) => getOdds(page, data);

  const extractOdds = async (url, sport) => {
    cluster.queue({ url, sport }, extractMatchOdds);
  };

  const extractMatches = async ({ page, data }) => {
    const { url, sport } = data;
    page.on('console', (consoleObj) => console.log(consoleObj.text()));

    try {
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
      })).forEach((matchUrl) => { extractOdds(matchUrl, sport); });
    } catch (error) {
      console.log('Error::::::', error);
    }
  };

  const start = async () => {
    console.log('started');
    const { startDate, endDate } = getDates(process.argv.slice(2));
    db.connect();
    analytics.start();
    oddsChecker.start();
    cluster.queue(async ({ page }) => {
      await login(page);
    });

    while (1) {
      console.time('Parsing');
      cluster.queue(async ({ page }) => {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');

        enumerateDaysBetweenDates(startDate, endDate).forEach((date) => {
          cluster.queue({ url: `https://www.oddsportal.com/matches/soccer/${date}/`, sport: 'football' }, extractMatches);
          cluster.queue({ url: `https://www.oddsportal.com/matches/basketball/${date}/`, sport: 'basketball' }, extractMatches);
        });
      });

      await cluster.idle();
      await cluster.close();
      console.timeEnd('Parsing');
    }
  };
  start();
})();
