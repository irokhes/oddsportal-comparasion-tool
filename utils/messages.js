/* eslint-disable max-len */
const composeNewValueBetMessage = (valueBet) => `Linea: ${valueBet.line} ${valueBet.line === 'AH' || valueBet.line === 'O/U' ? valueBet.lineValue : ''} cuota: ${valueBet.odds}\n\n<a href="${valueBet.url}  Bet to: ${valueBet.betTo}" target="_blank">${valueBet.match}</a>\n\nValue Ratio: ${valueBet.valueRatio}\n\n Seq: ${valueBet.sequence}`;
const composeNewPercentageBetMessage = (valueBet) => `PERCENTAGE\n\nLinea: ${valueBet.line}\n\n<a href="${valueBet.url}" target="_blank">${valueBet.match}</a>\n\nValue Percentage: ${valueBet.percentage}\n\n`;
const composeDriftedBet = (driftedBet) => `Diferencia entre lineas AH ${driftedBet.lineValue}  ${driftedBet.dnb ? driftedBet.dnbOdds : driftedBet.dcOdds}\n\n<a href="${driftedBet.url}" target="_blank">${driftedBet.match}</a>\n\n`;
const composeOddsChangeBetMessage = (bet, result) => (result.oddsChange
  ? `La linea ${bet.line} ha cambiado ${result.oddsChange}\n\n<a href="${bet.url}" target="_blank">${bet.match}</a>\n\n`
  : `OJO! ha subido la media ${result.avgOddsChange} de la linea ${bet.line} ${bet.line === 'AH' || bet.line === 'O/U' ? bet.lineValue : ''} \n\n<a href="${bet.url}" target="_blank">${bet.match}</a>\n\n`);
module.exports = {
  composeNewValueBetMessage,
  composeNewPercentageBetMessage,
  composeOddsChangeBetMessage,
  composeDriftedBet,
};
