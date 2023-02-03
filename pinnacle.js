const { addZeroes } = require("./utils/utils");
const {getDiffValue, getPinnacleDiffValue} = require('./utils/diffValues');

const twoLinesReco = ({
  pinnaLocalWin,
  pinnaAwayWin,
  awayWinAvg,
  localWinAvg,
  localWin,
  awayWin,
  localUpTrend,
  localDownTrend,
  awayUpTrend,
  awayDownTrend
}) => {
  const localDiff = getDiffValue(pinnaLocalWin);
  const awayDiff = getDiffValue(pinnaAwayWin);
  if (
    pinnaLocalWin <= 4 &&
    pinnaLocalWin > localWinAvg &&
    pinnaLocalWin * localDiff >= localWinAvg
  ) {
    return {
      betTo: "local",
      odds: pinnaLocalWin,
      pinnacleOdds: localWin,
      avgOdds: localWinAvg,
      upTrend: localUpTrend,
      downTrend: localDownTrend
    };
  }
  if (
    pinnaAwayWin <= 4 &&
    pinnaAwayWin > awayWinAvg &&
    pinnaAwayWin * awayDiff >= awayWinAvg
  ) {
    return {
      betTo: "away",
      odds: pinnaAwayWin,
      pinnacleOdds: awayWin,
      avgOdds: awayWinAvg,
      upTrend: awayUpTrend,
      downTrend: awayDownTrend
    };
  }
};
const twoLinesPinnacleReco = ({
    pinnaLocalWin,
    pinnaAwayWin,
    localWinAvg,
    awayWinAvg,
    localWin,
    awayWin,
    localUpTrend,
    localDownTrend,
    awayUpTrend,
    awayDownTrend
  }) => {
    const localDiff = getPinnacleDiffValue(pinnaLocalWin);
    const awayDiff = getPinnacleDiffValue(pinnaAwayWin);
    if (
      pinnaLocalWin <= 4 &&
      pinnaLocalWin > localWin &&
      pinnaLocalWin * localDiff >= localWin
    ) {
      return {
        betTo: "local",
        odds: pinnaLocalWin,
        bet365Odds: localWin,
        avgOdds: localWinAvg,
        upTrend: localUpTrend,
        downTrend: localDownTrend
      };
    }
    if (
      pinnaAwayWin <= 4 &&
      pinnaAwayWin > awayWin &&
      pinnaAwayWin * awayDiff >= awayWin
    ) {
      return {
        betTo: "away",
        odds: pinnaAwayWin,
        bet365Odds: awayWin,
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
      pinnaOverOdds,
      pinnaUnderOdds,
      underOddsAvg,
      overOddsAvg,
      localUpTrend,
      localDownTrend,
      awayUpTrend,
      awayDownTrend
    } = line;

    if (!availableInPinnacle || numOfBookies <= 4) return list;

    const localDiff = getDiffValue(pinnaOverOdds);
    const awayDiff = getDiffValue(pinnaUnderOdds);
    if (
      pinnaOverOdds <= 4 &&
      pinnaOverOdds > overOddsAvg &&
      pinnaOverOdds * localDiff >= overOddsAvg
    ) {
      list.push({
        ...line,
        betTo: "local",
        odds: pinnaOverOdds,
        avgOdds: overOddsAvg,
        pinnacleOdds: pinnaOverOdds,
        upTrend: localUpTrend,
        downTrend: localDownTrend
      });
    }
    if (
      pinnaUnderOdds <= 4 &&
      pinnaUnderOdds > underOddsAvg &&
      pinnaUnderOdds * awayDiff >= underOddsAvg
    ) {
      list.push({
        ...line,
        betTo: "away",
        odds: pinnaUnderOdds,
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
        pinnaOverOdds,
        pinnaUnderOdds,
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

      const localDiff = getPinnacleDiffValue(pinnaOverOdds);
      const awayDiff = getPinnacleDiffValue(pinnaUnderOdds);
      if (
        pinnaOverOdds <= 4 &&
        pinnaOverOdds > pinnaOverOdds &&
        pinnaOverOdds * localDiff >= overOdds
      ) {
        list.push({
          ...line,
          betTo: "local",
          odds: pinnaOverOdds,
          avgOdds: overOddsAvg,
          bet365Odds: overOdds,
          upTrend: localUpTrend,
          downTrend: localDownTrend
        });
      }
      if (
        pinnaUnderOdds <= 4 &&
        pinnaUnderOdds > pinnaUnderOdds &&
        pinnaUnderOdds * awayDiff >= underOdds
      ) {
        list.push({
          ...line,
          betTo: "away",
          odds: pinnaUnderOdds,
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
  bet365Odds: valueBet.bet365Odds,
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
    bet365Odds: valueBet.bet365Odds,
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
