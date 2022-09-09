const { addZeroes } = require("./utils/utils");
const {getDiffValue, getPinnacleDiffValue} = require('./utils/diffValues');

const twoLinesReco = ({
  pinnacleLocalWin,
  pinnacleAwayWin,
  awayWinAvg,
  localWinAvg,
  bet365LocalWin,
  bet365AwayWin,
  localUpTrend,
  localDownTrend,
  awayUpTrend,
  awayDownTrend
}) => {
  const localDiff = getDiffValue(pinnacleLocalWin);
  const awayDiff = getDiffValue(pinnacleAwayWin);
  if (
    pinnacleLocalWin <= 4 &&
    pinnacleLocalWin > localWinAvg &&
    pinnacleLocalWin * localDiff >= localWinAvg
  ) {
    return {
      betTo: "local",
      odds: pinnacleLocalWin,
      pinnacleOdds: bet365LocalWin,
      avgOdds: localWinAvg,
      upTrend: localUpTrend,
      downTrend: localDownTrend
    };
  }
  if (
    pinnacleAwayWin <= 4 &&
    pinnacleAwayWin > awayWinAvg &&
    pinnacleAwayWin * awayDiff >= awayWinAvg
  ) {
    return {
      betTo: "away",
      odds: pinnacleAwayWin,
      pinnacleOdds: bet365AwayWin,
      avgOdds: awayWinAvg,
      upTrend: awayUpTrend,
      downTrend: awayDownTrend
    };
  }
};
const twoLinesPinnacleReco = ({
    pinnacleLocalWin,
    pinnacleAwayWin,
    localWinAvg,
    awayWinAvg,
    bet365LocalWin,
    bet365AwayWin,
    localUpTrend,
    localDownTrend,
    awayUpTrend,
    awayDownTrend
  }) => {
    const localDiff = getPinnacleDiffValue(pinnacleLocalWin);
    const awayDiff = getPinnacleDiffValue(pinnacleAwayWin);
    if (
      pinnacleLocalWin <= 4 &&
      pinnacleLocalWin > bet365LocalWin &&
      pinnacleLocalWin * localDiff >= bet365LocalWin
    ) {
      return {
        betTo: "local",
        odds: pinnacleLocalWin,
        bet365Odds: bet365LocalWin,
        avgOdds: localWinAvg,
        upTrend: localUpTrend,
        downTrend: localDownTrend
      };
    }
    if (
      pinnacleAwayWin <= 4 &&
      pinnacleAwayWin > bet365AwayWin &&
      pinnacleAwayWin * awayDiff >= bet365AwayWin
    ) {
      return {
        betTo: "away",
        odds: pinnacleAwayWin,
        bet365Odds: bet365AwayWin,
        avgOdds: awayWinAvg,
        upTrend: awayUpTrend,
        downTrend: awayDownTrend
      };
    }
  };
const overUnderReco = lines => {
  const valueBets = lines.reduce((list, line) => {
    const {
      availableInPinnacle,
      numOfBookies,
      pinnacleOverOdds,
      pinnacleUnderOdds,
      pinnaUnderOdds,
      pinnaOverOdds,
      underOddsAvg,
      overOddsAvg,
      localUpTrend,
      localDownTrend,
      awayUpTrend,
      awayDownTrend
    } = line;

    if (!availableInPinnacle || numOfBookies <= 4) return list;

    const localDiff = getDiffValue(pinnacleOverOdds);
    const awayDiff = getDiffValue(pinnacleUnderOdds);
    if (
      pinnacleOverOdds <= 4 &&
      pinnacleOverOdds > overOddsAvg &&
      pinnacleOverOdds * localDiff >= overOddsAvg
    ) {
      list.push({
        ...line,
        betTo: "local",
        odds: pinnacleOverOdds,
        avgOdds: overOddsAvg,
        pinnacleOdds: pinnaOverOdds,
        upTrend: localUpTrend,
        downTrend: localDownTrend
      });
    }
    if (
      pinnacleUnderOdds <= 4 &&
      pinnacleUnderOdds > underOddsAvg &&
      pinnacleUnderOdds * awayDiff >= underOddsAvg
    ) {
      list.push({
        ...line,
        betTo: "away",
        odds: pinnacleUnderOdds,
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
        availableInPinnacle,
        availableInBet365,
        pinnacleOverOdds,
        pinnacleUnderOdds,
        underOddsAvg,
        overOddsAvg,
        underOdds,
        overOdds,
        localUpTrend,
        localDownTrend,
        awayUpTrend,
        awayDownTrend
      } = line;

      if (!availableInPinnacle || !availableInBet365) return list;

      const localDiff = getPinnacleDiffValue(pinnacleOverOdds);
      const awayDiff = getPinnacleDiffValue(pinnacleUnderOdds);
      if (
        pinnacleOverOdds <= 4 &&
        pinnacleOverOdds > pinnaOverOdds &&
        pinnacleOverOdds * localDiff >= pinnaOverOdds
      ) {
        list.push({
          ...line,
          betTo: "local",
          odds: pinnacleOverOdds,
          avgOdds: overOddsAvg,
          bet365Odds: overOdds,
          upTrend: localUpTrend,
          downTrend: localDownTrend
        });
      }
      if (
        pinnacleUnderOdds <= 4 &&
        pinnacleUnderOdds > pinnaUnderOdds &&
        pinnacleUnderOdds * awayDiff >= pinnaUnderOdds
      ) {
        list.push({
          ...line,
          betTo: "away",
          odds: pinnacleUnderOdds,
          avgOdds: underOddsAvg,
          bet365Odds: underOdds,
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
  if (match.moneyLine && match.moneyLine.availableInPinnacle) {
    const result = twoLinesReco(match.moneyLine);
    if (result) results.push(composeRecoBetLine(match, "ML", "", result));
  }
  if (match.moneyLineFirstHalf && match.moneyLineFirstHalf.availableInPinnacle) {
    const result = twoLinesReco(match.moneyLineFirstHalf);
    if (result)
      results.push(composeRecoBetLine(match, "1 ML", "#1X2;3", result));
  }
  if (match.dnb && match.dnb.availableInPinnacle) {
    const result = twoLinesReco(match.dnb);
    if (result) {
      results.push(
        composeValueBetLine(match, "DNB", `#dnb${delimiter}`, result)
      );
    }
  }
  if (match.doubleChance && match.doubleChance.availableInPinnacle) {
    const result = twoLinesReco(match.doubleChance);
    if (result) {
      results.push(
        composeValueBetLine(match, "DC", `#double${delimiter}`, result)
      );
    }
  }
  if (match.bts && match.bts.availableInPinnacle) {
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
function getBet365RecoBets(match) {
    const lineDelimiterBySport = {
      football: ";2",
      basketball: ";1"
    };
    const delimiter = lineDelimiterBySport[match.sport];
    const results = [];
    if (match.moneyLine && match.moneyLine.availableInPinnacle && match.moneyLine.availableInBet365) {
      const result = twoLinesPinnacleReco(match.moneyLine);
      if (result) results.push(composeRecoBetLine(match, "ML", "", result));
    }
    if (match.moneyLineFirstHalf && match.moneyLineFirstHalf.availableInPinnacle && match.moneyLineFirstHalf.availableInBet365) {
      const result = twoLinesPinnacleReco(match.moneyLineFirstHalf);
      if (result) results.push(composeRecoBetLine(match, "1 ML", "#1X2;3", result));
    }
    if (match.dnb && match.dnb.availableInPinnacle && match.dnb.availableInBet365) {
      const result = twoLinesPinnacleReco(match.dnb);
      if (result)
        results.push(
          composeRecoBetLine(match, "DNB", `#dnb${delimiter}`, result)
        );
    }
    if (match.bts && match.bts.availableInPinnacle  && match.bts.availableInBet365) {
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
  getBet365RecoBets
};
