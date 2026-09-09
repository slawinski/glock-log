import { parseISO } from "date-fns";
import type {
  CostResult,
  NormalizedVisit,
  ResolvedPeriod,
  ShootingUsageEvent,
} from "./types";
import type { AmmunitionStorage } from "../../validation/storageSchemas";
import { periodContainsDateKey, toDateKey } from "./dates";

export const calculateCosts = (
  events: ShootingUsageEvent[],
  visits: NormalizedVisit[],
  ammunition: AmmunitionStorage[],
  period: ResolvedPeriod
): CostResult => {
  let ammoPurchased = 0;
  for (const ammo of ammunition) {
    const dateKey = toDateKey(parseISO(ammo.datePurchased));
    if (periodContainsDateKey(period.start, period.end, dateKey)) {
      ammoPurchased += ammo.amountPaid;
    }
  }

  let rounds = 0;
  let pricedRounds = 0;
  let knownCost = 0;
  const firingVisitIds = new Set<string>();

  for (const event of events) {
    rounds += event.rounds;
    if (event.rounds > 0) {
      firingVisitIds.add(event.visitId);
    }
    if (event.pricePerRound !== undefined) {
      pricedRounds += event.rounds;
      knownCost += event.knownCost ?? 0;
    }
  }

  const avgCostPerRound = pricedRounds === 0 ? null : knownCost / pricedRounds;

  const firingVisits = visits.filter((visit) =>
    firingVisitIds.has(visit.id)
  ).length;
  const avgAmmoCostPerVisit =
    firingVisits === 0 ? null : knownCost / firingVisits;

  let currentStockValue = 0;
  for (const ammo of ammunition) {
    if (ammo.pricePerRound !== undefined) {
      currentStockValue += ammo.quantity * ammo.pricePerRound;
    }
  }

  const priceCoverage = rounds === 0 ? null : (pricedRounds / rounds) * 100;

  return {
    ammoPurchased,
    ammoFired: knownCost,
    avgCostPerRound,
    avgAmmoCostPerVisit,
    currentStockValue,
    priceCoverage,
    hasPriceData: pricedRounds > 0,
  };
};
