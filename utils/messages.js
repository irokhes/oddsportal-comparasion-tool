/* eslint-disable max-len */
const composeNewValueBetMessage = (valueBet) => `Linea: ${valueBet.line}\n\n<a href="${valueBet.url}" target="_blank">${valueBet.match}</a>\n\nValue Ratio: ${valueBet.valueRatio}\n\n Seq: ${valueBet.sequence}`;
const composeNewPercentageBetMessage = (valueBet) => `PERCENTAGE\n\nLinea: ${valueBet.line}\n\n<a href="${valueBet.url}" target="_blank">${valueBet.match}</a>\n\nValue Percentage: ${valueBet.percentage}\n\n`;
const composeOddsDropBetMessage = (bet, oddsDrop) => `Media ha bajado ${oddsDrop}\n\n<a href="${bet.url}" target="_blank">${bet.match}</a>\n\nValue Percentage: ${bet.percentage}\n\n`;

module.exports = { composeNewValueBetMessage, composeNewPercentageBetMessage };
