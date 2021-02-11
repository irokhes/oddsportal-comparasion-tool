/* eslint-disable max-len */
const composeNewValueBetMessage = (valueBet) => `Value Ratio: ${valueBet.valueRatio}\n\nLinea: ${valueBet.line}\n\n<a href="${valueBet.url}" target="_blank">${valueBet.match}</a>`;

module.exports = { composeNewValueBetMessage };
