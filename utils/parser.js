/* eslint-disable max-len */
/* eslint-disable no-empty */
const getMatch = (page) => page.evaluate(() => document.querySelector('h1').textContent);

const getDate = (page) => page.evaluate(() => document.querySelector('.date').textContent);

const getActiveTab = (page) => page.evaluate(() => document.querySelector('#bettype-tabs > ul > li.active').textContent);

const getSectionSelector = async (page, section) => {
  const sectionIndex = await page.evaluate((section) => {
    let index = -1;
    [...document.querySelectorAll('#bettype-tabs > ul > li')].some((el, i) => {
      if (el.textContent === section) {
        index = i + 1;
        return true;
      }
      return false;
    });
    return index;
  }, section);
  return sectionIndex >= 0 ? `#bettype-tabs > ul > li:nth-child(${sectionIndex})` : null;
};

const getInitialOdds = async (page, row, position, tableIndex = 1) => {
  let openingOdds;

  try {
    await page.hover(`#odds-data-table > div:nth-child(${tableIndex}) > table > tbody > tr:nth-child(${row}) > td.right.odds:nth-child(${position}) > :nth-child(1)`);
    openingOdds = await page.evaluate(() => document.querySelector('#tooltipdiv > span').innerHTML.split('Opening odds:<br>')[1].split('<strong>')[1].split('</strong>')[0]);
  } catch (error) { console.log(error); }
  return openingOdds;
};

const getAverage = (page, position) => {
  page.evaluate(() => {
    // get average odds
    const localWinAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(2)';
    const localAvg = document.querySelector(localWinAvgOddsSelector).textContent;
    const drawAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(3)';
    const drawAvg = document.querySelector(drawAvgOddsSelector).textContent;
    const awayWinAvgOddsSelector = '#odds-data-table > div > table > tfoot > tr.aver > td:nth-child(4)';
    const awayAvg = document.querySelector(awayWinAvgOddsSelector).textContent;
    return { localAvg, awayAvg, drawAvg };
  });
};

const getName = async (page, index, tableIndex = 1) => page.evaluate(({ index, tableIndex }) => {
  const nameSelector = document.querySelector(`#odds-data-table > div:nth-child(${tableIndex}) > table > tbody > tr.lo:nth-child(${index}) > td:nth-child(1)`);
  return nameSelector ? nameSelector.querySelector('div > a.name').textContent : null;
}, { index, tableIndex });

const getBookies = (page, index = 1) => page.evaluate((i) => Array.from(document.querySelectorAll(
  `#odds-data-table > div:nth-child(${i}) > table > tbody > tr.lo`,
)), index);

module.exports = {
  getMatch,
  getDate,
  getActiveTab,
  getSectionSelector,
  getInitialOdds,
  getName,
  getBookies,
  getAverage,
};
