/* eslint-disable max-len */
/* eslint-disable no-empty */

const getMatchInfo = async (page) => page.evaluate(() => {
  const elements = document.getElementsByClassName('capitalize font-normal text-[0.70rem] leading-4 max-mt:!hidden');
  const league = elements[elements.length - 2].querySelector('a').textContent.trim();
  const country = elements[elements.length - 3].querySelector('a').textContent.trim();
  const match = elements[elements.length - 1].textContent.trim();
  const teams = elements[elements.length - 1].textContent.trim().split(' - ');
  return {
    league, country, local: teams[0].trim(), away: teams[1].trim(), match,
  };
});

const getDate = (page) => page.evaluate(() => document.querySelector('.flex.text-xs.font-normal.text-gray-dark.font-main.item-center').textContent);

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
  } catch (error) { }
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

const isValidMatch = async (page) => page.evaluate(() => {
  const liveResult = document.querySelector('.result-live');
  const finishiedMatch = document.getElementsByClassName('relative w-4 h-4 mr-1 bg-center bg-no-repeat bg-exclamation-orange-icon');
  return !(liveResult || finishiedMatch.length);
});

module.exports = {
  getMatchInfo,
  getDate,
  getSectionSelector,
  getInitialOdds,
  getName,
  getBookies,
  getAverage,
  isValidMatch,
};
