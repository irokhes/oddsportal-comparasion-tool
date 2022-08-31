const { addZeroes } = require("./utils/utils");
const {getDiffValue, getPinnacleDiffValue} = require('./utils/diffValues');

const twoLinesReco = ({
  williamHillLocalWin,
  williamHillAwayWin,
  awayWinAvg,
  localWinAvg,
  pinnaLocalWin,
  pinnaAwayWin,
  localUpTrend,
  localDownTrend,
  awayUpTrend,
  awayDownTrend
}) => {
  const localDiff = getDiffValue(williamHillLocalWin);
  const awayDiff = getDiffValue(williamHillAwayWin);
  if (
    williamHillLocalWin <= 4 &&
    williamHillLocalWin > localWinAvg &&
    williamHillLocalWin * localDiff >= localWinAvg
  ) {
    return {
      betTo: "local",
      odds: williamHillLocalWin,
      pinnacleOdds: pinnaLocalWin,
      avgOdds: localWinAvg,
      upTrend: localUpTrend,
      downTrend: localDownTrend
    };
  }
  if (
    williamHillAwayWin <= 4 &&
    williamHillAwayWin > awayWinAvg &&
    williamHillAwayWin * awayDiff >= awayWinAvg
  ) {
    return {
      betTo: "away",
      odds: williamHillAwayWin,
      pinnacleOdds: pinnaAwayWin,
      avgOdds: awayWinAvg,
      upTrend: awayUpTrend,
      downTrend: awayDownTrend
    };
  }
};
const twoLinesPinnacleReco = ({
    williamHillLocalWin,
    williamHillAwayWin,
    localWinAvg,
    awayWinAvg,
    pinnaLocalWin,
    pinnaAwayWin,
    localUpTrend,
    localDownTrend,
    awayUpTrend,
    awayDownTrend
  }) => {
    const localDiff = getPinnacleDiffValue(williamHillLocalWin);
    const awayDiff = getPinnacleDiffValue(williamHillAwayWin);
    if (
      williamHillLocalWin <= 4 &&
      williamHillLocalWin > pinnaLocalWin &&
      williamHillLocalWin * localDiff >= pinnaLocalWin
    ) {
      return {
        betTo: "local",
        odds: williamHillLocalWin,
        pinnacleOdds: pinnaLocalWin,
        avgOdds: localWinAvg,
        upTrend: localUpTrend,
        downTrend: localDownTrend
      };
    }
    if (
      williamHillAwayWin <= 4 &&
      williamHillAwayWin > pinnaAwayWin &&
      williamHillAwayWin * awayDiff >= pinnaAwayWin
    ) {
      return {
        betTo: "away",
        odds: williamHillAwayWin,
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
      availableInWilliamHill,
      numOfBookies,
      williamHillOverOdds,
      williamHillUnderOdds,
      pinnaUnderOdds,
      pinnaOverOdds,
      underOddsAvg,
      overOddsAvg,
      localUpTrend,
      localDownTrend,
      awayUpTrend,
      awayDownTrend
    } = line;

    if (!availableInWilliamHill || numOfBookies <= 4) return list;

    const localDiff = getDiffValue(williamHillOverOdds);
    const awayDiff = getDiffValue(williamHillUnderOdds);
    if (
      williamHillOverOdds <= 4 &&
      williamHillOverOdds > overOddsAvg &&
      williamHillOverOdds * localDiff >= overOddsAvg
    ) {
      list.push({
        ...line,
        betTo: "local",
        odds: williamHillOverOdds,
        avgOdds: overOddsAvg,
        pinnacleOdds: pinnaOverOdds,
        upTrend: localUpTrend,
        downTrend: localDownTrend
      });
    }
    if (
      williamHillUnderOdds <= 4 &&
      williamHillUnderOdds > underOddsAvg &&
      williamHillUnderOdds * awayDiff >= underOddsAvg
    ) {
      list.push({
        ...line,
        betTo: "away",
        odds: williamHillUnderOdds,
        avgOdds: underOddsAvg,
        pinnacleOdds: pinnaUnderOdds,
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
        availableInWilliamHill,
        availableInPinnacle,
        williamHillOverOdds,
        williamHillUnderOdds,
        underOddsAvg,
        overOddsAvg,
        pinnaUnderOdds,
        pinnaOverOdds,
        localUpTrend,
        localDownTrend,
        awayUpTrend,
        awayDownTrend
      } = line;

      if (!availableInWilliamHill || !availableInPinnacle) return list;

      const localDiff = getPinnacleDiffValue(williamHillOverOdds);
      const awayDiff = getPinnacleDiffValue(williamHillUnderOdds);
      if (
        williamHillOverOdds <= 4 &&
        williamHillOverOdds > pinnaOverOdds &&
        williamHillOverOdds * localDiff >= pinnaOverOdds
      ) {
        list.push({
          ...line,
          betTo: "local",
          odds: williamHillOverOdds,
          avgOdds: overOddsAvg,
          pinnacleOdds: pinnaOverOdds,
          upTrend: localUpTrend,
          downTrend: localDownTrend
        });
      }
      if (
        williamHillUnderOdds <= 4 &&
        williamHillUnderOdds > pinnaUnderOdds &&
        williamHillUnderOdds * awayDiff >= pinnaUnderOdds
      ) {
        list.push({
          ...line,
          betTo: "away",
          odds: williamHillUnderOdds,
          avgOdds: underOddsAvg,
          pinnacleOdds: pinnaUnderOdds,
          upTrend: awayUpTrend,
          downTrend: awayDownTrend
        });
      }
      return list;
    }, []);
    return valueBets;
  };
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
  pinnacleOdds: valueBet.pinnacleOdds,
  upTrend: valueBet.upTrend,
  downTrend: valueBet.downTrend
});
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
    pinnacleOdds: valueBet.pinnacleOdds,
    upTrend: valueBet.upTrend,
    downTrend: valueBet.downTrend
  });
const getValueBets = match => {
  const lineDelimiterBySport = {
    football: ";2",
    basketball: ";1"
  };
  const delimiter = lineDelimiterBySport[match.sport];
  const results = [];
  if (match.moneyLine && match.moneyLine.availableInWilliamHill) {
    const result = twoLinesReco(match.moneyLine);
    if (result) results.push(composeRecoBetLine(match, "ML", "", result));
  }
  if (match.moneyLineFirstHalf && match.moneyLineFirstHalf.availableInWilliamHill) {
    const result = twoLinesReco(match.moneyLineFirstHalf);
    if (result)
      results.push(composeRecoBetLine(match, "1 ML", "#1X2;3", result));
  }
  // if (match.dnb && match.dnb.availableInWilliamHill) {
  //   const result = twoLinesReco(match.dnb);
  //   if (result) {
  //     results.push(
  //       composeValueBetLine(match, "DNB", `#dnb${delimiter}`, result)
  //     );
  //   }
  // }
  if (match.doubleChance && match.doubleChance.availableInWilliamHill) {
    const result = twoLinesReco(match.doubleChance);
    if (result) {
      results.push(
        composeValueBetLine(match, "DC", `#double${delimiter}`, result)
      );
    }
  }
  if (match.bts && match.bts.availableInWilliamHill) {
    const result = twoLinesReco(match.bts);
    if (result) {
      results.push(
        composeValueBetLine(match, "BTS", `#bts${delimiter}`, result)
      );
    }
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
};
function getPinnacleRecoBets(match) {
    const lineDelimiterBySport = {
      football: ";2",
      basketball: ";1"
    };
    const delimiter = lineDelimiterBySport[match.sport];
    const results = [];
    if (match.moneyLine && match.moneyLine.availableInWilliamHill && match.moneyLine.availableInPinnacle) {
      const result = twoLinesPinnacleReco(match.moneyLine);
      if (result) results.push(composeRecoBetLine(match, "ML", "", result));
    }
    if (match.moneyLineFirstHalf && match.moneyLineFirstHalf.availableInWilliamHill && match.moneyLineFirstHalf.availableInPinnacle) {
      const result = twoLinesPinnacleReco(match.moneyLineFirstHalf);
      if (result) results.push(composeRecoBetLine(match, "1 ML", "#1X2;3", result));
    }
    if (match.dnb && match.dnb.availableInWilliamHill && match.dnb.availableInPinnacle) {
      const result = twoLinesPinnacleReco(match.dnb);
      if (result)
        results.push(
          composeRecoBetLine(match, "DNB", `#dnb${delimiter}`, result)
        );
    }
    if (match.bts && match.bts.availableInWilliamHill  && match.bts.availableInPinnacle) {
      const result = twoLinesPinnacleReco(match.bts);
      if (result)
        results.push(
          composeRecoBetLine(match, "BTS", `#bts${delimiter}`, result)
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
module.exports = {
  getValueBets,
  getPinnacleRecoBets
};
