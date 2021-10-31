/* eslint-disable no-case-declarations */
/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
const fs = require("fs");
const { addZeroes, round, removeDuplicates } = require("./utils/utils");
const { recosChannelId, pinnacleRecoBetChannelId, driftedChannelId } = require("./config");
const Odds = require("./models/odds");
const ValueBet = require("./models/valueBet");
const RecoBet = require("./models/recoBet");
const { sendHtmlMessage } = require("./telegram");
const {
  composeNewValueBetMessage,
  composeNewRecoBetMessage,
  composeNewPinnacleRecoBetMessage,
  composeDriftedBet,
} = require("./utils/messages");
const CronJob = require("cron").CronJob;
const {
  frequency,
  valueBetLimit,
  percentageRuleLimit,
  percentageDriftedBetLimit
} = require("./config");

const getDiffValue = value => {
  if (value > 2.5) return 0.85;
  if (value > 2.4) return 0.87;
  if (value > 2.3) return 0.88;
  if (value > 2.2) return 0.88;
  if (value > 2.1) return 0.88;
  if (value > 2) return 0.9;
  if (value > 1.9) return 0.9;
  if (value > 1.8) return 0.91;
  if (value > 1.7) return 0.935;
  if (value > 1.6) return 0.92;
  if (value > 1.5) return 0.94;
  if (value > 1.4) return 0.93;
  if (value > 1.3) return 0.945;
  if (value > 1.2) return 0.94;
  if (value > 1.1) return 0.94;
  return 0.96;
};
const getPinnacleDiffValue = (value) => {
  if (value > 2.5) return 0.85;
  if (value > 2.4) return 0.87;
  if (value > 2.3) return 0.88;
  if (value > 2.2) return 0.88;
  if (value > 2.1) return 0.88;
  if (value > 2) return 0.9;
  if (value > 1.9) return 0.9;
  if (value > 1.8) return 0.91;
  if (value > 1.7) return 0.91;
  if (value > 1.6) return 0.91;
  if (value > 1.5) return 0.92;
  if (value > 1.4) return 0.93;
  if (value > 1.3) return 0.93;
  if (value > 1.2) return 0.93;
  if (value > 1.1) return 0.94;
  return 0.96
}
const twoLinesReco = ({
  localWin,
  awayWin,
  awayWinAvg,
  localWinAvg,
  localUpTrend,
  localDownTrend,
  awayUpTrend,
  awayDownTrend
}) => {
  const localDiff = getDiffValue(localWin);
  const awayDiff = getDiffValue(awayWin);
  if (
    localWin <= 4 &&
    localWin > localWinAvg &&
    localWin * localDiff >= localWinAvg
  ) {
    return {
      betTo: "local",
      odds: localWin,
      avgOdds: localWinAvg,
      upTrend: localUpTrend,
      downTrend: localDownTrend
    };
  }
  if (
    awayWin <= 4 &&
    awayWin > awayWinAvg &&
    awayWin * awayDiff >= awayWinAvg
  ) {
    return {
      betTo: "away",
      odds: awayWin,
      avgOdds: awayWinAvg,
      upTrend: awayUpTrend,
      downTrend: awayDownTrend
    };
  }
};
const twoLinesPinnacleReco = ({
  localWin,
  awayWin,
  localWinAvg,
  awayWinAvg,
  pinnaLocalWin,
  pinnaAwayWin,
  localUpTrend,
  localDownTrend,
  awayUpTrend,
  awayDownTrend
}) => {
  const localDiff = getPinnacleDiffValue(localWin);
  const awayDiff = getPinnacleDiffValue(awayWin);
  if (
    localWin <= 4 &&
    localWin > pinnaLocalWin &&
    localWin * localDiff >= pinnaLocalWin
  ) {
    return {
      betTo: "local",
      odds: localWin,
      pinnacleOdds: pinnaLocalWin,
      avgOdds: localWinAvg,
      upTrend: localUpTrend,
      downTrend: localDownTrend
    };
  }
  if (
    awayWin <= 4 &&
    awayWin > pinnaAwayWin &&
    awayWin * awayDiff >= pinnaAwayWin
  ) {
    return {
      betTo: "away",
      odds: awayWin,
      pinnacleOdds: pinnaAwayWin,
      avgOdds: awayWinAvg,
      upTrend: awayUpTrend,
      downTrend: awayDownTrend
    };
  }
};
const overUnderReco = lines => {
  const valueBets = lines.reduce((list, line) => {
    const {
      availableInBet365,
      numOfBookies,
      overOdds,
      underOdds,
      underOddsAvg,
      overOddsAvg,
      localUpTrend,
      localDownTrend,
      awayUpTrend,
      awayDownTrend
    } = line;

    if (!availableInBet365 || numOfBookies <= 4) return list;

    const localDiff = getDiffValue(overOdds);
    const awayDiff = getDiffValue(underOdds);
    if (
      overOdds <= 4 &&
      overOdds > overOddsAvg &&
      overOdds * localDiff >= overOddsAvg
    ) {
      list.push({
        ...line,
        betTo: "local",
        odds: overOdds,
        avgOdds: overOddsAvg,
        upTrend: localUpTrend,
        downTrend: localDownTrend
      });
    }
    if (
      underOdds <= 4 &&
      underOdds > underOddsAvg &&
      underOdds * awayDiff >= underOddsAvg
    ) {
      list.push({
        ...line,
        betTo: "away",
        odds: underOdds,
        avgOdds: underOddsAvg,
        upTrend: awayUpTrend,
        downTrend: awayDownTrend
      });
    }
    return list;
  }, []);
  return valueBets;
};
const overUnderPinnacleReco = lines => {
  const valueBets = lines.reduce((list, line) => {
    const {
      availableInBet365,
      availableInPinnacle,
      overOdds,
      underOdds,
      pinnaUnderOdds,
      pinnaOverOdds,
      localUpTrend,
      localDownTrend,
      awayUpTrend,
      awayDownTrend
    } = line;

    if (!availableInBet365 || !availableInPinnacle) return list;

    const localDiff = getPinnacleDiffValue(overOdds);
    const awayDiff = getPinnacleDiffValue(underOdds);
    if (
      overOdds <= 4 &&
      overOdds > pinnaOverOdds &&
      overOdds * localDiff >= pinnaOverOdds
    ) {
      list.push({
        ...line,
        betTo: "local",
        odds: overOdds,
        avgOdds: pinnaOverOdds,
        upTrend: localUpTrend,
        downTrend: localDownTrend
      });
    }
    if (
      underOdds <= 4 &&
      underOdds > pinnaUnderOdds &&
      underOdds * awayDiff >= pinnaUnderOdds
    ) {
      list.push({
        ...line,
        betTo: "away",
        odds: underOdds,
        avgOdds: pinnaUnderOdds,
        upTrend: awayUpTrend,
        downTrend: awayDownTrend
      });
    }
    return list;
  }, []);
  return valueBets;
};
const moneyline = (moneyLine, doubleChance) => {
  const {
    localWin,
    awayWin,
    awayWinAvg,
    localWinAvg,
    drawAvg,
    localUpTrend,
    localDownTrend,
    awayUpTrend,
    awayDownTrend
  } = moneyLine;
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
      avgOdds: localAvg,
      upTrend: localUpTrend,
      downTrend: localDownTrend
    };
  if (1 / awayWin + localAvg <= valueBetLimit)
    return {
      valueRatio: round(1 / awayWin + localAvg, 3),
      betTo: "away",
      odds: awayWin,
      avgOdds: awayAvg,
      upTrend: awayUpTrend,
      downTrend: awayDownTrend
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
  const {
    localWin,
    awayWin,
    localWinAvg,
    awayWinAvg,
    localUpTrend,
    localDownTrend,
    awayUpTrend,
    awayDownTrend
  } = doubleChanceLine;
  if (!moneyLine) return false;
  if (1 / localWin + 1 / moneyLine.awayWinAvg <= valueBetLimit)
    return {
      valueRatio: round(1 / localWin + 1 / moneyLine.awayWinAvg, 3),
      betTo: "local",
      odds: localWin,
      avgOdds: localWinAvg,
      upTrend: localUpTrend,
      downTrend: localDownTrend
    };
  if (1 / awayWin + 1 / moneyLine.localWinAvg <= valueBetLimit)
    return {
      valueRatio: round(1 / awayWin + 1 / moneyLine.localWinAvg, 3),
      betTo: "away",
      odds: awayWin,
      avgOdds: awayWinAvg,
      upTrend: awayUpTrend,
      downTrend: awayDownTrend
    };
  return false;
};
const drawNoBet = dnb => {
  const {
    localWin,
    localWinAvg,
    awayWin,
    awayWinAvg,
    localUpTrend,
    localDownTrend,
    awayUpTrend,
    awayDownTrend
  } = dnb;
  if (1 / localWin + 1 / awayWinAvg <= valueBetLimit)
    return {
      valueRatio: round(1 / localWin + 1 / awayWinAvg, 3),
      betTo: "local",
      odds: localWin,
      avgOdds: localWinAvg,
      upTrend: localUpTrend,
      downTrend: localDownTrend
    };
  if (1 / awayWin + 1 / localWinAvg <= valueBetLimit)
    return {
      valueRatio: round(1 / awayWin + 1 / localWinAvg, 3),
      betTo: "away",
      odds: awayWin,
      avgOdds: awayWinAvg,
      upTrend: awayUpTrend,
      downTrend: awayDownTrend
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
  const {
    localWin,
    localWinAvg,
    awayWin,
    awayWinAvg,
    localUpTrend,
    localDownTrend,
    awayUpTrend,
    awayDownTrend
  } = match;
  if (1 / localWin + 1 / awayWinAvg <= valueBetLimit)
    return {
      valueRatio: round(1 / localWin + 1 / awayWinAvg, 3),
      betTo: "local",
      odds: localWin,
      avgOdds: localWinAvg,
      upTrend: localUpTrend,
      downTrend: localDownTrend
    };
  if (1 / awayWin + 1 / localWinAvg <= valueBetLimit)
    return {
      valueRatio: round(1 / awayWin + 1 / localWinAvg, 3),
      betTo: "away",
      odds: awayWin,
      avgOdds: awayWinAvg,
      upTrend: awayUpTrend,
      downTrend: awayDownTrend
    };
  return false;
};
const overUnderGoals = lines => {
  const valueBets = lines.reduce((list, line) => {
    const {
      availableInBet365,
      numOfBookies,
      overOdds,
      underOdds,
      underOddsAvg,
      overOddsAvg,
      localUpTrend,
      localDownTrend,
      awayUpTrend,
      awayDownTrend
    } = line;

    if (!availableInBet365 || numOfBookies <= 4) return list;

    if (overOdds < 13 && 1 / overOdds + 1 / underOddsAvg <= valueBetLimit)
      list.push({
        ...line,
        valueRatio: round(1 / overOdds + 1 / underOddsAvg, 3),
        betTo: "local",
        odds: overOdds,
        avgOdds: overOddsAvg,
        upTrend: localUpTrend,
        downTrend: localDownTrend
      });
    if (underOdds < 13 && 1 / underOdds + 1 / overOddsAvg <= valueBetLimit)
      list.push({
        ...line,
        valueRatio: round(1 / underOdds + 1 / overOddsAvg, 3),
        betTo: "away",
        odds: underOdds,
        avgOdds: underOddsAvg,
        upTrend: awayUpTrend,
        downTrend: awayDownTrend
      });
    return list;
  }, []);
  return valueBets;
};
const asianHandicap = lines => {
  const valueBets = lines.reduce((list, line) => {
    const {
      availableInBet365,
      numOfBookies,
      overOdds,
      underOdds,
      overOddsAvg,
      underOddsAvg,
      localUpTrend,
      localDownTrend,
      awayUpTrend,
      awayDownTrend
    } = line;

    if (!availableInBet365 || numOfBookies <= 4) return list;

    if (overOdds < 13 && 1 / overOdds + 1 / underOddsAvg <= valueBetLimit)
      list.push({
        ...line,
        valueRatio: round(1 / overOdds + 1 / underOddsAvg, 3),
        betTo: "local",
        odds: overOdds,
        avgOdds: overOddsAvg,
        upTrend: localUpTrend,
        downTrend: localDownTrend
      });
    if (underOdds < 13 && 1 / underOdds + 1 / overOddsAvg <= valueBetLimit)
      list.push({
        ...line,
        valueRatio: round(1 / underOdds + 1 / overOddsAvg, 3),
        betTo: "away",
        odds: underOdds,
        avgOdds: underOddsAvg,
        upTrend: awayUpTrend,
        downTrend: awayDownTrend
      });
    return list;
  }, []);
  return valueBets;
};

const composeValueBetLine = (match, line, path, valueBet, lineValue) => ({
  match: match.match,
  date: match.date,
  dateObj: match.dateObj,
  line,
  lineValue,
  url: match.url + path,
  valueRatio: valueBet.valueRatio,
  betTo: valueBet.betTo,
  odds: valueBet.odds,
  avgOdds: isNaN(valueBet.avgOdds) ? 0 : valueBet.avgOdds,
  upTrend: valueBet.upTrend,
  downTrend: valueBet.downTrend
});
const composeRecoBetLine = (match, line, path, valueBet, lineValue) => ({
  match: match.match,
  date: match.date,
  dateObj: match.dateObj,
  line,
  lineValue,
  url: match.url + path,
  betTo: valueBet.betTo,
  odds: valueBet.odds,
  avgOdds: isNaN(valueBet.avgOdds) ? 0 : valueBet.avgOdds,
  upTrend: valueBet.upTrend,
  downTrend: valueBet.downTrend
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
  const entriesToNotify = [];
  for (let index = 0; index < valueBets.length; index++) {
    const bet = valueBets[index];
    if (isNaN(bet.avgOdds)) console.log(bet);
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
        lineValue: valueBet.lineValue,
        valueRatio: valueBet.valueRatio,
        sequence: valueBet.sequence,
        betTo: valueBet.betTo,
        odds: valueBet.odds,
        avgOdds: valueBet.avgOdds,
        upTrend: valueBet.upTrend,
        downTrend: valueBet.downTrend
      });
  });
  return newValueBets;
}
async function saveRecoBetsToDatabase(recoBets) {
  const promises = [];
  const newRecoBets = [];
  const entriesToNotify = [];
  for (let index = 0; index < recoBets.length; index++) {
    const bet = recoBets[index];
    if (isNaN(bet.avgOdds)) console.log(bet);
    const filterOptions = { match: bet.match, line: bet.line };
    if (bet.line === "AH" || bet.line === "O/U") filterOptions.line = bet.line;
    let vb = await RecoBet.findOne(filterOptions);

    if (!vb) {
      vb = new RecoBet(bet);
      entriesToNotify.push(vb._id.toString());
      promises.push(vb.save());
    }
  }
  (await Promise.all(promises)).forEach(valueBet => {
    if (entriesToNotify.includes(valueBet._id.toString()))
      newRecoBets.push({
        match: valueBet.match,
        date: valueBet.date,
        url: valueBet.url,
        line: valueBet.line,
        lineValue: valueBet.lineValue,
        valueRatio: valueBet.valueRatio,
        sequence: valueBet.sequence,
        betTo: valueBet.betTo,
        odds: valueBet.odds,
        avgOdds: valueBet.avgOdds,
        upTrend: valueBet.upTrend,
        downTrend: valueBet.downTrend
      });
  });
  return newRecoBets;
}
async function savePinnacleRecobetsToDatabase(pinnacleRecoBets) {
  const promises = [];
  const newPinnacleRecoBets = [];
  const entriesToNotify = [];
  for (let index = 0; index < pinnacleRecoBets.length; index++) {
    const bet = pinnacleRecoBets[index];
    if (isNaN(bet.avgOdds)) console.log(bet);
    const filterOptions = { match: bet.match, line: bet.line };
    if (bet.line === "AH" || bet.line === "O/U") filterOptions.line = bet.line;
    let vb = await RecoBet.findOne(filterOptions);

    if (!vb) {
      vb = new RecoBet(bet);
      entriesToNotify.push(vb._id.toString());
      promises.push(vb.save());
    }
  }
  (await Promise.all(promises)).forEach(valueBet => {
    if (entriesToNotify.includes(valueBet._id.toString()))
      newPinnacleRecoBets.push({
        match: valueBet.match,
        date: valueBet.date,
        url: valueBet.url,
        line: valueBet.line,
        lineValue: valueBet.lineValue,
        betTo: valueBet.betTo,
        odds: valueBet.odds,
        pinnacleOdds: valueBet.pinnacleOdds,
        avgOdds: valueBet.avgOdds,
        upTrend: valueBet.upTrend,
        downTrend: valueBet.downTrend
      });
  });
  return newPinnacleRecoBets;
}
const analyzeBets = async () => {
  try {
    // const matches = await Odds.find({dateObj: {$gt: new Date()}});
    const matches = await Odds.find();
    const valueBets = [];
    const recoBets = [];
    const pinnacleRecoBets = [];
    const percentageBets = [];
    const driftedLines = [];
    matches.forEach(match => {
      valueBets.push(...getMatchValueBets(match));
      recoBets.push(...getMatchRecosBets(match));
      pinnacleRecoBets.push(...getPinnacleRecoBets(match));
      // driftedLines.push(...getDriftedValueBets(match));
      // percentageBets.push(...getMatchValueBetsByPercentage(match));
    });

    // Save result to db
    const vb = removeDuplicates(valueBets);
    const newValueBets = await saveValueBetsToDatabase(vb);
    const rc = removeDuplicates(recoBets);
    const newRecoBets = await saveRecoBetsToDatabase(rc);
    const newPinnacleRecoBets = await savePinnacleRecobetsToDatabase(pinnacleRecoBets);

    for (let index = 0; index < newValueBets.length; index++) {
      const valueBet = newValueBets[index];
      console.log(`new value bet: ${valueBet.url}, betTo: ${valueBet.betTo}`);
      await sendHtmlMessage(composeNewValueBetMessage(valueBet));
    }
    for (let index = 0; index < newRecoBets.length; index++) {
      const recoBet = newRecoBets[index];
      await sendHtmlMessage(composeNewRecoBetMessage(recoBet), recosChannelId);
    }
    for (let index = 0; index < newPinnacleRecoBets.length; index++) {
      const pinnacleRecoBet = newPinnacleRecoBets[index];
      await sendHtmlMessage(composeNewPinnacleRecoBetMessage(pinnacleRecoBet), pinnacleRecoBetChannelId);
    }
    // for (let index = 0; index < driftedLines.length; index++) {
    //   const driftedBet = driftedLines[index];
    //   await sendHtmlMessage(composeDriftedBet(driftedBet), driftedChannelId);
    // }
    // driftedLines.forEach(driftedBet => {
    //   console.log(composeDriftedBet(driftedBet));
    //   await
    //   promises.push(sendHtmlMessage(composeNewPercentageBetMessage(valueBet), ));
    // });
    // percentageBets.forEach(valueBet => {
    //   console.log(`new percentage bet: ${valueBet.url} %: ${valueBet.percentage}`);
    //   promises.push(sendHtmlMessage(composeNewPercentageBetMessage(valueBet)));
    // })
  } catch (error) {
    console.log("ERROR!!!!!!!!!!: ", error);
  }
};

const start = () => {
  const job = new CronJob(`0 */${frequency} * * * *`, async function() {
    await analyzeBets();
  });
  job.start();
};

module.exports = { start };

function getMatchValueBets(match) {
  const lineDelimiterBySport = {
    football: ";2",
    basketball: ";1"
  };
  const delimiter = lineDelimiterBySport[match.sport];
  const results = [];
  if (match.moneyLine && match.moneyLine.availableInBet365) {
    const result = moneyline(match.moneyLine, match.doubleChance);
    if (result) results.push(composeValueBetLine(match, "ML", "", result));
  }
  if (match.dnb && match.dnb.availableInBet365) {
    const result = drawNoBet(match.dnb);
    if (result)
      results.push(
        composeValueBetLine(match, "DNB", `#dnb${delimiter}`, result)
      );
  }
  if (match.homeAway && match.homeAway.availableInBet365) {
    const result = homeAway(match.homeAway);
    if (result)
      results.push(
        composeValueBetLine(match, "HOMEAWAY", `#home-away${delimiter}`, result)
      );
  }
  if (match.doubleChance && match.doubleChance.availableInBet365) {
    const result = doubleChance(match.doubleChance, match.moneyLine);
    if (result)
      results.push(
        composeValueBetLine(match, "DC", `#double${delimiter}`, result)
      );
  }
  if (match.bts && match.bts.availableInBet365) {
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

function getMatchRecosBets(match) {
  const lineDelimiterBySport = {
    football: ";2",
    basketball: ";1"
  };
  const delimiter = lineDelimiterBySport[match.sport];
  const results = [];
  if (match.moneyLine && match.moneyLine.availableInBet365) {
    const result = twoLinesReco(match.moneyLine);
    if (result) results.push(composeRecoBetLine(match, "ML", "", result));
  }
  if (match.dnb && match.dnb.availableInBet365) {
    const result = twoLinesReco(match.dnb);
    if (result)
      results.push(
        composeValueBetLine(match, "DNB", `#dnb${delimiter}`, result)
      );
  }
  if (match.doubleChance && match.doubleChance.availableInBet365) {
    const result = twoLinesReco(match.doubleChance);
    if (result)
      results.push(
        composeValueBetLine(match, "DC", `#double${delimiter}`, result)
      );
  }
  if (match.bts && match.bts.availableInBet365) {
    const result = twoLinesReco(match.bts);
    if (result)
      results.push(
        composeValueBetLine(match, "BTS", `#bts${delimiter}`, result)
      );
  }
  if (match.overUnder.length > 0) {
    const overUnderLines = overUnderReco(match.overUnder);
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
    const asianHandicapLines = overUnderReco(match.asianHandicap);
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

function getPinnacleRecoBets(match) {
  const lineDelimiterBySport = {
    football: ";2",
    basketball: ";1"
  };
  const delimiter = lineDelimiterBySport[match.sport];
  const results = [];
  if (match.moneyLine && match.moneyLine.availableInBet365 && match.moneyLine.availableInPinnacle) {
    const result = twoLinesPinnacleReco(match.moneyLine);
    if (result) results.push(composeRecoBetLine(match, "ML", "", result));
  }
  if (match.dnb && match.dnb.availableInBet365 && match.dnb.availableInPinnacle) {
    const result = twoLinesPinnacleReco(match.dnb);
    if (result)
      results.push(
        composeValueBetLine(match, "DNB", `#dnb${delimiter}`, result)
      );
  }
  if (match.bts && match.bts.availableInBet365  && match.bts.availableInPinnacle) {
    const result = twoLinesPinnacleReco(match.bts);
    if (result)
      results.push(
        composeValueBetLine(match, "BTS", `#bts${delimiter}`, result)
      );
  }
  if (match.overUnder.length > 0) {
    const overUnderLines = overUnderPinnacleReco(match.overUnder);
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
    const asianHandicapLines = overUnderPinnacleReco(match.asianHandicap);
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

function getDriftedValueBets(match) {
  const { asianHandicap, dnb, doubleChance } = match;
  const driftedBets = [];
  if (!asianHandicap || !dnb || !doubleChance) return driftedBets;

  // AH 0
  handicapZero = asianHandicap.find(line => line.line === "0");
  // AH +0.5
  handicapZeroPoint5 = asianHandicap.find(line => line.line === "0.5");
  // AH -0.5
  handicapMinusZeroPoint5 = asianHandicap.find(line => line.line === "-0.5");

  //averages
  if (handicapZero) {
    const averageLocalDnbLocalAH = (dnb.localWin + handicapZero.overOdds) / 2;
    let differenceAsPercentage = round(
      ((dnb.localWin - handicapZero.overOdds) / averageLocalDnbLocalAH) * 100,
      2
    );
    if (Math.abs(differenceAsPercentage) > percentageDriftedBetLimit) {
      driftedBets.push({
        match: match.match,
        data: match.date,
        url: match.url,
        betTo: "local",
        lineValue: handicapZero.line,
        linesDifference: differenceAsPercentage,
        ahOdds: handicapZero.overOdds,
        dnbOdds: dnb.localWin
      });
      differenceAsPercentage > 0
        ? console.log("ValueBet DNB ", differenceAsPercentage)
        : console.log("ValueBet AH Local ", differenceAsPercentage);
    }
    const averageAwayDnbLocalAH = (dnb.awayWin + handicapZero.underOdds) / 2;
    differenceAsPercentage = round(
      ((dnb.awayWin - handicapZero.underOdds) / averageAwayDnbLocalAH) * 100,
      2
    );
    if (Math.abs(differenceAsPercentage) > percentageDriftedBetLimit) {
      driftedBets.push({
        match: match.match,
        date: match.date,
        url: match.url,
        betTo: "away",
        lineValue: handicapZero.line,
        linesDifference: differenceAsPercentage,
        ahOdds: handicapZero.underOdds,
        dnbOdds: dnb.awayWin
      });
      differenceAsPercentage > 0
        ? console.log("ValueBet DNB Away ", differenceAsPercentage)
        : console.log("ValueBet AH Away ", differenceAsPercentage);
    }
  }

  if (handicapZeroPoint5) {
    const averageLocalDCLocalAH =
      (doubleChance.localWin + handicapZeroPoint5.overOdds) / 2;
    differenceAsPercentage = round(
      ((doubleChance.localWin - handicapZeroPoint5.overOdds) /
        averageLocalDCLocalAH) *
        100,
      2
    );
    if (Math.abs(differenceAsPercentage) > percentageDriftedBetLimit) {
      driftedBets.push({
        match: match.match,
        data: match.date,
        url: match.url,
        betTo: "home",
        lineValue: handicapZeroPoint5.line,
        linesDifference: differenceAsPercentage,
        ahOdds: handicapZeroPoint5.overOdds,
        dcOdds: doubleChance.localWin
      });
      differenceAsPercentage > 0
        ? console.log("ValueBet DC local ", differenceAsPercentage)
        : console.log("ValueBet AH local ", differenceAsPercentage);
    }
  }

  if (handicapMinusZeroPoint5) {
    const averageAwayDCAwayAH =
      (doubleChance.awayWin + handicapMinusZeroPoint5.underOdds) / 2;
    differenceAsPercentage = round(
      ((doubleChance.awayWin - handicapMinusZeroPoint5.underOdds) /
        averageAwayDCAwayAH) *
        100,
      2
    );
    if (Math.abs(differenceAsPercentage) > percentageDriftedBetLimit) {
      driftedBets.push({
        match: match.match,
        data: match.date,
        url: match.url,
        betTo: "away",
        lineValue: handicapMinusZeroPoint5.line,
        linesDifference: differenceAsPercentage,
        ahOdds: handicapMinusZeroPoint5.underOdds,
        dcOdds: doubleChance.awayWin
      });
      differenceAsPercentage > 0
        ? console.log("ValueBet DC away ", differenceAsPercentage)
        : console.log("ValueBet AH away ", differenceAsPercentage);
    }
  }
  return driftedBets;
}
