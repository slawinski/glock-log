import type {
  ActivityIndex,
  DailyShootingActivity,
  FilteredActivity,
  ShootingUsageEvent,
  StatsFilters,
} from "./types";
import type { AmmunitionStorage } from "../../validation/storageSchemas";
import { periodContainsDateKey } from "./dates";
import { calculateSummary } from "./calculateSummary";
import { calculateCosts } from "./calculateCosts";
import { calculateRanking } from "./calculateRanking";
import { calculateRhythm } from "./calculateRhythm";
import { aggregateTimeline } from "./aggregateTimeline";

const buildDaily = (events: ShootingUsageEvent[]): DailyShootingActivity[] => {
  const byDateKey = new Map<string, DailyShootingActivity>();

  for (const event of events) {
    let daily = byDateKey.get(event.dateKey);
    if (daily === undefined) {
      daily = {
        dateKey: event.dateKey,
        rounds: 0,
        knownCost: 0,
        pricedRounds: 0,
        visitCount: 0,
        visitIds: [],
      };
      byDateKey.set(event.dateKey, daily);
    }

    daily.rounds += event.rounds;
    if (event.pricePerRound !== undefined) {
      daily.knownCost += event.knownCost ?? 0;
      daily.pricedRounds += event.rounds;
    }
    if (!daily.visitIds.includes(event.visitId)) {
      daily.visitIds.push(event.visitId);
      daily.visitCount += 1;
    }
  }

  return [...byDateKey.values()].sort((a, b) =>
    a.dateKey.localeCompare(b.dateKey)
  );
};

export const filterActivity = (
  index: ActivityIndex,
  filters: StatsFilters,
  ammunition: AmmunitionStorage[]
): FilteredActivity => {
  const { period, firearm } = filters;

  const events = index.events.filter((event) => {
    if (!periodContainsDateKey(period.start, period.end, event.dateKey)) {
      return false;
    }
    if (firearm.kind === "firearm" && event.firearmId !== firearm.firearmId) {
      return false;
    }
    return true;
  });

  const visits = index.visits.filter((visit) => {
    if (!periodContainsDateKey(period.start, period.end, visit.dateKey)) {
      return false;
    }
    if (
      firearm.kind === "firearm" &&
      !visit.firearmIds.includes(firearm.firearmId)
    ) {
      return false;
    }
    return true;
  });

  const daily = buildDaily(events);

  return {
    events,
    visits,
    daily,
    summary: calculateSummary(events, visits),
    costs: calculateCosts(events, visits, ammunition, period),
    ranking: calculateRanking(events, "firearms"),
    rhythm: calculateRhythm(events, visits, period),
    timeline: aggregateTimeline(events, period),
  };
};
