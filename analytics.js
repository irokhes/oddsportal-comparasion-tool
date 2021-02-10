/* eslint-disable no-case-declarations */
/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
const fs = require('fs');
const { addZeroes, getOddsBelowOpeningValue } = require('./utils/utils');
const db = require('./models/db');
const Odds = require('./models/odds');
const ValueBet = require('./models/valueBet');
const { sendHtmlMessage, sendMessage } = require('./telegram');
const { composeNewValueBetMessage } = require('./utils/messages');

const limitPercentage = 1.08;
const topPercentage = 1.5;
const maxOddValue = 25;
const valueBetLimit = 1.015;
const minimunBookiesWithOddsBelowOpening = 3;

const moneyline = (moneyLine, doubleChance) => {
  const {
    localWin, awayWin, awayWinAvg, localWinAvg, drawAvg,
  } = moneyLine;
  let localAvg = doubleChance && doubleChance.localWinAvg ? (1 / doubleChance.localWinAvg) : (1 / localWinAvg) + (1 / drawAvg);
  let awayAvg = doubleChance && doubleChance.awayWinAvg ? (1 / doubleChance.awayWinAvg) : (1 / awayWinAvg) + (1 / drawAvg);

  if ((1 / localWin) + awayAvg <= valueBetLimit) return (1 / localWin) + awayAvg;
  if ((1 / awayWin) + localAvg <= valueBetLimit) return (1 / awayWin) + localAvg;
};
const doubleChance = (doubleChanceLine, moneyLine) => {
  const {
    localwin, awayWin,
  } = doubleChanceLine;
  if (!moneyLine) return false
  if ((1 / localwin) + (1 / moneyLine.awayWinAvg) <= valueBetLimit) return (1 / localwin) + (1 / moneyLine.awayWinAvg);
  if ((1 / awayWin) + (1 / moneyLine.localWinAvg) <= valueBetLimit) return (1 / awayWin) + (1 / moneyLine.localWinAvg);
  return false;
};
const drawNoBet = (dnb) => {
  const {
    localWin, localWinAvg, awayWin, awayWinAvg,
  } = dnb;
  if ((1 / localWin) + (1 / awayWinAvg) <= valueBetLimit) return (1 / localWin) + (1 / awayWinAvg);
  if ((1 / awayWin) + (1 / localWinAvg) <= valueBetLimit) return (1 / awayWin) + (1 / localWinAvg);
  return false;
};
const bothTeamsScore = (match) => {
  const {
    localWin, localWinAvg, awayWin, awayWinAvg,
  } = match;
  if ((1 / localWin) + (1 / awayWinAvg) <= valueBetLimit) return (1 / localWin) + (1 / awayWinAvg);
  if ((1 / awayWin) + (1 / localWinAvg) <= valueBetLimit) return (1 / awayWin) + (1 / localWinAvg);
  return false;
};
const overUnderGoals = (lines) => {
  const valueBets = lines.reduce((list, line) => {
    const {
      overOdds, underOdds, underOddsAvg, overOddsAvg,
    } = line;
    if (overOdds < 13 && ((1 / overOdds) + (1 / underOddsAvg) <= valueBetLimit)) list.push({ ...line, valueRatio: (1 / overOdds) + (1 / underOddsAvg) });
    if (underOdds < 13 && ((1 / underOdds) + (1 / overOddsAvg) <= valueBetLimit)) list.push({ ...line, valueRatio: (1 / underOdds) + (1 / overOddsAvg) });
    return list;
  }, []);
  return valueBets;
};
const asianHandicap = (lines) => {
  const valueBets = lines.reduce((list, line) => {
    const {
      overOdds, underOdds, overOddsAvg, underOddsAvg
    } = line;

    if (overOdds < 13 && ((1 / overOdds) + (1 / underOddsAvg) <= valueBetLimit)) list.push({ ...line, valueRatio: (1 / overOdds) + (1 / underOddsAvg) });
    if (underOdds < 13 && ((1 / underOdds) + (1 / overOddsAvg) <= valueBetLimit)) list.push({ ...line, valueRatio: (1 / underOdds) + (1 / overOddsAvg) });
    return list;
  }, []);
  return valueBets;
}

const composeValueBetLine = (match, line, path, valueRatio, lineValue) => ({
  match: match.match, date: match.date, line, url: match.url + path, valueRatio, lineValue
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


async function saveToDatabase(valueBets) {
  const promises = [];
  valueBets.forEach(bet => {
    const filterOptions = { match: bet.match, line: bet.line };
    if (bet.line === 'AH' || bet.line === 'O/U')
      filterOptions.line = bet.line;
    promises.push(ValueBet.findOneAndUpdate(filterOptions, bet, { upsert: true, setDefaultsOnInsert: true, rawResult: true, new: true }));
  });
  return (await Promise.all(promises)).reduce((newValueBets, result) => {
    if (result.lastErrorObject.updatedExisting === false) {
      newValueBets.push({ match: result.value.match, date: result.value.date, url: result.value.url, line: result.value.line, valueRatio: result.value.valueRatio })
    }
    return newValueBets;
  }, []);
}
const start = async () => {
  try {
    const args = process.argv.slice(2);
    db.connect();
    // sendMessage();
    const matches = await Odds.find({});
    const valueBets = [];
    matches.forEach((match) => {
      if (match.moneyLine) {
        const valueRatio = moneyline(match.moneyLine, match.doubleChance);
        if (valueRatio) valueBets.push(composeValueBetLine(match, 'moneyline', '', valueRatio));
      }
      if (match.dnb) {
        const valueRatio = drawNoBet(match.dnb);
        if (valueRatio) valueBets.push(composeValueBetLine(match, 'dnb', '#dnb;2', valueRatio));
      }
      if (match.doubleChance) {
        const valueRatio = doubleChance(match.doubleChance, match.moneyLine);
        if (valueRatio) valueBets.push(composeValueBetLine(match, 'DC', '#double;2', valueRatio));
      }
      if (match.bts) {
        const valueRatio = bothTeamsScore(match.bts);
        if (valueRatio) valueBets.push(composeValueBetLine(match, 'bts', '#bts;2', valueRatio));
      }
      if (match.overUnder.length > 0) {
        const overUnderLines = overUnderGoals(match.overUnder);
        overUnderLines.forEach((line) => valueBets.push(composeValueBetLine(match, 'O/U', `#over-under;2;${addZeroes(line.line)};0`, line.valueRatio, line.line)));
      }
      if (match.asianHandicap.length > 0) {
        const asianHandicapLines = asianHandicap(match.asianHandicap);
        asianHandicapLines.forEach((line) => valueBets.push(composeValueBetLine(match, 'AH', `#ah;2;${addZeroes(line.line)};0`, line.valueRatio, line.line)));
      }
    });

    // Save result to db
    const newValueBets = await saveToDatabase(valueBets);
    const promises = [];
    newValueBets.forEach(valueBet => {
      console.log(valueBet);
      promises.push(sendHtmlMessage(composeNewValueBetMessage(valueBet)));
    })
    await Promise.all(promises)


    //save result to .json file
    const data = JSON.stringify(valueBets);
    fs.writeFileSync(`./value_bets/${Date.now()}_valuebets.json`, data);
  } catch (error) {
    console.log('Error: ', error);
  } finally {
    db.close();
  }
};

start();


