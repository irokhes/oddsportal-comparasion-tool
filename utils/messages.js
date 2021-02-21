/* eslint-disable max-len */
const composeNewValueBetMessage = (valueBet) => `Linea: ${valueBet.line}\n\n<a href="${valueBet.url}" target="_blank">${valueBet.match}</a>\n\nValue Ratio: ${valueBet.valueRatio}\n\n Seq: ${valueBet.sequence}`;
const composeNewPercentageBetMessage = (valueBet) => `PERCENTAGE\n\nLinea: ${valueBet.line}\n\n<a href="${valueBet.url}" target="_blank">${valueBet.match}</a>\n\nValue Percentage: ${valueBet.percentage}\n\n`;
const composeDriftedBet = (driftedBet) => `Diferencia entre lineas AH ${driftedBet.lineValue}  ${driftedBet.dnb ? driftedBet.dnbOdds : driftedBet.dcOdds}\n\n<a href="${driftedBet.url}" target="_blank">${driftedBet.match}</a>\n\n`;
const composeOddsChangeBetMessage = (bet, oddsChange) => `La linea ${bet.line} ha cambiado ${oddsChange}\n\n<a href="${bet.url}" target="_blank">${bet.match}</a>\n\n`;
module.exports = {
  composeNewValueBetMessage,
  composeNewPercentageBetMessage,
  composeOddsChangeBetMessage,
  composeDriftedBet,
};
