/* eslint-disable no-plusplus */
const { exec } = require('child_process');

const moment = require('moment');
const bannedLeagues = require('./bannedLeagues');

const delay = (time) => new Promise((resolve) => {
  setTimeout(resolve, time);
});
const enumerateDaysBetweenDates = (startDateString, endDateString) => {
  const startDate = moment(startDateString);
  const endDate = moment(endDateString);

  const dates = [];
  for (
    let m = moment(startDate);
    m.diff(endDate, 'days') <= 0;
    m.add(1, 'days')
  ) {
    dates.push(m.format('YYYYMMDD'));
  }
  return dates;
};
const getDates = () => {
  const dates = [];
  for (let index = 0; index < 16; index++) {
    dates.push(
      moment()
        .add(index, 'days')
        .format('YYYYMMDD'),
    );
  }
  return dates;
};
const monthsMapping = {
  Jan: '01',
  Feb: '02',
  Mar: '03',
  Apr: '04',
  May: '05',
  Jun: '06',
  Jul: '07',
  Aug: '08',
  Sep: '09',
  Oct: '10',
  Nov: '11',
  Dec: '12',
};
function getDateObj(dateString) {
  // Tomorrow, 24 Apr  2021, 00:00
  const toArray = dateString.split(', ');
  const dateInArray = toArray[1].split(' ');
  const day = dateInArray[0];
  const month = monthsMapping[dateInArray[1]];
  const year = toArray[1].split('  ')[1];
  if (Number.isNaN(Date.parse(`${year}-${month}-${day}T${toArray[2]}:00Z`))) {
    console.log('NO ES UNA FECHA... ', dateString);
  }
  return new Date(`${year}-${month}-${day}T${toArray[2]}:00Z`);
}

const yyymmdd = (date) => {
  const mm = date.getMonth() + 1; // getMonth() is zero-based
  const dd = date.getDate();
  return [
    date.getFullYear(),
    (mm > 9 ? '' : '0') + mm,
    (dd > 9 ? '' : '0') + dd,
  ].join('');
};
const addZeroes = (num) => {
  const dec = num.toString().split('.')[1];
  const len = dec && dec.length > 2 ? dec.length : 2;
  return Number(num).toFixed(len);
};
function getOddsBelowOpeningValue(
  betytype,
  openingOddsType,
  _188BET,
  _1xBet,
  _Marathonbet,
  _Pinnacle,
) {
  let currentOddsBelowOrigianl = 0;
  if (_188BET[betytype] < _188BET[openingOddsType]) {
    currentOddsBelowOrigianl++;
  }
  if (_1xBet[betytype] < _1xBet[openingOddsType]) {
    currentOddsBelowOrigianl++;
  }
  if (_Marathonbet[betytype] < _Marathonbet[openingOddsType]) {
    currentOddsBelowOrigianl++;
  }
  if (_Pinnacle[betytype] < _Pinnacle[openingOddsType]) {
    currentOddsBelowOrigianl++;
  }
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
    }
    if (sortedArray[middle] < key) {
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
function removeDuplicates(list) {
  const urls = list.map((o) => o.url);
  return list.filter(({ url }, index) => !urls.includes(url, index + 1));
}
function removePreferentialPicks(list, preferentialList) {
  return list.filter((o1) => !preferentialList.some((o2) => o1.match === o2.match));
}
const TERCERA_DIVISION_ESPANOLA = 'tercera-rfef-group';
const ALEMANIA_YOUTH_LEAGUE = 'junioren-bundesliga';
const ITALIA_YOUTH_LEAGUE = 'primavera-';
const ITALIA_SERIE_D = 'italy/serie-d';
const UEFA_YOUTH_LEAGUE = 'uefa-youth-league';
const SAO_PAULO_JUNIOR = 'copa-sao-paulo-de-juniores';

function shouldBeNotified(valueBet) {
  if (valueBet.url.includes(TERCERA_DIVISION_ESPANOLA)) return false;
  if (valueBet.url.includes(ALEMANIA_YOUTH_LEAGUE)) return false;
  if (valueBet.url.includes(ITALIA_YOUTH_LEAGUE)) return false;
  if (valueBet.url.includes(ITALIA_SERIE_D)) return false;
  if (valueBet.url.includes(UEFA_YOUTH_LEAGUE)) return false;
  if (valueBet.url.includes(SAO_PAULO_JUNIOR)) return false;

  if (valueBet.upTrend >= 66) return false;

  return true;
}

function isABannedLeague(valueBet) {
  const isABannedLeagueResult = bannedLeagues.some((league) => valueBet.url.includes(league));
  return !isABannedLeagueResult;
}

function shouldGetMatches(matchUrl) {
  console.log(matchUrl);
  if (matchUrl.includes(TERCERA_DIVISION_ESPANOLA)) return false;
  if (matchUrl.includes(ALEMANIA_YOUTH_LEAGUE)) return false;
  if (matchUrl.includes(ITALIA_YOUTH_LEAGUE)) return false;
  if (matchUrl.includes(ITALIA_SERIE_D)) return false;
  if (matchUrl.includes(UEFA_YOUTH_LEAGUE)) return false;
  if (matchUrl.includes(SAO_PAULO_JUNIOR)) return false;

  return true;
}

module.exports = {
  delay,
  enumerateDaysBetweenDates,
  getDates,
  getDateObj,
  addZeroes,
  getOddsBelowOpeningValue,
  round,
  execShellCommand,
  binarySearch,
  removeDuplicates,
  removePreferentialPicks,
  shouldBeNotified,
  shouldGetMatches,
  isABannedLeague,
};
