const { getDateObj } = require('../utils/utils');

test('get Date object from string', () => {
  expect(getDateObj('Tomorrow, 24 Apr  2021, 00:00').toISOString()).toStrictEqual('2021-04-24T00:00:00.000Z');
});
test('get Date object from string', () => {
  expect(getDateObj('Today, 29 Apr  2021, 17:00').toISOString()).toStrictEqual('2021-04-29T17:00:00.000Z');
});
