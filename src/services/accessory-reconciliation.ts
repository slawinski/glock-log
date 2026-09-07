import { AccessoryStorage, RangeVisitStorage } from "../validation/storageSchemas";
import { roundsForFirearm } from "./round-usage";

/**
 * Pure accessory reconciliation detection.
 *
 * Mount history describes where an accessory *should have been*; saved
 * range-visit accessory usage describes where it was *actually used*. This
 * module compares the two without ever mutating data, producing the three
 * reconciliation categories:
 *
 * - missingUsage:  a visit lies inside a mount interval but has no usage record.
 * - ambiguousUsage: same-day boundary where exact ordering is unknown.
 * - outsideMountUsage: saved usage whose visit now falls outside mount history.
 */

export type CandidateUsage = {
  visitId: string;
  visitDate: string;
  firearmId: string;
  firearmNameSnapshot: string;
  firearmRounds: number;
  mountSessionId: string;
  confidence: "inside_interval" | "same_day_ambiguous";
};

export type UsageConflict = {
  visitId: string;
  accessoryId: string;
  firearmId: string;
  rounds: number;
  visitDate: string;
};

export type AccessoryReconciliation = {
  missingUsage: CandidateUsage[];
  ambiguousUsage: CandidateUsage[];
  outsideMountUsage: UsageConflict[];
};

const startOfDay = (date: string): number => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

type Containment = "inside" | "ambiguous" | "outside";

const mountContainsVisit = (
  visit: RangeVisitStorage,
  mount: AccessoryStorage["mountHistory"][number]
): Containment => {
  const visitDay = startOfDay(visit.date);
  const mountedDay = startOfDay(mount.mountedAt);
  const unmountedDay = mount.unmountedAt ? startOfDay(mount.unmountedAt) : null;

  if (visitDay < mountedDay) return "outside";
  if (unmountedDay !== null && visitDay >= unmountedDay) return "outside";
  if (visitDay === mountedDay) return "ambiguous";
  return "inside";
};

const hasUsage = (
  visit: RangeVisitStorage,
  accessoryId: string,
  firearmId: string
): boolean =>
  (visit.accessoryUsage ?? []).some(
    (u) => u.accessoryId === accessoryId && u.firearmId === firearmId
  );

export const findReconciliation = (
  accessory: AccessoryStorage,
  rangeVisits: RangeVisitStorage[]
): AccessoryReconciliation => {
  const missingUsage: CandidateUsage[] = [];
  const ambiguousUsage: CandidateUsage[] = [];
  const outsideMountUsage: UsageConflict[] = [];

  // Conflicts: saved usage whose visit is no longer inside any mount interval.
  for (const visit of rangeVisits) {
    const usages = (visit.accessoryUsage ?? []).filter(
      (u) => u.accessoryId === accessory.id
    );
    for (const usage of usages) {
      const covered = accessory.mountHistory.some(
        (m) =>
          m.firearmId === usage.firearmId &&
          mountContainsVisit(visit, m) !== "outside"
      );
      if (!covered) {
        outsideMountUsage.push({
          visitId: visit.id,
          accessoryId: accessory.id,
          firearmId: usage.firearmId,
          rounds: usage.rounds,
          visitDate: visit.date,
        });
      }
    }
  }

  // Missing/ambiguous candidates: visits inside a mount interval, no usage yet.
  for (const mount of accessory.mountHistory) {
    for (const visit of rangeVisits) {
      if (!visit.firearmsUsed.includes(mount.firearmId)) continue;
      const rounds = roundsForFirearm(visit, mount.firearmId);
      if (rounds <= 0) continue;
      if (hasUsage(visit, accessory.id, mount.firearmId)) continue;

      const containment = mountContainsVisit(visit, mount);
      if (containment === "outside") continue;

      const candidate: CandidateUsage = {
        visitId: visit.id,
        visitDate: visit.date,
        firearmId: mount.firearmId,
        firearmNameSnapshot: mount.firearmNameSnapshot,
        firearmRounds: rounds,
        mountSessionId: mount.id,
        confidence:
          containment === "inside" ? "inside_interval" : "same_day_ambiguous",
      };

      if (containment === "inside") missingUsage.push(candidate);
      else ambiguousUsage.push(candidate);
    }
  }

  return { missingUsage, ambiguousUsage, outsideMountUsage };
};
