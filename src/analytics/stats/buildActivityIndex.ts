import { parseISO } from "date-fns";
import type {
  ActivityIndex,
  AnalyticsInputs,
  NormalizedVisit,
  ShootingUsageEvent,
} from "./types";
import type {
  AmmunitionStorage,
  FirearmStorage,
} from "../../validation/storageSchemas";
import { toDateKey } from "./dates";

export const buildActivityIndex = (inputs: AnalyticsInputs): ActivityIndex => {
  const ammoById = new Map<string, AmmunitionStorage>();
  for (const ammo of inputs.ammunition) {
    ammoById.set(ammo.id, ammo);
  }

  const firearmById = new Map<string, FirearmStorage>();
  for (const firearm of inputs.firearms) {
    firearmById.set(firearm.id, firearm);
  }

  const visits: NormalizedVisit[] = [];
  const events: ShootingUsageEvent[] = [];
  const eventsByVisit = new Map<string, ShootingUsageEvent[]>();
  const firearmNames = new Map<string, string>();
  const activeFirearmIds: string[] = [];
  const activeFirearmIdSet = new Set<string>();

  for (const firearm of inputs.firearms) {
    firearmNames.set(firearm.id, firearm.modelName);
  }

  const trackFirearmId = (firearmId: string, resolvedName: string): void => {
    const current = firearmNames.get(firearmId);
    if (current === undefined) {
      firearmNames.set(firearmId, resolvedName);
    } else if (
      current === "Deleted firearm" &&
      resolvedName !== "Deleted firearm"
    ) {
      firearmNames.set(firearmId, resolvedName);
    }
    if (!activeFirearmIdSet.has(firearmId)) {
      activeFirearmIdSet.add(firearmId);
      activeFirearmIds.push(firearmId);
    }
  };

  let earliestDateKey: string | null = null;
  let latestDateKey: string | null = null;

  for (const visit of inputs.rangeVisits) {
    const dateKey = toDateKey(parseISO(visit.date));
    if (earliestDateKey === null || dateKey < earliestDateKey) {
      earliestDateKey = dateKey;
    }
    if (latestDateKey === null || dateKey > latestDateKey) {
      latestDateKey = dateKey;
    }

    for (const firearmId of visit.firearmsUsed) {
      const name = firearmById.get(firearmId)?.modelName ?? "Deleted firearm";
      trackFirearmId(firearmId, name);
    }

    const ammunitionUsed = visit.ammunitionUsed ?? {};
    const visitEvents: ShootingUsageEvent[] = [];
    let rounds = 0;

    for (const [firearmId, entry] of Object.entries(ammunitionUsed)) {
      rounds += entry.rounds;
      const firearmName =
        entry.firearmNameSnapshot ??
        firearmById.get(firearmId)?.modelName ??
        "Deleted firearm";
      const caliber =
        entry.caliberSnapshot ?? ammoById.get(entry.ammunitionId)?.caliber ?? "";
      const pricePerRound =
        entry.pricePerRoundSnapshot ??
        ammoById.get(entry.ammunitionId)?.pricePerRound;
      const knownCost =
        pricePerRound !== undefined ? entry.rounds * pricePerRound : undefined;

      const event: ShootingUsageEvent = {
        visitId: visit.id,
        date: visit.date,
        dateKey,
        location: visit.location,
        firearmId,
        firearmName,
        ammunitionId: entry.ammunitionId,
        caliber,
        rounds: entry.rounds,
        pricePerRound,
        knownCost,
      };
      visitEvents.push(event);
      events.push(event);
      trackFirearmId(firearmId, firearmName);
    }

    eventsByVisit.set(visit.id, visitEvents);

    visits.push({
      id: visit.id,
      date: visit.date,
      dateKey,
      location: visit.location,
      firearmIds: [...visit.firearmsUsed],
      rounds,
    });
  }

  return {
    events,
    visits,
    eventsByVisit,
    firearmNames,
    activeFirearmIds,
    earliestDateKey,
    latestDateKey,
  };
};
