/* eslint-disable max-len */
const composeNewValueBetMessage = (valueBet) => `Linea: ${valueBet.line}\n\n<a href="${valueBet.url}" target="_blank">${valueBet.match}</a>\n\nValue Ratio: ${valueBet.valueRatio}\n\n Seq: ${valueBet.sequence}`;

module.exports = { composeNewValueBetMessage };
