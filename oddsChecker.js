const { CronJob } = require('cron');
const Bet = require('./models/bets');
const Odds = require('./models/odds');
const { sendHtmlMessage, sendMessage } = require('./telegram');
const { oddsCheckerFequency } = require('./config');

const checkOddsForExistingBets = () => {
    const bets = await Bet.find();
    for (let i = 0; i < bet.length; i++){
        const odds = await Odds.findOne({ sequence: })
    }
};
const start = () => {
  const job = new CronJob(`0 */${frequoddsCheckerFequencyency} * * * *`, (async () => {
    await checkOddsForExistingBets();
  }));
  job.start();
};

module.exports = { start };
