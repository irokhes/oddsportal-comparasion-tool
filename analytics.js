/* eslint-disable no-case-declarations */
/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
const fs = require("fs");
const { addZeroes, getOddsBelowOpeningValue, round } = require("./utils/utils");
const Odds = require("./models/odds");
const ValueBet = require("./models/valueBet");
const { sendHtmlMessage, sendMessage } = require("./telegram");
const {
  composeNewValueBetMessage,
  composeDriftedBet
} = require("./utils/messages");
const CronJob = require("cron").CronJob;
const { frequency, valueBetLimit, percentageRuleLimit } = require("./config");

const moneyline = (moneyLine, doubleChance) => {
  const { localWin, awayWin, awayWinAvg, localWinAvg, drawAvg } = moneyLine;
  let localAvg =
    doubleChance && doubleChance.localWinAvg
      ? 1 / doubleChance.localWinAvg
      : 1 / localWinAvg + 1 / drawAvg;
  let awayAvg =
    doubleChance && doubleChance.awayWinAvg
      ? 1 / doubleChance.awayWinAvg
      : 1 / awayWinAvg + 1 / drawAvg;

  if (1 / localWin + awayAvg <= valueBetLimit)
    return {
      valueRatio: round(1 / localWin + awayAvg, 3),
      betTo: "local",
      odds: localWin,
      avgOdds: localAvg
    };
  if (1 / awayWin + localAvg <= valueBetLimit)
    return {
      valueRatio: round(1 / awayWin + localAvg, 3),
      betTo: "away",
      odds: awayWin,
      avgOdds: awayAvg
    };
};
const percentageRule = line => {
  const { localWin, awayWin, awayWinAvg, localWinAvg } = line;
  const localBetMargin = (localWin * 100) / localWinAvg - 100;
  if (localWin < 4 && localBetMargin > percentageRuleLimit)
    return { percentage: localBetMargin };
  const awayBetMargin = (awayWin * 100) / awayWinAvg - 100;
  if (awayWin < 4 && awayBetMargin > percentageRuleLimit)
    return { percentage: awayBetMargin };
  return false;
};
const overUnderPercentageRule = lines => {
  const valueBets = lines.reduce((list, line) => {
    const { overOdds, underOdds, underOddsAvg, overOddsAvg } = line;
    const overBetMargin = (overOdds * 100) / overOddsAvg - 100;
    if (overOdds < 4 && overBetMargin > percentageRuleLimit)
      list.push({ ...line, percentage: overBetMargin });
    const underBetMargin = (underOdds * 100) / underOddsAvg - 100;
    if (underOdds < 4 && underBetMargin > percentageRuleLimit)
      list.push({ ...line, percentage: underBetMargin });
    return list;
  }, []);
  return valueBets;
};
const doubleChance = (doubleChanceLine, moneyLine) => {
  const { localWin, awayWin, localWinAvg, awayWinAvg } = doubleChanceLine;
  if (!moneyLine) return false;
  if (1 / localWin + 1 / moneyLine.awayWinAvg <= valueBetLimit)
    return {
      valueRatio: round(1 / localWin + 1 / moneyLine.awayWinAvg, 3),
      betTo: "local",
      odds: localWin,
      avgOdds: localWinAvg
    };
  if (1 / awayWin + 1 / moneyLine.localWinAvg <= valueBetLimit)
    return {
      valueRatio: round(1 / awayWin + 1 / moneyLine.localWinAvg, 3),
      betTo: "local",
      odds: awayWin,
      avgOdds: awayWinAvg
    };
  return false;
};
const drawNoBet = dnb => {
  const { localWin, localWinAvg, awayWin, awayWinAvg } = dnb;
  if (1 / localWin + 1 / awayWinAvg <= valueBetLimit)
    return {
      valueRatio: round(1 / localWin + 1 / awayWinAvg, 3),
      betTo: "local",
      odds: localWin,
      avgOdds: localWinAvg
    };
  if (1 / awayWin + 1 / localWinAvg <= valueBetLimit)
    return {
      valueRatio: round(1 / awayWin + 1 / localWinAvg, 3),
      betTo: "away",
      odds: awayWin,
      avgOdds: awayWinAvg
    };
  return false;
};
const homeAway = homeAway => {
  const { localWin, localWinAvg, awayWin, awayWinAvg } = homeAway;
  if (1 / localWin + 1 / awayWinAvg <= valueBetLimit)
    return {
      valueRatio: round(1 / localWin + 1 / awayWinAvg, 3),
      betTo: "local",
      odds: localWin,
      avgOdds: localWinAvg
    };
  if (1 / awayWin + 1 / localWinAvg <= valueBetLimit)
    return {
      valueRatio: round(1 / awayWin + 1 / localWinAvg, 3),
      betTo: "away",
      odds: awayWin,
      avgOdds: awayWinAvg
    };
  return false;
};
const bothTeamsScore = match => {
  const { localWin, localWinAvg, awayWin, awayWinAvg } = match;
  if (1 / localWin + 1 / awayWinAvg <= valueBetLimit)
    return {
      valueRatio: round(1 / localWin + 1 / awayWinAvg, 3),
      betTo: "local",
      odds: localWin,
      avgOdds: localWinAvg
    };
  if (1 / awayWin + 1 / localWinAvg <= valueBetLimit)
    return {
      valueRatio: round(1 / awayWin + 1 / localWinAvg, 3),
      betTo: "away",
      odds: awayWin,
      avgOdds: awayWinAvg
    };
  return false;
};
const overUnderGoals = lines => {
  const valueBets = lines.reduce((list, line) => {
    const { overOdds, underOdds, underOddsAvg, overOddsAvg } = line;
    if (overOdds < 13 && 1 / overOdds + 1 / underOddsAvg <= valueBetLimit)
      list.push({
        ...line,
        valueRatio: round(1 / overOdds + 1 / underOddsAvg, 3),
        betTo: "local",
        odds: overOdds,
        avgOdds: overOddsAvg
      });
    if (underOdds < 13 && 1 / underOdds + 1 / overOddsAvg <= valueBetLimit)
      list.push({
        ...line,
        valueRatio: round(1 / underOdds + 1 / overOddsAvg, 3),
        betTo: "away",
        odds: underOdds,
        avgOdds: underOddsAvg
      });
    return list;
  }, []);
  return valueBets;
};
const asianHandicap = lines => {
  const valueBets = lines.reduce((list, line) => {
    const { overOdds, underOdds, overOddsAvg, underOddsAvg } = line;

    if (overOdds < 13 && 1 / overOdds + 1 / underOddsAvg <= valueBetLimit)
      list.push({
        ...line,
        valueRatio: round(1 / overOdds + 1 / underOddsAvg, 3),
        betTo: "local",
        odds: overOdds,
        avgOdds: overOddsAvg
      });
    if (underOdds < 13 && 1 / underOdds + 1 / overOddsAvg <= valueBetLimit)
      list.push({
        ...line,
        valueRatio: round(1 / underOdds + 1 / overOddsAvg, 3),
        betTo: "away",
        odds: underOdds,
        avgOdds: underOddsAvg
      });
    return list;
  }, []);
  return valueBets;
};

const composeValueBetLine = (match, line, path, valueBet, lineValue) => ({
  match: match.match,
  date: match.date,
  line,
  lineValue,
  url: match.url + path,
  valueRatio: valueBet.valueRatio,
  betTo: valueBet.betTo,
  odds: valueBet.odds,
  avgOdds: valueBet.avgOdds
});
const composePercentageBetLine = (match, line, path, valueBet, lineValue) => ({
  match: match.match,
  date: match.date,
  line,
  lineValue,
  url: match.url + path,
  percentage: valueBet.percentage,
  betTo: valueBet.betTo,
  odds: valueBet.odds,
  avgOdds: valueBet.avgOdds
});

async function saveValueBetsToDatabase(valueBets) {
  const promises = [];
  const newValueBets = [];
  const improvedLines = [];
  const entriesToNotify = [];
  for (let index = 0; index < valueBets.length; index++) {
    const bet = valueBets[index];

    const filterOptions = { match: bet.match, line: bet.line };
    if (bet.line === "AH" || bet.line === "O/U") filterOptions.line = bet.line;
    let vb = await ValueBet.findOne(filterOptions);

    if (vb) {
      if (!vb.bet && vb.valueRatio > bet.valueRatio)
        console.log(
          `line improved old ${vb.valueRatio} new ${bet.valueRatio}  ${bet.url}`
        );
      // if (vb.valueRatio - bet.valueRatio >= 0.02) entriesToNotify.push(vb._id.toString());
      vb.valueRatio = bet.valueRatio;
    } else {
      vb = new ValueBet(bet);
      entriesToNotify.push(vb._id.toString());
    }
    promises.push(vb.save());
  }
  (await Promise.all(promises)).forEach(valueBet => {
    if (entriesToNotify.includes(valueBet._id.toString()))
      newValueBets.push({
        match: valueBet.match,
        date: valueBet.date,
        url: valueBet.url,
        line: valueBet.line,
        valueRatio: valueBet.valueRatio,
        sequence: valueBet.sequence
      });
  });
  return newValueBets;
}
const analyzeBets = async () => {
  try {
    const matches = await Odds.find();
    const valueBets = [];
    const percentageBets = [];
    const driftedLines = [];
    matches.forEach(match => {
      valueBets.push(...getMatchValueBets(match));
      driftedLines.push(...getDriftedValueBets(match));
      // percentageBets.push(...getMatchValueBetsByPercentage(match));
    });

    // Save result to db
    const newValueBets = await saveValueBetsToDatabase(valueBets);
    const promises = [];
    newValueBets.forEach(valueBet => {
      console.log("new value bet: ", valueBet.url);
      promises.push(sendHtmlMessage(composeNewValueBetMessage(valueBet)));
    });
    driftedLines.forEach(driftedBet => {
      console.log(composeDriftedBet(driftedBet));
    });
    // percentageBets.forEach(valueBet => {
    //   console.log(`new percentage bet: ${valueBet.url} %: ${valueBet.percentage}`);
    //   promises.push(sendHtmlMessage(composeNewPercentageBetMessage(valueBet)));
    // })
  } catch (error) {
    console.log("Error: ", error);
  }
};

const start = () => {
  const job = new CronJob(`0 */${frequency} * * * *`, async function () {
    await analyzeBets();
  });
  job.start();
};

module.exports = { start };

function getMatchValueBetsByPercentage(match) {
  const results = [];
  if (match.moneyLine) {
    const result = percentageRule(match.moneyLine);
    if (result) results.push(composePercentageBetLine(match, "ML", "", result));
  }
  if (match.dnb) {
    const result = percentageRule(match.dnb);
    if (result)
      results.push(composePercentageBetLine(match, "DNB", "#dnb", result));
  }
  if (match.doubleChance) {
    const result = percentageRule(match.doubleChance);
    if (result)
      results.push(composePercentageBetLine(match, "DC", "#double", result));
  }
  if (match.bts) {
    const result = bothTeamsScore(match.bts);
    if (result)
      results.push(composePercentageBetLine(match, "BTS", "#bts", result));
  }
  if (match.overUnder.length > 0) {
    const overUnderLines = overUnderPercentageRule(match.overUnder);
    overUnderLines.forEach(line =>
      results.push(
        composePercentageBetLine(
          match,
          "O/U",
          `#over-under;${addZeroes(line.line)}`,
          line,
          line.line
        )
      )
    );
  }
  if (match.asianHandicap.length > 0) {
    const asianHandicapLines = overUnderPercentageRule(match.asianHandicap);
    asianHandicapLines.forEach(line =>
      results.push(
        composePercentageBetLine(
          match,
          "AH",
          `#ah;${addZeroes(line.line)}`,
          line,
          line.line
        )
      )
    );
  }
  return results;
}

function getMatchValueBets(match) {
  const lineDelimiterBySport = {
    football: ";2",
    basketball: ";1"
  };
  const delimiter = lineDelimiterBySport[match.sport];
  const results = [];
  if (match.moneyLine) {
    const result = moneyline(match.moneyLine, match.doubleChance);
    if (result) results.push(composeValueBetLine(match, "ML", "", result));
  }
  if (match.dnb) {
    const result = drawNoBet(match.dnb);
    if (result)
      results.push(
        composeValueBetLine(match, "DNB", `#dnb${delimiter}`, result)
      );
  }
  if (match.homeAway) {
    const result = homeAway(match.homeAway);
    if (result)
      results.push(
        composeValueBetLine(match, "HOMEAWAY", `#home-away${delimiter}`, result)
      );
  }
  if (match.doubleChance) {
    const result = doubleChance(match.doubleChance, match.moneyLine);
    if (result)
      results.push(
        composeValueBetLine(match, "DC", `#double${delimiter}`, result)
      );
  }
  if (match.bts) {
    const result = bothTeamsScore(match.bts);
    if (result)
      results.push(
        composeValueBetLine(match, "BTS", `#bts${delimiter}`, result)
      );
  }
  if (match.overUnder.length > 0) {
    const overUnderLines = overUnderGoals(match.overUnder);
    overUnderLines.forEach(line =>
      results.push(
        composeValueBetLine(
          match,
          "O/U",
          `#over-under${delimiter};${addZeroes(line.line)};0`,
          line,
          line.line
        )
      )
    );
  }
  if (match.asianHandicap.length > 0) {
    const asianHandicapLines = asianHandicap(match.asianHandicap);
    asianHandicapLines.forEach(line =>
      results.push(
        composeValueBetLine(
          match,
          "AH",
          `#ah${delimiter};${addZeroes(line.line)};0`,
          line,
          line.line
        )
      )
    );
  }
  return results;
}

function getDriftedValueBets(match) {
  const { handicap, dnb, doubleChance } = match;
  const driftedBets = [];
  const percentageLimit = 7
  // AH 0
  handicapZero = handicap.find(line => line.lineValue === '0');
  // AH +0.5
  handicapZeroPoint5 = handicap.find(line => line.lineValue === '0.5');
  // AH -0.5
  handicapMinusZeroPoint5 = handicap.find(line => line.lineValue === '-0.5');

  //averages
  const averageLocalDnbLocalAH = dnb.localWin + handicapZero.overOdds / 2;
  const differenceAsPercentage = (dnb.localWin - handicapZero / averageLocalDnbLocalAH) * 100
  if(Math.abs(differenceAsPercentage) > percentageLimit) {

    // composeDriftedBetLine(match, "DNB", result)
    driftedBets.push({match: match.match, data: match.date, url: match.url, betTo: "local", lineValue: handicapZero.lineValue, linesDifference: differenceAsPercentage, ahOdds: handicapZero.overOdds, dnbOdds: dnb.localWin})
    differenceAsPercentage > 0 ? console.log('ValueBet DNB') : console.log('ValueBet AH Local');
  }

  const averageAwayDnbLocalAH = dnb.awayWin + handicapZero.underOdds / 2;
  const differenceAsPercentage = (dnb.awayWin - handicapZero / averageAwayDnbLocalAH) * 100
  if(Math.abs(differenceAsPercentage) > percentageLimit){
    driftedBets.push({match: match.match, data: match.date, url: match.url, betTo: "away", lineValue: handicapZero.lineValue, linesDifference: differenceAsPercentage, ahOdds: handicapZero.underOdds, dnbOdds: dnb.awayWin})
    differenceAsPercentage > 0 ? console.log('ValueBet DNB Away') : console.log('ValueBet AH Away');
  }

  const averageLocalDCLocalAH = doubleChance.localWin + handicapZeroPoint5.overOdds / 2;
  const differenceAsPercentage = (doubleChance.localWin - handicapZeroPoint5.overOdds / averageLocalDCLocalAH) * 100
  if(Math.abs(differenceAsPercentage) > percentageLimit){
    driftedBets.push({match: match.match, data: match.date, url: match.url, betTo: "home", lineValue: handicapZeroPoint5.lineValue, linesDifference: differenceAsPercentage, ahOdds: handicapZeroPoint5.overOdds, dcOdds: doubleChance.localWin})
    differenceAsPercentage > 0 ? console.log('ValueBet DC local') : console.log('ValueBet AH local');
  }

  const averageAwayDCAwayAH = doubleChance.awayWin + handicapMinusZeroPoint5.underOdds / 2;
  const differenceAsPercentage = (doubleChance.awayWin - handicapMinusZeroPoint5.underOdds / averageAwayDCAwayAH) * 100
  if(Math.abs(differenceAsPercentage) > percentageLimit){
    driftedBets.push({match: match.match, data: match.date, url: match.url, betTo: "away", lineValue: handicapMinusZeroPoint5.lineValue, linesDifference: differenceAsPercentage, ahOdds: handicapMinusZeroPoint5.underOdds, dcOdds: doubleChance.awayWin})
    return differenceAsPercentage > 0 ? console.log('ValueBet DC away') : console.log('ValueBet AH away');
  }


}
