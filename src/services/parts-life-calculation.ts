import {
  PartInstance,
  PartInstallationPeriod,
  PartSlot,
  RangeVisitStorage,
} from "../validation/storageSchemas";
import { roundsForFirearm } from "./round-usage";

/**
 * Pure parts-life derivation.
 *
 * A physical part's usage is never a resettable counter: it is derived from
 * `startingUsageRounds` plus the rounds fired while it was installed, with
 * installation periods resolved against the canonical range-visit history.
 */

export type PartStatus =
  | "not_tracked"
  | "no_part_installed"
  | "baseline_unknown"
  | "no_interval"
  | "ok"
  | "due_soon"
  | "due";

export type PartLifeResult = {
  slot: PartSlot | null;
  currentInstance: PartInstance | null;
  /** Total lifetime usage of the current instance (exact when baseline known). */
  lifetimeUsage: number;
  /** Tracked usage (ignores `startingUsageRounds`); used for unknown baselines. */
  trackedUsage: number;
  /** null when the baseline is unknown (never a misleading precise value). */
  currentUsage: number | null;
  remainingRounds: number | null;
  progress: number | null;
  status: PartStatus;
};

/** Default notify-before window: 10% of the interval (e.g. 500 on a 5,000 interval). */
export const defaultNotifyBefore = (interval: number): number =>
  Math.max(1, Math.floor(interval / 10));

/**
 * Rounds fired by `firearmId` within a half-open [installedAt, removedAt)
 * period. Installation/removal timestamps are treated as exact datetimes;
 * same-day ambiguity is resolved upstream by the caller's effective date.
 */
export const roundsInPeriod = (
  period: PartInstallationPeriod,
  rangeVisits: RangeVisitStorage[]
): number => {
  const start = new Date(period.installedAt).getTime();
  const end = period.removedAt ? new Date(period.removedAt).getTime() : Infinity;

  let sum = 0;
  for (const visit of rangeVisits) {
    const rounds = roundsForFirearm(visit, period.firearmId);
    if (rounds <= 0) continue;
    const at = new Date(visit.date).getTime();
    if (at >= start && at < end) sum += rounds;
  }
  return sum;
};

export const calculatePartInstanceUsage = (
  instance: PartInstance,
  periods: PartInstallationPeriod[],
  rangeVisits: RangeVisitStorage[]
): number => {
  const periodRounds = periods
    .filter((p) => p.partInstanceId === instance.id)
    .reduce((sum, p) => sum + roundsInPeriod(p, rangeVisits), 0);
  return instance.startingUsageRounds + periodRounds;
};

/** The installation period that has no removal date (currently installed). */
export const activePeriodForInstance = (
  instance: PartInstance,
  periods: PartInstallationPeriod[]
): PartInstallationPeriod | null =>
  periods.find(
    (p) => p.partInstanceId === instance.id && p.removedAt === undefined
  ) ?? null;

/**
 * Derive the current life/status for a part slot given its current instance.
 */
export const calculatePartStatus = (
  slot: PartSlot | null,
  currentInstance: PartInstance | null,
  periods: PartInstallationPeriod[],
  rangeVisits: RangeVisitStorage[]
): PartLifeResult => {
  if (!slot) {
    return emptyResult(null, null);
  }

  if (!slot.enabled || !currentInstance) {
    return {
      slot,
      currentInstance,
      lifetimeUsage: 0,
      trackedUsage: 0,
      currentUsage: null,
      remainingRounds: null,
      progress: null,
      status: slot.enabled ? "no_part_installed" : "not_tracked",
    };
  }

  const lifetimeUsage = calculatePartInstanceUsage(
    currentInstance,
    periods,
    rangeVisits
  );
  const trackedUsage = lifetimeUsage - currentInstance.startingUsageRounds;

  if (currentInstance.baselineType === "unknown") {
    return {
      slot,
      currentInstance,
      lifetimeUsage,
      trackedUsage,
      currentUsage: null,
      remainingRounds: null,
      progress: null,
      status: "baseline_unknown",
    };
  }

  if (!slot.serviceIntervalRounds) {
    return {
      slot,
      currentInstance,
      lifetimeUsage,
      trackedUsage,
      currentUsage: lifetimeUsage,
      remainingRounds: null,
      progress: null,
      status: "no_interval",
    };
  }

  const interval = slot.serviceIntervalRounds;
  const notifyBefore = slot.notifyBeforeRounds ?? defaultNotifyBefore(interval);

  const status: PartStatus =
    lifetimeUsage >= interval
      ? "due"
      : lifetimeUsage >= interval - notifyBefore
        ? "due_soon"
        : "ok";

  return {
    slot,
    currentInstance,
    lifetimeUsage,
    trackedUsage,
    currentUsage: lifetimeUsage,
    remainingRounds: interval - lifetimeUsage,
    progress: lifetimeUsage / interval,
    status,
  };
};

const emptyResult = (
  slot: PartSlot | null,
  currentInstance: PartInstance | null
): PartLifeResult => ({
  slot,
  currentInstance,
  lifetimeUsage: 0,
  trackedUsage: 0,
  currentUsage: null,
  remainingRounds: null,
  progress: null,
  status: "not_tracked",
});
