/* eslint-disable max-len */
const composeNewValueBetMessage = (valueBet) => `Value Ratio: ${valueBet.valueRatio.toFixed(3)}\n\nLinea: ${valueBet.line}\n\nL<a href="${valueBet.url}" target="_blank">${valueBet.match}</a>`;

module.exports = { composeNewValueBetMessage };
