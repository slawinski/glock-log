import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  getQuarter,
  getYear,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from "date-fns";
import type {
  BucketGranularity,
  ResolvedPeriod,
  ShootingUsageEvent,
  TimelineBucket,
} from "./types";
import { toDateKey } from "./dates";

export const pickGranularity = (spanDays: number): BucketGranularity => {
  if (spanDays <= 92) {
    return "day";
  }
  if (spanDays <= 370) {
    return "week";
  }
  if (spanDays <= 1095) {
    return "month";
  }
  return "quarter";
};

const escalateGranularity = (
  granularity: BucketGranularity
): BucketGranularity => {
  switch (granularity) {
    case "day":
      return "week";
    case "week":
      return "month";
    case "month":
      return "quarter";
    case "quarter":
      return "year";
    case "year":
      return "year";
  }
};

const firstBucketStart = (
  granularity: BucketGranularity,
  start: Date
): Date => {
  switch (granularity) {
    case "day":
      return startOfDay(start);
    case "week":
      return startOfWeek(start, { weekStartsOn: 1 });
    case "month":
      return startOfMonth(start);
    case "quarter":
      return startOfQuarter(start);
    case "year":
      return startOfYear(start);
  }
};

const bucketEnd = (granularity: BucketGranularity, bucketStart: Date): Date => {
  switch (granularity) {
    case "day":
      return endOfDay(bucketStart);
    case "week":
      return endOfWeek(bucketStart, { weekStartsOn: 1 });
    case "month":
      return endOfMonth(bucketStart);
    case "quarter":
      return endOfQuarter(bucketStart);
    case "year":
      return endOfYear(bucketStart);
  }
};

const nextBucketStart = (
  granularity: BucketGranularity,
  bucketStart: Date
): Date => {
  switch (granularity) {
    case "day":
      return addDays(bucketStart, 1);
    case "week":
      return addWeeks(bucketStart, 1);
    case "month":
      return addMonths(bucketStart, 1);
    case "quarter":
      return addMonths(bucketStart, 3);
    case "year":
      return addYears(bucketStart, 1);
  }
};

const bucketLabel = (
  granularity: BucketGranularity,
  alignedStart: Date,
  alignedEnd: Date
): string => {
  switch (granularity) {
    case "day":
      return format(alignedStart, "MMM d").toUpperCase();
    case "week":
      return `${format(alignedStart, "MMM d").toUpperCase()}–${format(
        alignedEnd,
        "d"
      )}`;
    case "month":
      return format(alignedStart, "MMMM yyyy").toUpperCase();
    case "quarter":
      return `Q${getQuarter(alignedStart)} ${getYear(alignedStart)}`;
    case "year":
      return format(alignedStart, "yyyy");
  }
};

type BucketBoundary = {
  alignedStart: Date;
  alignedEnd: Date;
  start: Date;
  end: Date;
};

const generateBoundaries = (
  granularity: BucketGranularity,
  period: ResolvedPeriod
): BucketBoundary[] => {
  const boundaries: BucketBoundary[] = [];
  let alignedStart = firstBucketStart(granularity, period.start);

  while (true) {
    const alignedEnd = bucketEnd(granularity, alignedStart);
    const start = alignedStart < period.start ? period.start : alignedStart;
    const end = alignedEnd > period.end ? period.end : alignedEnd;

    if (end < start) {
      break;
    }

    boundaries.push({ alignedStart, alignedEnd, start, end });

    if (alignedEnd >= period.end) {
      break;
    }

    alignedStart = nextBucketStart(granularity, alignedStart);
  }

  return boundaries;
};

const findBucketIndex = (startKeys: string[], dateKey: string): number => {
  let low = 0;
  let high = startKeys.length - 1;

  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (startKeys[mid] <= dateKey) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return low;
};

export const aggregateTimeline = (
  events: ShootingUsageEvent[],
  period: ResolvedPeriod
): TimelineBucket[] => {
  let granularity = pickGranularity(period.spanDays);
  let boundaries = generateBoundaries(granularity, period);

  while (boundaries.length > 120 && granularity !== "year") {
    granularity = escalateGranularity(granularity);
    boundaries = generateBoundaries(granularity, period);
  }

  const rounds = new Array<number>(boundaries.length).fill(0);
  const knownCost = new Array<number>(boundaries.length).fill(0);
  const pricedRounds = new Array<number>(boundaries.length).fill(0);
  const visitIds = boundaries.map(() => new Set<string>());
  const startKeys = boundaries.map((boundary) => toDateKey(boundary.start));
  const endKeys = boundaries.map((boundary) => toDateKey(boundary.end));

  for (const event of events) {
    const index = findBucketIndex(startKeys, event.dateKey);
    if (
      event.dateKey < startKeys[index] ||
      event.dateKey > endKeys[index]
    ) {
      continue;
    }
    rounds[index] += event.rounds;
    if (event.pricePerRound !== undefined) {
      pricedRounds[index] += event.rounds;
      knownCost[index] += event.knownCost ?? 0;
    }
    visitIds[index].add(event.visitId);
  }

  let cumulativeRounds = 0;
  let cumulativeKnownCost = 0;

  return boundaries.map((boundary, index) => {
    cumulativeRounds += rounds[index];
    cumulativeKnownCost += knownCost[index];

    return {
      startDateKey: toDateKey(boundary.start),
      endDateKey: toDateKey(boundary.end),
      label: bucketLabel(granularity, boundary.alignedStart, boundary.alignedEnd),
      granularity,
      rounds: rounds[index],
      knownCost: knownCost[index],
      pricedRounds: pricedRounds[index],
      visitCount: visitIds[index].size,
      cumulativeRounds,
      cumulativeKnownCost,
    };
  });
};
