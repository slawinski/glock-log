import {
  CleaningEvent,
  CleaningSettings,
  CleaningType,
  RangeVisitStorage,
} from "../validation/storageSchemas";
import { roundsForFirearm } from "./round-usage";

/**
 * Pure cleaning-timeline derivation.
 *
 * The core product rule: cleaning is a *derived* maintenance timeline over the
 * canonical "range visit → firearm rounds" history. Nothing here touches
 * storage; consumers (screens) receive already-computed status and history so
 * they never implement maintenance arithmetic themselves.
 */

export const DEFAULT_WARNING_THRESHOLD_PERCENT = 80;

export type CleaningIntervalStatus =
  | "not_configured"
  | "not_initialized"
  | "ok"
  | "due_soon"
  | "due";

export type CleaningIntervalResult = {
  enabled: boolean;
  interval: number | null;
  /** null means the value is unknown / not initialized, never a fake 0. */
  roundsSinceCleaning: number | null;
  remainingRounds: number | null;
  progress: number | null;
  status: CleaningIntervalStatus;
  lastCleaningEvent: CleaningEvent | null;
};

export type CleaningStatus = {
  fieldStrip: CleaningIntervalResult;
  completeDisassembly: CleaningIntervalResult;
};

export type CleaningEventStats = {
  event: CleaningEvent;
  roundsSincePreviousFieldStrip: number;
  roundsSincePreviousComplete: number;
  mileageAtEvent: number;
};

const startOfDay = (date: Date): number => {
  const copy = new Date(date.getTime());
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
};

const isSameDay = (a: Date, b: Date): boolean =>
  startOfDay(a) === startOfDay(b);

/**
 * Default same-day ordering: range activity is treated as occurring before a
 * date-only cleaning. A visit on the same calendar day as a cleaning therefore
 * belongs to the interval that just ended (matches the most common workflow).
 */
export const visitAfterCleaning = (
  visitDate: string,
  cleaningAt: string
): boolean => {
  const visit = new Date(visitDate);
  const cleaning = new Date(cleaningAt);
  if (isSameDay(visit, cleaning)) return false;
  return visit.getTime() > cleaning.getTime();
};

const byPerformedAt = (a: CleaningEvent, b: CleaningEvent): number => {
  const delta =
    new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime();
  if (delta !== 0) return delta;
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
};

/**
 * Latest cleaning event that qualifies as the reset point for a given counter.
 *
 * - field_strip: either type qualifies (complete cleaning inherently satisfies
 *   the lesser routine-cleaning requirement).
 * - complete_disassembly: only complete cleanings qualify.
 */
const latestQualifyingCleaning = (
  cleanings: CleaningEvent[],
  kind: CleaningType
): CleaningEvent | null => {
  const candidates =
    kind === "complete_disassembly"
      ? cleanings.filter((c) => c.type === "complete_disassembly")
      : cleanings;
  return candidates.length > 0 ? candidates[candidates.length - 1] : null;
};

/**
 * Derive the current cleaning status for both intervals of one firearm.
 *
 * `settings` may be undefined (never configured); `events` are the firearm's
 * cleaning events; `rangeVisits` is the full range history.
 */
export const calculateCleaningStatus = (
  settings: CleaningSettings | undefined,
  events: CleaningEvent[],
  rangeVisits: RangeVisitStorage[],
  firearmId: string
): CleaningStatus => {
  const baseline = settings?.trackingBaselineAt;
  const baselineTime = baseline ? new Date(baseline).getTime() : null;

  const cleanings = events
    .filter((e) => e.firearmId === firearmId)
    .filter(
      (e) =>
        baselineTime === null ||
        new Date(e.performedAt).getTime() >= baselineTime
    )
    .sort(byPerformedAt);

  return {
    fieldStrip: computeInterval(
      settings,
      settings?.fieldStripEnabled ?? false,
      settings?.fieldStripIntervalRounds,
      cleanings,
      rangeVisits,
      firearmId,
      "field_strip",
      baseline
    ),
    completeDisassembly: computeInterval(
      settings,
      settings?.completeEnabled ?? false,
      settings?.completeIntervalRounds,
      cleanings,
      rangeVisits,
      firearmId,
      "complete_disassembly",
      baseline
    ),
  };
};

const computeInterval = (
  settings: CleaningSettings | undefined,
  enabled: boolean,
  intervalRounds: number | undefined,
  cleanings: CleaningEvent[],
  rangeVisits: RangeVisitStorage[],
  firearmId: string,
  kind: CleaningType,
  baseline: string | undefined
): CleaningIntervalResult => {
  const interval = intervalRounds ?? null;
  if (!enabled || interval === null) {
    return {
      enabled: false,
      interval,
      roundsSinceCleaning: null,
      remainingRounds: null,
      progress: null,
      status: "not_configured",
      lastCleaningEvent: null,
    };
  }

  const lastCleaningEvent = latestQualifyingCleaning(cleanings, kind);
  const startAt = lastCleaningEvent
    ? lastCleaningEvent.performedAt
    : baseline ?? null;

  if (!startAt) {
    // Enabled, but no baseline and no qualifying history → unknown.
    return {
      enabled: true,
      interval,
      roundsSinceCleaning: null,
      remainingRounds: null,
      progress: null,
      status: "not_initialized",
      lastCleaningEvent: null,
    };
  }

  let rounds = 0;
  for (const visit of rangeVisits) {
    const visitRounds = roundsForFirearm(visit, firearmId);
    if (visitRounds <= 0) continue;
    const after = lastCleaningEvent
      ? visitAfterCleaning(visit.date, startAt)
      : new Date(visit.date).getTime() > new Date(startAt).getTime();
    if (after) rounds += visitRounds;
  }

  const threshold =
    settings?.warningThresholdPercent ?? DEFAULT_WARNING_THRESHOLD_PERCENT;
  const progress = rounds / interval;
  const status: CleaningIntervalStatus =
    progress < threshold / 100
      ? "ok"
      : progress < 1
        ? "due_soon"
        : "due";

  return {
    enabled: true,
    interval,
    roundsSinceCleaning: rounds,
    remainingRounds: interval - rounds,
    progress,
    status,
    lastCleaningEvent,
  };
};

/**
 * Rebuild the chronological cleaning timeline, deriving for each cleaning
 * event the rounds fired since the previous qualifying cleaning and the
 * firearm's mileage at that point. Reverse-chronological rendering is left to
 * the caller (events are returned in chronological order).
 */
export const calculateCleaningTimeline = (
  events: CleaningEvent[],
  rangeVisits: RangeVisitStorage[],
  firearmId: string
): CleaningEventStats[] => {
  type Activity =
    | { kind: "visit"; at: number; rounds: number }
    | { kind: "cleaning"; at: number; event: CleaningEvent };

  const activities: Activity[] = [];
  for (const visit of rangeVisits) {
    const rounds = roundsForFirearm(visit, firearmId);
    if (rounds > 0) {
      activities.push({ kind: "visit", at: new Date(visit.date).getTime(), rounds });
    }
  }
  for (const event of events) {
    if (event.firearmId !== firearmId) continue;
    activities.push({
      kind: "cleaning",
      at: new Date(event.performedAt).getTime(),
      event,
    });
  }

  activities.sort((a, b) => {
    const delta = a.at - b.at;
    if (delta !== 0) return delta;
    // Same-day default ordering: range activity → cleaning.
    if (a.kind === "cleaning" && b.kind === "visit") return 1;
    if (a.kind === "visit" && b.kind === "cleaning") return -1;
    return 0;
  });

  let fieldStripAccum = 0;
  let completeAccum = 0;
  let mileage = 0;
  const stats: CleaningEventStats[] = [];

  for (const activity of activities) {
    if (activity.kind === "visit") {
      fieldStripAccum += activity.rounds;
      completeAccum += activity.rounds;
      mileage += activity.rounds;
      continue;
    }

    const fieldPrev = fieldStripAccum;
    const completePrev = completeAccum;
    stats.push({
      event: activity.event,
      roundsSincePreviousFieldStrip: fieldPrev,
      roundsSincePreviousComplete: completePrev,
      mileageAtEvent: mileage,
    });

    if (activity.event.type === "complete_disassembly") {
      fieldStripAccum = 0;
      completeAccum = 0;
    } else {
      fieldStripAccum = 0;
    }
  }

  return stats;
};
