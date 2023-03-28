/* eslint-disable no-await-in-loop */
/* eslint-disable no-shadow */
/* eslint-disable max-len */
const { Cluster } = require('puppeteer-cluster');
const { getDates } = require('./utils/utils');
const { maxConcurrency } = require('./config');

const { getOdds } = require('./parsers/oddsPortalApi');
const db = require('./models/db');
const analytics = require('./analytics');

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
        '--disable-web-security',
        '--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure',
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

  async function login({ page, data: url }) {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
    console.log('login...');
    await page.goto(url);
    await page.type('#login-username-sign', 'irokhes');
    await page.type('#login-password-sign', 'Correoocio09');
    (await page.evaluate(() => {
      document.querySelector('input[name="login-submit"]').click();
    }));
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
        const matchesListQuerySelector = 'flex flex-col border-b border-black-borders';
        const matches = [...document.getElementsByClassName(matchesListQuerySelector)];

        return matches.reduce((matchesUrlList, match) => {
          const notElegibleSelector = 'hidden flex-col items-center next-m:!flex justify-center gap-1 pt-1 pb-1 border-black-main border-opacity-10 min-w-[60px]';
          const matchHasEnded = match.getElementsByClassName(notElegibleSelector);
          if (matchHasEnded.length) return matchesUrlList;

          const matchUrl = match.querySelector('.flex.group.border-l.border-r.border-black-borders > a').href;
          matchesUrlList.push(matchUrl);
          return matchesUrlList;
        }, []);
      })).forEach((match) => { extractOdds(match, sport); });
    } catch (error) {
      console.log('Error::::::', error);
    }
  };

  const start = async () => {
    console.log('started');
    db.connect();
    analytics.start();
    await cluster.execute('https://www.oddsportal.com/login/', login);

    while (1) {
      console.time('Parsing');
      cluster.queue(async ({ page }) => {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
        getDates().forEach((date) => {
          console.log(`https://www.oddsportal.com/matches/football/${date}/`);
          cluster.queue({ url: `https://www.oddsportal.com/matches/football/${date}/`, sport: 'football' }, extractMatches);
          // cluster.queue({ url: `https://www.oddsportal.com/matches/basketball/${date}/`, sport: 'basketball' }, extractMatches);
        });
      });

      await cluster.idle();
      await cluster.close();
      console.timeEnd('Parsing');
    }
  };
  start();
})();
