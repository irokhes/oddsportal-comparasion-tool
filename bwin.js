const { addZeroes } = require("./utils/utils");
const {getDiffValue, getPinnacleDiffValue} = require('./utils/diffValues');

const twoLinesReco = ({
  bwinLocalWin,
  bwinAwayWin,
  awayWinAvg,
  localWinAvg,
  pinnaLocalWin,
  pinnaAwayWin,
  localUpTrend,
  localDownTrend,
  awayUpTrend,
  awayDownTrend
}) => {
  const localDiff = getDiffValue(bwinLocalWin);
  const awayDiff = getDiffValue(bwinAwayWin);
  if (
    bwinLocalWin <= 4 &&
    bwinLocalWin > localWinAvg &&
    bwinLocalWin * localDiff >= localWinAvg
  ) {
    return {
      betTo: "local",
      odds: bwinLocalWin,
      pinnacleOdds: pinnaLocalWin,
      avgOdds: localWinAvg,
      upTrend: localUpTrend,
      downTrend: localDownTrend
    };
  }
  if (
    bwinAwayWin <= 4 &&
    bwinAwayWin > awayWinAvg &&
    bwinAwayWin * awayDiff >= awayWinAvg
  ) {
    return {
      betTo: "away",
      odds: bwinAwayWin,
      pinnacleOdds: pinnaAwayWin,
      avgOdds: awayWinAvg,
      upTrend: awayUpTrend,
      downTrend: awayDownTrend
    };
  }
};
const twoLinesPinnacleReco = ({
    bwinLocalWin,
    bwinAwayWin,
    localWinAvg,
    awayWinAvg,
    pinnaLocalWin,
    pinnaAwayWin,
    localUpTrend,
    localDownTrend,
    awayUpTrend,
    awayDownTrend
  }) => {
    const localDiff = getPinnacleDiffValue(bwinLocalWin);
    const awayDiff = getPinnacleDiffValue(bwinAwayWin);
    if (
      bwinLocalWin <= 4 &&
      bwinLocalWin > pinnaLocalWin &&
      bwinLocalWin * localDiff >= pinnaLocalWin
    ) {
      return {
        betTo: "local",
        odds: bwinLocalWin,
        pinnacleOdds: pinnaLocalWin,
        avgOdds: localWinAvg,
        upTrend: localUpTrend,
        downTrend: localDownTrend
      };
    }
    if (
      bwinAwayWin <= 4 &&
      bwinAwayWin > pinnaAwayWin &&
      bwinAwayWin * awayDiff >= pinnaAwayWin
    ) {
      return {
        betTo: "away",
        odds: bwinAwayWin,
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
      availableInBwin,
      numOfBookies,
      bwinOverOdds,
      bwinUnderOdds,
      pinnaUnderOdds,
      pinnaOverOdds,
      underOddsAvg,
      overOddsAvg,
      localUpTrend,
      localDownTrend,
      awayUpTrend,
      awayDownTrend
    } = line;

    if (!availableInBwin || numOfBookies <= 4) return list;

    const localDiff = getDiffValue(bwinOverOdds);
    const awayDiff = getDiffValue(bwinUnderOdds);
    if (
      bwinOverOdds <= 4 &&
      bwinOverOdds > overOddsAvg &&
      bwinOverOdds * localDiff >= overOddsAvg
    ) {
      list.push({
        ...line,
        betTo: "local",
        odds: bwinOverOdds,
        avgOdds: overOddsAvg,
        pinnacleOdds: pinnaOverOdds,
        upTrend: localUpTrend,
        downTrend: localDownTrend
      });
    }
    if (
      bwinUnderOdds <= 4 &&
      bwinUnderOdds > underOddsAvg &&
      bwinUnderOdds * awayDiff >= underOddsAvg
    ) {
      list.push({
        ...line,
        betTo: "away",
        odds: bwinUnderOdds,
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
        availableInBwin,
        availableInPinnacle,
        bwinOverOdds,
        bwinUnderOdds,
        underOddsAvg,
        overOddsAvg,
        pinnaUnderOdds,
        pinnaOverOdds,
        localUpTrend,
        localDownTrend,
        awayUpTrend,
        awayDownTrend
      } = line;

      if (!availableInBwin || !availableInPinnacle) return list;

      const localDiff = getPinnacleDiffValue(bwinOverOdds);
      const awayDiff = getPinnacleDiffValue(bwinUnderOdds);
      if (
        bwinOverOdds <= 4 &&
        bwinOverOdds > pinnaOverOdds &&
        bwinOverOdds * localDiff >= pinnaOverOdds
      ) {
        list.push({
          ...line,
          betTo: "local",
          odds: bwinOverOdds,
          avgOdds: overOddsAvg,
          pinnacleOdds: pinnaOverOdds,
          upTrend: localUpTrend,
          downTrend: localDownTrend
        });
      }
      if (
        bwinUnderOdds <= 4 &&
        bwinUnderOdds > pinnaUnderOdds &&
        bwinUnderOdds * awayDiff >= pinnaUnderOdds
      ) {
        list.push({
          ...line,
          betTo: "away",
          odds: bwinUnderOdds,
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
  if (match.moneyLine && match.moneyLine.availableInBwin) {
    const result = twoLinesReco(match.moneyLine);
    if (result) results.push(composeRecoBetLine(match, "ML", "", result));
  }
  if (match.moneyLineFirstHalf && match.moneyLineFirstHalf.availableInBwin) {
    const result = twoLinesReco(match.moneyLineFirstHalf);
    if (result)
      results.push(composeRecoBetLine(match, "1 ML", "#1X2;3", result));
  }
  if (match.dnb && match.dnb.availableInBwin) {
    const result = twoLinesReco(match.dnb);
    if (result) {
      results.push(
        composeValueBetLine(match, "DNB", `#dnb${delimiter}`, result)
      );
    }
  }
  if (match.doubleChance && match.doubleChance.availableInBwin) {
    const result = twoLinesReco(match.doubleChance);
    if (result) {
      results.push(
        composeValueBetLine(match, "DC", `#double${delimiter}`, result)
      );
    }
  }
  if (match.bts && match.bts.availableInBwin) {
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
    if (match.moneyLine && match.moneyLine.availableInBwin && match.moneyLine.availableInPinnacle) {
      const result = twoLinesPinnacleReco(match.moneyLine);
      if (result) results.push(composeRecoBetLine(match, "ML", "", result));
    }
    if (match.moneyLineFirstHalf && match.moneyLineFirstHalf.availableInBwin && match.moneyLineFirstHalf.availableInPinnacle) {
      const result = twoLinesPinnacleReco(match.moneyLineFirstHalf);
      if (result) results.push(composeRecoBetLine(match, "1 ML", "#1X2;3", result));
    }
    if (match.dnb && match.dnb.availableInBwin && match.dnb.availableInPinnacle) {
      const result = twoLinesPinnacleReco(match.dnb);
      if (result)
        results.push(
          composeRecoBetLine(match, "DNB", `#dnb${delimiter}`, result)
        );
    }
    if (match.bts && match.bts.availableInBwin  && match.bts.availableInPinnacle) {
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
