const getMatch = (page) => page.evaluate(() => document.querySelector('h1').textContent);
const getActiveTab = (page) => page.evaluate(() => document.querySelector('#bettype-tabs > ul > li.active').textContent);
module.exports = {
  getMatch,
  getActiveTab,
};
