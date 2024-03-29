/* eslint-disable max-len */
const composeNewValueBetMessage = (valueBet) => {
  const line = `Linea: ${valueBet.line} ${valueBet.line === 'AH' || valueBet.line === 'O/U' ? valueBet.lineValue : ''} cuota: ${valueBet.odds}  Bet to: ${valueBet.betTo}\n`;
  const trend = valueBet.upTrend !== undefined && valueBet.downTrend !== undefined ? `Tendencia: ⬇️🔴${valueBet.downTrend}%  -  ⬆️🟢${valueBet.upTrend}%\n` : '';
  return `${line}${trend}<a href="${valueBet.url}" target="_blank">${valueBet.match}</a>\n\nValue Ratio: ${valueBet.valueRatio}\n\n Seq: ${valueBet.sequence}`;
};
const composeNewRecoBetMessage = (valueBet) => {
  const line = `Linea: ${valueBet.line} ${valueBet.line === 'AH' || valueBet.line === 'O/U' ? valueBet.lineValue : ''} cuota: ${valueBet.odds}  Bet to: ${valueBet.betTo} avg: ${valueBet.avgOdds}\n`;
  const trend = valueBet.upTrend !== undefined && valueBet.downTrend !== undefined ? `Tendencia: ⬇️🔴${valueBet.downTrend}%  -  ⬆️🟢${valueBet.upTrend}%\n` : '';
  return `${line}${trend}<a href="${valueBet.url}" target="_blank">${valueBet.match}</a>\n`;
};
const composeNewPinnacleRecoBetMessage = (valueBet) => {
  const line = `Linea: ${valueBet.line} ${valueBet.line === 'AH' || valueBet.line === 'O/U' ? valueBet.lineValue : ''} cuota: ${valueBet.odds} pinnacle: ${valueBet.pinnacleOdds} avg: ${valueBet.avgOdds} Bet to: ${valueBet.betTo}\n`;
  const trend = valueBet.upTrend !== undefined && valueBet.downTrend !== undefined ? `Tendencia: ⬇️🔴${valueBet.downTrend}%  -  ⬆️🟢${valueBet.upTrend}%\n` : '';
  return `${line}${trend}<a href="${valueBet.url}" target="_blank">${valueBet.match}</a>\n`;
};
const composeNewBet365RecoBetMessage = (valueBet) => {
  const line = `Linea: ${valueBet.line} ${valueBet.line === 'AH' || valueBet.line === 'O/U' ? valueBet.lineValue : ''} PINNA: ${valueBet.odds} BET365: ${valueBet.bet365Odds} Bet to: ${valueBet.betTo}\n`;
  const trend = valueBet.upTrend !== undefined && valueBet.downTrend !== undefined ? `Tendencia: ⬇️🔴${valueBet.downTrend}%  -  ⬆️🟢${valueBet.upTrend}%\n` : '';
  return `${line}${trend}<a href="${valueBet.url}" target="_blank">${valueBet.match}</a>\n`;
};

const composeGenericValueBet = (valueBet) => {
  const pinnacleMsg = valueBet.pinnacleOdds ? `pinnacle: ${valueBet.pinnacleOdds}` : '';
  const line = `Linea: ${valueBet.line} ${valueBet.line === 'AH' || valueBet.line === 'O/U' ? valueBet.lineValue : ''} cuota: ${valueBet.odds} ${pinnacleMsg} avg: ${valueBet.avgOdds} Bet to: ${valueBet.betTo}\n`;
  const trend = valueBet.upTrend !== undefined && valueBet.downTrend !== undefined ? `Tendencia: ⬇️🔴${valueBet.downTrend}%  -  ⬆️🟢${valueBet.upTrend}%\n` : '';
  return `${line}${trend}<a href="${valueBet.url}" target="_blank">${valueBet.match}</a>\n`;
};

const composeNewPercentageBetMessage = (valueBet) => `PERCENTAGE\n\nLinea: ${valueBet.line}\n\n<a href="${valueBet.url}" target="_blank">${valueBet.match}</a>\n\nValue Percentage: ${valueBet.percentage}\n\n`;
const composeDriftedBet = (driftedBet) => `Diferencia entre lineas AH ${driftedBet.lineValue}  ${driftedBet.dnb ? driftedBet.dnbOdds : driftedBet.dcOdds}\n\n<a href="${driftedBet.url}" target="_blank">${driftedBet.match}</a>\n\n`;
const composeOddsChangeBetMessage = (bet, result) => (result.oddsChange
  ? `La linea ${bet.line} ha cambiado ${result.oddsChange}\n\n<a href="${bet.url}" target="_blank">${bet.match}</a>\n\n`
  : `OJO! ha subido la media ${result.avgOddsChange} de la linea ${bet.line} ${bet.line === 'AH' || bet.line === 'O/U' ? bet.lineValue : ''} \n\n<a href="${bet.url}" target="_blank">${bet.match}</a>\n\n`);
module.exports = {
  composeNewValueBetMessage,
  composeNewRecoBetMessage,
  composeNewPinnacleRecoBetMessage,
  composeNewPercentageBetMessage,
  composeOddsChangeBetMessage,
  composeDriftedBet,
  composeGenericValueBet,
  composeNewBet365RecoBetMessage,
};
