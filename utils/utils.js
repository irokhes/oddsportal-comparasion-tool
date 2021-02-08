/* eslint-disable no-plusplus */
const moment = require('moment');

const delay = (time) => new Promise((resolve) => {
  setTimeout(resolve, time);
});
const enumerateDaysBetweenDates = (startDateString, endDateString) => {
  const startDate = moment(startDateString);
  const endDate = moment(endDateString);

  const dates = [];
  for (let m = moment(startDate); m.diff(endDate, 'days') <= 0; m.add(1, 'days')) {
    console.log(m.format('YYYYMMDD'));
    dates.push(m.format('YYYYMMDD'));
  }
  return dates;
};

function getDates(args) {
  if (args.length < 1) {
    console.log('you need to provide a date: node index.js YYYYMMDD');
    process.exit(1);
  }
  return { startDate: args[0], endDate: args.length > 1 ? args[1] : args[0] };
}

const yyymmdd = (date) => {
  const mm = date.getMonth() + 1; // getMonth() is zero-based
  const dd = date.getDate();
  return [date.getFullYear(),
    (mm > 9 ? '' : '0') + mm,
    (dd > 9 ? '' : '0') + dd,
  ].join('');
};
const addZeroes = (num) => {
  const dec = num.toString().split('.')[1];
  const len = dec && dec.length > 2 ? dec.length : 2;
  return Number(num).toFixed(len);
};
function getOddsBelowOpeningValue(betytype, openingOddsType, _188BET, _1xBet, _Marathonbet, _Pinnacle) {
  let currentOddsBelowOrigianl = 0;
  if (_188BET[betytype] < _188BET[openingOddsType]) { currentOddsBelowOrigianl++; }
  if (_1xBet[betytype] < _1xBet[openingOddsType]) { currentOddsBelowOrigianl++; }
  if (_Marathonbet[betytype] < _Marathonbet[openingOddsType]) { currentOddsBelowOrigianl++; }
  if (_Pinnacle[betytype] < _Pinnacle[openingOddsType]) { currentOddsBelowOrigianl++; }
  return currentOddsBelowOrigianl;
}
module.exports = {
  delay,
  enumerateDaysBetweenDates,
  getDates,
  addZeroes,
  getOddsBelowOpeningValue,
};
