/* eslint-disable no-case-declarations */
/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
const fs = require('fs');
const { addZeroes, getOddsBelowOpeningValue } = require('./utils/utils');
const db = require('./models/db');
const Odds = require('./models/odds');
const ValueBet = require('./models/valueBet');

const limitPercentage = 1.08;
const topPercentage = 1.5;
const maxOddValue = 25;
const valueBetLimit = 1.015;
const minimunBookiesWithOddsBelowOpening = 3;

const moneyline = (moneyLine) => {
  const {
    localOrDraw, awayOrDraw, awayAvg, localAvg, drawAvg,
  } = moneyLine;
  if ((1 / localOrDraw) + (1 / awayAvg) + (1 / drawAvg) <= valueBetLimit) return (1 / localOrDraw) + (1 / awayAvg) + (1 / drawAvg);
  if ((1 / awayOrDraw) + (1 / localAvg) + (1 / drawAvg) <= valueBetLimit) return (1 / awayOrDraw) + (1 / localAvg) + (1 / drawAvg);
};
const doubleChance = (doubleChanceLine, moneyLine) => {
  const {
    localOrDraw, awayOrDraw,
  } = doubleChanceLine;
  if ((1 / localOrDraw) + (1 / moneyLine.awayAvg) <= valueBetLimit) return (1 / localOrDraw) + (1 / moneyLine.awayAvg);
  if ((1 / awayOrDraw) + (1 / moneyLine.localAvg) <= valueBetLimit) return (1 / awayOrDraw) + (1 / moneyLine.localAvg);
  return false;
};
const drawNoBet = (dnb) => {
  const {
    localWinDnb, localWinDnbAvg, awayWinDnb, awayWinDnbAvgs,
  } = dnb;
  if ((1 / localWinDnb) + (1 / awayWinDnbAvgs) <= valueBetLimit) return (1 / localWinDnb) + (1 / awayWinDnbAvgs);
  if ((1 / awayWinDnb) + (1 / localWinDnbAvg) <= valueBetLimit) return (1 / awayWinDnb) + (1 / localWinDnbAvg);
  return false;
};
const bothTeamsScore = (match) => {
  const {
    bothScoreYes, bothScoreYesAvg, bothScoreNo, bothScoreNoAvg,
  } = match;
  if ((1 / bothScoreYes) + (1 / bothScoreNoAvg) <= valueBetLimit) return (1 / bothScoreYes) + (1 / bothScoreNoAvg);
  if ((1 / bothScoreNo) + (1 / bothScoreYesAvg) <= valueBetLimit) return (1 / bothScoreNo) + (1 / bothScoreYesAvg);
  return false;
};
const overUnderGoals = (lines) => {
  const valueBets = lines.reduce((list, line) => {
    const {
      overGoals, underGoals, underGoalsAvg, overGoalsAvg,
    } = line._bet365;
    if (overGoals < 13 && ((1 / overGoals) + (1 / underGoalsAvg) <= valueBetLimit)) list.push({ ...line._bet365, valueRatio: (1 / overGoals) + (1 / underGoalsAvg) });
    if (underGoals < 13 && ((1 / underGoals) + (1 / overGoalsAvg) <= valueBetLimit)) list.push({ ...line._bet365, valueRatio: (1 / underGoals) + (1 / overGoalsAvg) });
    return list;
  }, []);
  return valueBets;
};
const asianHandicap = (lines) => {
  const valueBets = lines.reduce((list, line) => {
    const {
      localAH, awayAH, localAHAvg, awayAHAvg
    } = line._bet365;

    if (localAH < 13 && ((1 / localAH) + (1 / awayAHAvg) <= valueBetLimit)) list.push({ ...line._bet365, valueRatio: (1 / localAH) + (1 / awayAHAvg) });
    if (awayAH < 13 && ((1 / awayAH) + (1 / localAHAvg) <= valueBetLimit)) list.push({ ...line._bet365, valueRatio: (1 / awayAH) + (1 / localAHAvg) });
    return list;
  }, []);
  return valueBets;
}

const composeValueBetLine = (match, line, path, valueRatio, options) => ({
  match: match.match, date: match.date, line, url: match.url + path, valueRatio, ...options
});


const moneyline4Bookies = ({ _Pinnacle, _bet365, _Marathonbet, _1xBet, _188BET }) => {
  const bookiesLocalWinAvg = (_Pinnacle.localWin + _Marathonbet.localWin + _1xBet.localWin + _188BET.localWin) / 4;
  const bookiesAwayWinAvg = (_Pinnacle.awayWin + _Marathonbet.awayWin + _1xBet.awayWin + _188BET.awayWin) / 4;
  if (_Pinnacle.localWin < _bet365.localWin && (bookiesLocalWinAvg * valueBetLimit) < _bet365.localWin)
    return true
  if (_Pinnacle.awayWin < _bet365.awayWin && (bookiesAwayWinAvg * valueBetLimit) < _bet365.awayWin)
    return true
};
const moneyLine5Bookies = ({ _Pinnacle, _bet365, _Marathonbet, _1xBet, _188BET }) => {

  const bookiesLocalWinAvg = (_Pinnacle.localWin + _Marathonbet.localWin + _1xBet.localWin + _188BET.localWin) / 4;
  const bookiesAwayWinAvg = (_Pinnacle.awayWin + _Marathonbet.awayWin + _1xBet.awayWin + _188BET.awayWin) / 4;

  let currentOddsBelowOrigianlLocal = getOddsBelowOpeningValue('localWin', 'localOpeningOdds', _188BET, _1xBet, _Marathonbet, _Pinnacle);
  if (currentOddsBelowOrigianlLocal >= minimunBookiesWithOddsBelowOpening && _Pinnacle.localWin < _bet365.localWin && (bookiesLocalWinAvg * valueBetLimit) < _bet365.localWin)
    return true;

  let currentOddsBelowOrigianlAway = getOddsBelowOpeningValue('awayWin', 'awayOpeningOdds', _188BET, _1xBet, _Marathonbet, _Pinnacle);
  if (currentOddsBelowOrigianlAway >= minimunBookiesWithOddsBelowOpening && _Pinnacle.awayWin < _bet365.awayWin && (bookiesAwayWinAvg * valueBetLimit) < _bet365.awayWin)
    return true;
}
const drawNoBet4Bookies = ({ _Pinnacle, _bet365, _Marathonbet, _1xBet, _188BET }) => {
  const bookiesLocalDnbWinAvg = (_Pinnacle.localWinDnb + _Marathonbet.localWinDnb + _1xBet.localWinDnb + _188BET.localWinDnb) / 4;
  const bookiesAwayDnbWinAvg = (_Pinnacle.awayWinDnb + _Marathonbet.awayWinDnb + _1xBet.awayWinDnb + _188BET.awayWinDnb) / 4;
  if (_Pinnacle.localWinDnb < _bet365.localWinDnb && (bookiesLocalDnbWinAvg * valueBetLimit) < _bet365.localWinDnb)
    return true
  if (_Pinnacle.awayWinDnb < _bet365.awayWinDnb && (bookiesAwayDnbWinAvg * valueBetLimit) < _bet365.awayWinDnb)
    return true
}
const drawNoBet5Bookies = ({ _Pinnacle, _bet365, _Marathonbet, _1xBet, _188BET }) => {

  const bookiesLocalDnbWinAvg = (_Pinnacle.localWinDnb + _Marathonbet.localWinDnb + _1xBet.localWinDnb + _188BET.localWinDnb) / 4;
  const bookiesAwayDnbWinAvg = (_Pinnacle.awayWinDnb + _Marathonbet.awayWinDnb + _1xBet.awayWinDnb + _188BET.awayWinDnb) / 4;

  let currentOddsBelowOrigianlLocalDnb = getOddsBelowOpeningValue('localWinDnb', 'localOpeningOdds', _188BET, _1xBet, _Marathonbet, _Pinnacle);
  if (currentOddsBelowOrigianlLocalDnb >= minimunBookiesWithOddsBelowOpening && _Pinnacle.localWinDnb < _bet365.localWinDnb && (bookiesLocalDnbWinAvg * valueBetLimit) < _bet365.localWinDnb)
    return true

  let currentOddsBelowOrigianlAwayDnb = getOddsBelowOpeningValue('awayWinDnb', 'awayOpeningOdds', _188BET, _1xBet, _Marathonbet, _Pinnacle);
  if (currentOddsBelowOrigianlAwayDnb >= minimunBookiesWithOddsBelowOpening && _Pinnacle.awayWinDnb < _bet365.awayWinDnb && (bookiesAwayDnbWinAvg * valueBetLimit) < _bet365.awayWinDnb)
    return true


}
const doubleChance4Bookies = ({ _Pinnacle, _bet365, _Marathonbet, _1xBet, _188BET }) => {
  const bookiesLocalWinOrDrawAvg = (_Pinnacle.localOrDraw + _Marathonbet.localOrDraw + _1xBet.localOrDraw + _188BET.localOrDraw) / 4;
  const bookiesLocalAwayOrDrawAvg = (_Pinnacle.awayOrDraw + _Marathonbet.awayOrDraw + _1xBet.awayOrDraw + _188BET.awayOrDraw) / 4;
  if (_Pinnacle.localOrDraw < _bet365.localOrDraw && (bookiesLocalWinOrDrawAvg * valueBetLimit) < _bet365.localOrDraw)
    return true
  if (_Pinnacle.awayOrDraw < _bet365.awayOrDraw && (bookiesLocalAwayOrDrawAvg * valueBetLimit) < _bet365.awayOrDraw)
    return true
}
const doubleChance5Bookies = ({ _Pinnacle, _bet365, _Marathonbet, _1xBet, _188BET }) => {
  const bookiesLocalWinOrDrawAvg = (_Pinnacle.localOrDraw + _Marathonbet.localOrDraw + _1xBet.localOrDraw + _188BET.localOrDraw) / 4;
  const bookiesLocalAwayOrDrawAvg = (_Pinnacle.awayOrDraw + _Marathonbet.awayOrDraw + _1xBet.awayOrDraw + _188BET.awayOrDraw) / 4;

  let currentOddsBelowOrigianlLocalDC = getOddsBelowOpeningValue('localOrDraw', 'localOpeningOdds', _188BET, _1xBet, _Marathonbet, _Pinnacle);
  if (currentOddsBelowOrigianlLocalDC >= minimunBookiesWithOddsBelowOpening && _Pinnacle.localOrDraw < _bet365.localOrDraw && (bookiesLocalWinOrDrawAvg * valueBetLimit) < _bet365.localOrDraw)
    return true

  let currentOddsBelowOrigianlAwayDC = getOddsBelowOpeningValue('awayOrDraw', 'awayOpeningOdds', _188BET, _1xBet, _Marathonbet, _Pinnacle);
  if (currentOddsBelowOrigianlAwayDC >= minimunBookiesWithOddsBelowOpening && _Pinnacle.awayOrDraw < _bet365.awayOrDraw && (bookiesLocalAwayOrDrawAvg * valueBetLimit) < _bet365.awayOrDraw)
    return true
}
const bothTeamsScore4Bookies = ({ _Pinnacle, _bet365, _Marathonbet, _1xBet, _188BET }) => {
  const bothScoreYesAvg = (_Pinnacle.bothScoreYes + _Marathonbet.bothScoreYes + _1xBet.bothScoreYes + _188BET.bothScoreYes) / 4;
  const bothScoreNoAvg = (_Pinnacle.bothScoreNo + _Marathonbet.bothScoreNo + _1xBet.bothScoreNo + _188BET.bothScoreNo) / 4;
  if (_Pinnacle.bothScoreYes < _bet365.bothScoreYes && (bothScoreYesAvg * valueBetLimit) < _bet365.bothScoreYes)
    return true
  if (_Pinnacle.bothScoreNo < _bet365.bothScoreNo && (bothScoreNoAvg * valueBetLimit) < _bet365.bothScoreNo)
    return true
}
const bothTeamsScore5Bookies = ({ _Pinnacle, _bet365, _Marathonbet, _1xBet, _188BET }) => {
  const bothScoreYesAvg = (_Pinnacle.bothScoreYes + _Marathonbet.bothScoreYes + _1xBet.bothScoreYes + _188BET.bothScoreYes) / 4;
  const bothScoreNoAvg = (_Pinnacle.bothScoreNo + _Marathonbet.bothScoreNo + _1xBet.bothScoreNo + _188BET.bothScoreNo) / 4;

  let currentOddsBelowOrigianlbothScoreYes = getOddsBelowOpeningValue('bothScoreYes', 'btsYesOpeningOdds', _188BET, _1xBet, _Marathonbet, _Pinnacle);
  if (currentOddsBelowOrigianlbothScoreYes >= minimunBookiesWithOddsBelowOpening && _Pinnacle.bothScoreYes < _bet365.bothScoreYes && (bothScoreYesAvg * valueBetLimit) < _bet365.bothScoreYes)
    return true

  let currentOddsBelowOrigianlbothScoreNo = getOddsBelowOpeningValue('bothScoreNo', 'btsNoOpeningOdds', _188BET, _1xBet, _Marathonbet, _Pinnacle);
  if (currentOddsBelowOrigianlbothScoreNo >= minimunBookiesWithOddsBelowOpening && _Pinnacle.bothScoreNo < _bet365.bothScoreNo && (bothScoreNoAvg * valueBetLimit) < _bet365.bothScoreNo)
    return true
}
const overUnderGoals4Bookies = (lines) => {
  const valueBets = lines.reduce((list, line) => {
    const {
      _Pinnacle, _bet365, _Marathonbet, _1xBet, _188BET
    } = line;
    const bookiesOverGoalsAvg = (_Pinnacle.overGoals + _Marathonbet.overGoals + _1xBet.overGoals + _188BET.overGoals) / 4;
    const bookiesUnderGoalsAvg = (_Pinnacle.underGoals + _Marathonbet.underGoals + _1xBet.underGoals + _188BET.underGoals) / 4;
    if (_Pinnacle.overGoals < _bet365.overGoals && (bookiesOverGoalsAvg * valueBetLimit) < _bet365.overGoals)
      list.push(_bet365);
    if (_Pinnacle.underGoals < _bet365.underGoals && (bookiesUnderGoalsAvg * valueBetLimit) < _bet365.underGoals)
      list.push(_bet365);
    return list;
  }, []);
  return valueBets;
};
const overUnderGoals5Bookies = (lines) => {
  const valueBets = lines.reduce((list, line) => {
    const {
      _Pinnacle, _bet365, _Marathonbet, _1xBet, _188BET
    } = line;

    const bookiesOverGoalsAvg = (_Pinnacle.overGoals + _Marathonbet.overGoals + _1xBet.overGoals + _188BET.overGoals) / 4;
    const bookiesUnderGoalsAvg = (_Pinnacle.underGoals + _Marathonbet.underGoals + _1xBet.underGoals + _188BET.underGoals) / 4;

    let currentOddsBelowOrigianlOverGoals = getOddsBelowOpeningValue('overGoals', 'overGoalsOpeningOdds', _188BET, _1xBet, _Marathonbet, _Pinnacle);
    if (currentOddsBelowOrigianlOverGoals >= minimunBookiesWithOddsBelowOpening && _Pinnacle.overGoals < _bet365.overGoals && (bookiesOverGoalsAvg * valueBetLimit) < _bet365.overGoals)
      list.push(_bet365);

    let currentOddsBelowOrigianlUnderGoals = getOddsBelowOpeningValue('underGoals', 'underGoalsOpeningOdds', _188BET, _1xBet, _Marathonbet, _Pinnacle);
    if (currentOddsBelowOrigianlUnderGoals >= minimunBookiesWithOddsBelowOpening && _Pinnacle.underGoals < _bet365.underGoals && (bookiesUnderGoalsAvg * valueBetLimit) < _bet365.underGoals)
      list.push(_bet365);
    return list;
  }, []);
  return valueBets;
};
const overAH4Bookies = (lines) => {
  const valueBets = lines.reduce((list, line) => {
    const {
      _Pinnacle, _bet365, _Marathonbet, _1xBet, _188BET
    } = line;
    const bookiesLocalAHAvg = (_Pinnacle.localAH + _Marathonbet.localAH + _1xBet.localAH + _188BET.localAH) / 4;
    const bookiesAwayAHAvg = (_Pinnacle.awayAH + _Marathonbet.awayAH + _1xBet.awayAH + _188BET.awayAH) / 4;
    if (_Pinnacle.localAH < _bet365.localAH && (bookiesLocalAHAvg * valueBetLimit) < _bet365.localAH)
      list.push(_bet365);
    if (_Pinnacle.awayAH < _bet365.awayAH && (bookiesAwayAHAvg * valueBetLimit) < _bet365.awayAH)
      list.push(_bet365);
    return list;
  }, []);
  return valueBets;
}
const overAH5Bookies = (lines) => {
  const valueBets = lines.reduce((list, line) => {
    const {
      _Pinnacle, _bet365, _Marathonbet, _1xBet, _188BET
    } = line;

    const bookiesLocalAHAvg = (_Pinnacle.localAH + _Marathonbet.localAH + _1xBet.localAH + _188BET.localAH) / 4;
    const bookiesAwayAHAvg = (_Pinnacle.awayAH + _Marathonbet.awayAH + _1xBet.awayAH + _188BET.awayAH) / 4;

    let currentOddsBelowOrigianlOverGoals = getOddsBelowOpeningValue('localAH', 'localAHOpeningOdds', _188BET, _1xBet, _Marathonbet, _Pinnacle);
    if (currentOddsBelowOrigianlOverGoals >= minimunBookiesWithOddsBelowOpening && _Pinnacle.localAH < _bet365.localAH && (bookiesLocalAHAvg * valueBetLimit) < _bet365.localAH)
      list.push(_bet365);

    let currentOddsBelowOrigianlUnderGoals = getOddsBelowOpeningValue('awayAH', 'awayAHOpeningOdds', _188BET, _1xBet, _Marathonbet, _Pinnacle);
    if (currentOddsBelowOrigianlUnderGoals >= minimunBookiesWithOddsBelowOpening && _Pinnacle.awayAH < _bet365.awayAH && (bookiesAwayAHAvg * valueBetLimit) < _bet365.awayAH)
      list.push(_bet365);
    return list;
  }, []);
  return valueBets;
}


const newStart = async () => {
  try {
    const args = process.argv.slice(2);
    db.connect();

    const matches = await Odds.find({});
    const valueBets = [];
    matches.forEach((match) => {
      if (match.moneyLine) {
        const valueRatio = moneyline(match.moneyLine._bet365, match.dnb);
        if (valueRatio) valueBets.push(composeValueBetLine(match, 'moneyline', '', valueRatio));
      }
      if (match.dnb) {
        const valueRatio = drawNoBet(match.dnb._bet365);
        if (valueRatio) valueBets.push(composeValueBetLine(match, 'dnb', '#dnb;2', valueRatio));
      }
      if (match.doubleChance) {
        const valueRatio = doubleChance(match.doubleChance._bet365, match.moneyLine);
        if (valueRatio) valueBets.push(composeValueBetLine(match, 'DC', '#double;2', valueRatio));
      }
      if (match.bts) {
        const valueRatio = bothTeamsScore(match.bts._bet365);
        if (valueRatio) valueBets.push(composeValueBetLine(match, 'bts', '#bts;2', valueRatio));
      }
      if (match.overUnder.length > 0) {
        const overUnderLines = overUnderGoals(match.overUnder);
        overUnderLines.forEach((line) => valueBets.push(composeValueBetLine(match, 'O/U', `#over-under;2;${addZeroes(line.numOfGoals)};0`, line.valueRatio, { lineValue: line.numOfGoals })));
      }
      if (match.asianHandicap.length > 0) {
        const asianHandicapLines = asianHandicap(match.asianHandicap);
        asianHandicapLines.forEach((line) => valueBets.push(composeValueBetLine(match, 'AH', `#ah;2;${addZeroes(line.handicap)};0`, line.valueRatio, { lineValue: line.handicap })));
      }
    });

    // Save result to db
    await saveToDatabase(valueBets);

    const data = JSON.stringify(valueBets);
    fs.writeFileSync(`./value_bets/${Date.now()}_valuebets.json`, data);
  } catch (error) {
    console.log('Error: ', error);
  } finally {
    db.close();
  }
};
const start = async () => {
  try {
    db.connect();

    const matches = await Odds.find({});
    const valueBets = [];
    matches.forEach((match) => {
      if (match.moneyLine) {
        const valueRatio = moneyLine5Bookies(match.moneyLine);
        if (valueRatio) valueBets.push(composeValueBetLine(match, 'moneyline', '', valueRatio));
      }
      if (match.dnb) {
        const valueRatio = drawNoBet5Bookies(match.dnb);
        if (valueRatio) valueBets.push(composeValueBetLine(match, 'dnb', '#dnb;2', valueRatio));
      }
      if (match.doubleChance) {
        const valueRatio = doubleChance5Bookies(match.doubleChance, match.doubleChance);
        if (valueRatio) valueBets.push(composeValueBetLine(match, 'DC', '#double;2', valueRatio));
      }
      if (match.bts) {
        const valueRatio = bothTeamsScore5Bookies(match.bts);
        if (valueRatio) valueBets.push(composeValueBetLine(match, 'bts', '#bts;2', valueRatio));
      }
      if (match.overUnder.length > 0) {
        const overUnderLines = overUnderGoals5Bookies(match.overUnder);
        overUnderLines.forEach((line) => valueBets.push(composeValueBetLine(match, 'O/U', `#over-under;2;${addZeroes(line.numOfGoals)};0`, line.valueRatio)));
      }
      if (match.asianHandicap.length > 0) {
        const asianHandicapLines = overAH5Bookies(match.asianHandicap);
        asianHandicapLines.forEach((line) => valueBets.push(composeValueBetLine(match, 'AH', `#ah;2;${addZeroes(line.handicap)};0`, line.valueRatio)));
      }
    });

    // Save result to db
    await saveToDatabase(valueBets);

    //save result to .json file
    const data = JSON.stringify(valueBets);
    fs.writeFileSync(`./value_bets/${Date.now()}_valuebets.json`, data);
  } catch (error) {
    console.log('Error: ', error);
  } finally {
    db.close();
  }
};
newStart();


async function saveToDatabase(valueBets) {
  const promises = [];
  valueBets.forEach(bet => {
    const filterOptions = { match: bet.match, line: bet.line };
    if (bet.line === 'AH' || bet.line === 'O/U')
      filterOptions.line = bet.line;
    promises.push(ValueBet.findOneAndUpdate(filterOptions, bet, { upsert: true, setDefaultsOnInsert: true }));
  });
  await Promise.all(promises);
}
// start();


