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
  return `#bettype-tabs > ul > li:nth-child(${sectionIndex})`;
};
module.exports = {
  getMatch,
  getDate,
  getActiveTab,
  getSectionSelector,
};
