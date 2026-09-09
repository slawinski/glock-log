import type {
  NormalizedVisit,
  ShootingUsageEvent,
  SummaryResult,
} from "./types";

export const calculateSummary = (
  events: ShootingUsageEvent[],
  visits: NormalizedVisit[]
): SummaryResult => {
  let rounds = 0;
  let pricedRounds = 0;
  let knownCost = 0;

  for (const event of events) {
    rounds += event.rounds;
    if (event.pricePerRound !== undefined) {
      pricedRounds += event.rounds;
      knownCost += event.knownCost ?? 0;
    }
  }

  const visitCount = visits.length;
  const priceCoverage = rounds === 0 ? null : (pricedRounds / rounds) * 100;
  const avgRoundsPerVisit =
    visitCount === 0 ? null : Math.round(rounds / visitCount);

  return {
    rounds,
    visits: visitCount,
    knownCost,
    pricedRounds,
    priceCoverage,
    avgRoundsPerVisit,
    hasPriceData: pricedRounds > 0,
    hasFiredRounds: rounds > 0,
  };
};
