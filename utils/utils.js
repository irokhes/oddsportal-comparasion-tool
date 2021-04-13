/* eslint-disable no-plusplus */
const { exec } = require('child_process');

const moment = require('moment');

const delay = (time) => new Promise((resolve) => {
  setTimeout(resolve, time);
});
const enumerateDaysBetweenDates = (startDateString, endDateString) => {
  const startDate = moment(startDateString);
  const endDate = moment(endDateString);

  const dates = [];
  for (let m = moment(startDate); m.diff(endDate, 'days') <= 0; m.add(1, 'days')) {
    dates.push(m.format('YYYYMMDD'));
  }
  return dates;
};
const getDates = () => {
  const dates = [];
  for (let index = 0; index < 15; index++) {
    dates.push(moment().add(index, 'days').format('YYYYMMDD'));
  }
  return dates;
};

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
function round(value, decimals) {
  return Number(`${Math.round(`${value}e${decimals}`)}e-${decimals}`);
}
function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1000 }, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
      }
      resolve(stdout || stderr);
    });
  });
}

function binarySearch(sortedArray, key) {
  let start = 0;
  let end = sortedArray.length - 1;

  while (start <= end) {
    const middle = Math.floor((start + end) / 2);

    if (sortedArray[middle] === key) {
      // found the key
      return middle;
    } if (sortedArray[middle] < key) {
      // continue searching to the right
      start = middle + 1;
    } else {
      // search searching to the left
      end = middle - 1;
    }
  }
  // key wasn't found
  return -1;
}
module.exports = {
  delay,
  enumerateDaysBetweenDates,
  getDates,
  addZeroes,
  getOddsBelowOpeningValue,
  round,
  execShellCommand,
  binarySearch,
};
