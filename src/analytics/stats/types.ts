/**
 * Canonical types for the Statistics analytics layer.
 *
 * The analytics layer sits between raw storage (src/services) and the
 * presentation components (Stats screen). It normalizes storage entities into
 * a flat set of "shooting usage events" once, then derives every statistic
 * (summary, step graph, calendar, costs, ranking, rhythm) from that single
 * normalized index so all sections agree on the same filtered dataset.
 *
 * Date convention (spec §26): dates are grouped by the user's local calendar
 * day. A "dateKey" is the local date string `yyyy-MM-dd` produced by date-fns
 * `format(date, "yyyy-MM-dd")` (never a UTC conversion), which prevents a
 * visit near midnight from leaking into a neighboring day.
 */

import type {
  AmmunitionStorage,
  FirearmStorage,
  RangeVisitStorage,
} from "../../validation/storageSchemas";

/** Available global period filters. */
export const PERIOD_IDS = ["3M", "6M", "YTD", "1Y", "ALL"] as const;
export type PeriodFilterId = (typeof PERIOD_IDS)[number];

/** Global firearm filter: everything, or a single firearm. */
export type FirearmSelection =
  | { kind: "all" }
  | { kind: "firearm"; firearmId: string };

/** A single firearm/ammunition round usage inside a visit. */
export type ShootingUsageEvent = {
  visitId: string;
  /** Original ISO datetime string from the stored visit. */
  date: string;
  /** Local calendar date key `yyyy-MM-dd`. */
  dateKey: string;
  location: string;
  firearmId: string;
  firearmName: string;
  ammunitionId?: string;
  caliber: string;
  rounds: number;
  /** Unit price resolved via snapshot → current ammo → unknown (spec §11.5). */
  pricePerRound?: number;
  /** `rounds * pricePerRound`, present only when pricePerRound is present. */
  knownCost?: number;
};

/** Visit-level normalization (one entry per range visit). */
export type NormalizedVisit = {
  id: string;
  /** Original ISO datetime string. */
  date: string;
  /** Local calendar date key `yyyy-MM-dd`. */
  dateKey: string;
  location: string;
  /** Firearms used in this visit (may include firearms with zero rounds). */
  firearmIds: string[];
  /** Total rounds fired in this visit (sum of its ammo entries). */
  rounds: number;
};

/** Combined activity for a single calendar day (spec §8.1). */
export type DailyShootingActivity = {
  dateKey: string;
  rounds: number;
  knownCost: number;
  pricedRounds: number;
  visitCount: number;
  visitIds: string[];
};

/** The normalized index built once from raw storage. */
export type ActivityIndex = {
  /** Round-level events, one per (visit, firearm) ammo entry. */
  events: ShootingUsageEvent[];
  /** Visit-level records. */
  visits: NormalizedVisit[];
  /** Events grouped by visit id. */
  eventsByVisit: Map<string, ShootingUsageEvent[]>;
  /** firearmId → display name, for the filter list (incl. deleted firearms). */
  firearmNames: Map<string, string>;
  /** firearmIds that appear in at least one visit (historical activity). */
  activeFirearmIds: string[];
  /** Earliest activity date key, or null when no activity exists. */
  earliestDateKey: string | null;
  /** Latest activity date key, or null when no activity exists. */
  latestDateKey: string | null;
};

/** A resolved period window. */
export type ResolvedPeriod = {
  id: PeriodFilterId;
  /** Inclusive start of the window (local calendar). */
  start: Date;
  /** Inclusive end of the window (local calendar). */
  end: Date;
  /** Approximate span in days, used to pick the display bucket. */
  spanDays: number;
};

export type BucketGranularity = "day" | "week" | "month" | "quarter" | "year";

/** A single cumulative step in the ammunition-usage graph (spec §8.3). */
export type TimelineBucket = {
  /** Local date key of the bucket's first day. */
  startDateKey: string;
  /** Local date key of the bucket's last day (inclusive). */
  endDateKey: string;
  /** Display label, e.g. "AUG 3–9", "JUNE 2025", "Q3 2024", "2024". */
  label: string;
  granularity: BucketGranularity;
  rounds: number;
  knownCost: number;
  pricedRounds: number;
  visitCount: number;
  cumulativeRounds: number;
  cumulativeKnownCost: number;
};

/** Summary-section metrics (spec §6). */
export type SummaryResult = {
  /** Total fired rounds in the filtered set. */
  rounds: number;
  /** Number of matching visits. */
  visits: number;
  /** Known monetary value of fired rounds (0 when nothing is priced). */
  knownCost: number;
  /** Fired rounds with a known price. */
  pricedRounds: number;
  /** 0–100, or null when no fired rounds exist. */
  priceCoverage: number | null;
  /** Whole-number average rounds per visit, or null when no visits. */
  avgRoundsPerVisit: number | null;
  /** Whether any fired round has a known price. */
  hasPriceData: boolean;
  /** Whether any rounds were fired at all. */
  hasFiredRounds: boolean;
};

/** Costs-section metrics (spec §10). */
export type CostResult = {
  /** Cash spent on ammunition purchased inside the period (not firearm-scoped). */
  ammoPurchased: number;
  /** Known value of fired ammunition. */
  ammoFired: number;
  /** Known fired cost ÷ priced fired rounds, or null when nothing is priced. */
  avgCostPerRound: number | null;
  /** Known fired cost ÷ visits containing at least one fired round, or null. */
  avgAmmoCostPerVisit: number | null;
  /** Current inventory value (not period-filtered). */
  currentStockValue: number;
  /** 0–100, or null when no fired rounds exist. */
  priceCoverage: number | null;
  hasPriceData: boolean;
};

/** A single bar in the usage ranking (spec §12–13). */
export type RankingEntry = {
  key: string;
  label: string;
  rounds: number;
  /** Fraction of total filtered rounds (0–1). */
  share: number;
};

/** Shooting-rhythm metrics (spec §14). */
export type RhythmResult = {
  /** Mean days between consecutive visits, or null when <2 visits. */
  avgBetweenVisitsDays: number | null;
  /** Average monthly rounds incl. zero-activity months, or null. */
  roundsPerMonth: number | null;
  mostActiveMonth: {
    key: string;
    label: string;
    rounds: number;
    visits: number;
  } | null;
  /** Longest visit-to-visit interval in days, or null when <2 visits. */
  longestGapDays: number | null;
};

/** Raw storage inputs to the analytics layer (never mutated). */
export type AnalyticsInputs = {
  firearms: FirearmStorage[];
  ammunition: AmmunitionStorage[];
  rangeVisits: RangeVisitStorage[];
};

/** Filters applied to derive the filtered dataset (spec §16). */
export type StatsFilters = {
  period: ResolvedPeriod;
  firearm: FirearmSelection;
};

/** The filtered, ready-to-render dataset produced for a set of filters. */
export type FilteredActivity = {
  events: ShootingUsageEvent[];
  visits: NormalizedVisit[];
  daily: DailyShootingActivity[];
  summary: SummaryResult;
  costs: CostResult;
  ranking: RankingEntry[];
  rhythm: RhythmResult;
  timeline: TimelineBucket[];
};
