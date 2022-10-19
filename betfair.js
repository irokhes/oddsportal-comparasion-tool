const { addZeroes } = require("./utils/utils");
const {getDiffValue, getPinnacleDiffValue} = require('./utils/diffValues');

const twoLinesReco = ({
  betfairLocalWin,
  betfairAwayWin,
  awayWinAvg,
  localWinAvg,
  pinnaLocalWin,
  pinnaAwayWin,
  localUpTrend,
  localDownTrend,
  awayUpTrend,
  awayDownTrend
}) => {
  const localDiff = getDiffValue(betfairLocalWin);
  const awayDiff = getDiffValue(betfairAwayWin);
  if (
    betfairLocalWin <= 4 &&
    betfairLocalWin > localWinAvg &&
    betfairLocalWin * localDiff >= localWinAvg
  ) {
    return {
      betTo: "local",
      odds: betfairLocalWin,
      pinnacleOdds: pinnaLocalWin,
      avgOdds: localWinAvg,
      upTrend: localUpTrend,
      downTrend: localDownTrend
    };
  }
  if (
    betfairAwayWin <= 4 &&
    betfairAwayWin > awayWinAvg &&
    betfairAwayWin * awayDiff >= awayWinAvg
  ) {
    return {
      betTo: "away",
      odds: betfairAwayWin,
      pinnacleOdds: pinnaAwayWin,
      avgOdds: awayWinAvg,
      upTrend: awayUpTrend,
      downTrend: awayDownTrend
    };
  }
};
const twoLinesPinnacleReco = ({
    betfairLocalWin,
    betfairAwayWin,
    localWinAvg,
    awayWinAvg,
    pinnaLocalWin,
    pinnaAwayWin,
    localUpTrend,
    localDownTrend,
    awayUpTrend,
    awayDownTrend
  }) => {
    const localDiff = getPinnacleDiffValue(betfairLocalWin);
    const awayDiff = getPinnacleDiffValue(betfairAwayWin);
    if (
      betfairLocalWin <= 4 &&
      betfairLocalWin > pinnaLocalWin &&
      betfairLocalWin * localDiff >= pinnaLocalWin
    ) {
      return {
        betTo: "local",
        odds: betfairLocalWin,
        pinnacleOdds: pinnaLocalWin,
        avgOdds: localWinAvg,
        upTrend: localUpTrend,
        downTrend: localDownTrend
      };
    }
    if (
      betfairAwayWin <= 4 &&
      betfairAwayWin > pinnaAwayWin &&
      betfairAwayWin * awayDiff >= pinnaAwayWin
    ) {
      return {
        betTo: "away",
        odds: betfairAwayWin,
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
      availableInBetfair,
      numOfBookies,
      betfairOverOdds,
      betfairUnderOdds,
      pinnaUnderOdds,
      pinnaOverOdds,
      underOddsAvg,
      overOddsAvg,
      localUpTrend,
      localDownTrend,
      awayUpTrend,
      awayDownTrend
    } = line;

    if (!availableInBetfair || numOfBookies <= 4) return list;

    const localDiff = getDiffValue(betfairOverOdds);
    const awayDiff = getDiffValue(betfairUnderOdds);
    if (
      betfairOverOdds <= 4 &&
      betfairOverOdds > overOddsAvg &&
      betfairOverOdds * localDiff >= overOddsAvg
    ) {
      list.push({
        ...line,
        betTo: "local",
        odds: betfairOverOdds,
        avgOdds: overOddsAvg,
        pinnacleOdds: pinnaOverOdds,
        upTrend: localUpTrend,
        downTrend: localDownTrend
      });
    }
    if (
      betfairUnderOdds <= 4 &&
      betfairUnderOdds > underOddsAvg &&
      betfairUnderOdds * awayDiff >= underOddsAvg
    ) {
      list.push({
        ...line,
        betTo: "away",
        odds: betfairUnderOdds,
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
        availableInBetfair,
        availableInPinnacle,
        betfairOverOdds,
        betfairUnderOdds,
        underOddsAvg,
        overOddsAvg,
        pinnaUnderOdds,
        pinnaOverOdds,
        localUpTrend,
        localDownTrend,
        awayUpTrend,
        awayDownTrend
      } = line;

      if (!availableInBetfair || !availableInPinnacle) return list;

      const localDiff = getPinnacleDiffValue(betfairOverOdds);
      const awayDiff = getPinnacleDiffValue(betfairUnderOdds);
      if (
        betfairOverOdds <= 4 &&
        betfairOverOdds > pinnaOverOdds &&
        betfairOverOdds * localDiff >= pinnaOverOdds
      ) {
        list.push({
          ...line,
          betTo: "local",
          odds: betfairOverOdds,
          avgOdds: overOddsAvg,
          pinnacleOdds: pinnaOverOdds,
          upTrend: localUpTrend,
          downTrend: localDownTrend
        });
      }
      if (
        betfairUnderOdds <= 4 &&
        betfairUnderOdds > pinnaUnderOdds &&
        betfairUnderOdds * awayDiff >= pinnaUnderOdds
      ) {
        list.push({
          ...line,
          betTo: "away",
          odds: betfairUnderOdds,
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
  if (match.moneyLine && match.moneyLine.availableInBetfair) {
    const result = twoLinesReco(match.moneyLine);
    if (result) results.push(composeRecoBetLine(match, "ML", "", result));
  }
  if (match.moneyLineFirstHalf && match.moneyLineFirstHalf.availableInBetfair) {
    const result = twoLinesReco(match.moneyLineFirstHalf);
    if (result)
      results.push(composeRecoBetLine(match, "1 ML", "#1X2;3", result));
  }
  // if (match.dnb && match.dnb.availableInBetfair) {
  //   const result = twoLinesReco(match.dnb);
  //   if (result) {
  //     results.push(
  //       composeValueBetLine(match, "DNB", `#dnb${delimiter}`, result)
  //     );
  //   }
  // }
  if (match.doubleChance && match.doubleChance.availableInBetfair) {
    const result = twoLinesReco(match.doubleChance);
    if (result) {
      results.push(
        composeValueBetLine(match, "DC", `#double${delimiter}`, result)
      );
    }
  }
  if (match.bts && match.bts.availableInBetfair) {
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
    if (match.moneyLine && match.moneyLine.availableInBetfair && match.moneyLine.availableInPinnacle) {
      const result = twoLinesPinnacleReco(match.moneyLine);
      if (result) results.push(composeRecoBetLine(match, "ML", "", result));
    }
    if (match.moneyLineFirstHalf && match.moneyLineFirstHalf.availableInBetfair && match.moneyLineFirstHalf.availableInPinnacle) {
      const result = twoLinesPinnacleReco(match.moneyLineFirstHalf);
      if (result) results.push(composeRecoBetLine(match, "1 ML", "#1X2;3", result));
    }
    // if (match.dnb && match.dnb.availableInBetfair && match.dnb.availableInPinnacle) {
    //   const result = twoLinesPinnacleReco(match.dnb);
    //   if (result)
    //     results.push(
    //       composeRecoBetLine(match, "DNB", `#dnb${delimiter}`, result)
    //     );
    // }
    if (match.bts && match.bts.availableInBetfair  && match.bts.availableInPinnacle) {
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
