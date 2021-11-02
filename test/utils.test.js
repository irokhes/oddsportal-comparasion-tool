const { getDateObj, removePreferentialPicks } = require('../utils/utils');

test('get Date object from string', () => {
  expect(getDateObj('Tomorrow, 24 Apr  2021, 00:00').toISOString()).toStrictEqual('2021-04-24T00:00:00.000Z');
});
test('get Date object from string', () => {
  expect(getDateObj('Today, 29 Apr  2021, 17:00').toISOString()).toStrictEqual('2021-04-29T17:00:00.000Z');
});
const list = [{ url: 'url1', name: '1' }, { url: 'url2', name: '2' }];
const preferentialList = [{ url: 'url1', name: '1' }, { url: 'url3', name: '3' }];
test('it should remove valuebets from normal list in they are present in the preferential list', () => {
  expect(removePreferentialPicks(list, preferentialList).length).toEqual(1);
});
const listWithoutMatches = [{ url: 'url11', name: '11' }, { url: 'url2', name: '2' }];
test('it should not remove valuebets from normal list in they are not present in the preferential list', () => {
  expect(removePreferentialPicks(listWithoutMatches, preferentialList).length).toEqual(2);
});
