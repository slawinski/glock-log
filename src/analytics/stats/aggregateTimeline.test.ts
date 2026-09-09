import {
  differenceInCalendarDays,
  endOfDay,
  parseISO,
  startOfDay,
} from "date-fns";
import { aggregateTimeline, pickGranularity } from "./aggregateTimeline";
import type { ResolvedPeriod, ShootingUsageEvent } from "./types";

const makePeriod = (startKey: string, endKey: string): ResolvedPeriod => {
  const start = startOfDay(parseISO(startKey));
  const end = endOfDay(parseISO(endKey));
  return {
    id: "ALL",
    start,
    end,
    spanDays: differenceInCalendarDays(end, start) + 1,
  };
};

const makeEvent = (
  overrides: Partial<ShootingUsageEvent>
): ShootingUsageEvent => ({
  visitId: "v1",
  date: "2026-01-01T12:00:00",
  dateKey: "2026-01-01",
  location: "Range",
  firearmId: "f1",
  firearmName: "Gun",
  caliber: "9mm",
  rounds: 100,
  pricePerRound: 1,
  knownCost: 100,
  ...overrides,
});

describe("pickGranularity", () => {
  it("picks day, week, month, quarter across thresholds", () => {
    expect(pickGranularity(1)).toBe("day");
    expect(pickGranularity(92)).toBe("day");
    expect(pickGranularity(93)).toBe("week");
    expect(pickGranularity(370)).toBe("week");
    expect(pickGranularity(371)).toBe("month");
    expect(pickGranularity(1095)).toBe("month");
    expect(pickGranularity(1096)).toBe("quarter");
  });
});

describe("aggregateTimeline", () => {
  it("labels a single day", () => {
    const timeline = aggregateTimeline(
      [makeEvent({ dateKey: "2026-09-12" })],
      makePeriod("2026-09-12", "2026-09-12")
    );

    expect(timeline).toHaveLength(1);
    expect(timeline[0].granularity).toBe("day");
    expect(timeline[0].label).toBe("SEP 12");
  });

  it("produces weekly buckets with Monday-aligned labels", () => {
    const timeline = aggregateTimeline(
      [makeEvent({ dateKey: "2026-08-05" })],
      makePeriod("2026-08-03", "2026-11-05")
    );

    expect(timeline[0].granularity).toBe("week");
    expect(timeline[0].label).toBe("AUG 3–9");
  });

  it("produces monthly buckets", () => {
    const timeline = aggregateTimeline(
      [makeEvent({ dateKey: "2025-06-15" })],
      makePeriod("2025-06-01", "2026-06-30")
    );

    expect(timeline[0].granularity).toBe("month");
    expect(timeline[0].label).toBe("JUNE 2025");
  });

  it("produces quarterly buckets", () => {
    const timeline = aggregateTimeline(
      [makeEvent({ dateKey: "2024-07-20" })],
      makePeriod("2024-07-01", "2027-12-31")
    );

    expect(timeline[0].granularity).toBe("quarter");
    expect(timeline[0].label).toBe("Q3 2024");
  });

  it("escalates to years for very long spans and stays bounded", () => {
    const timeline = aggregateTimeline(
      [makeEvent({ dateKey: "1950-06-01" })],
      makePeriod("1950-01-01", "2026-12-31")
    );

    expect(timeline[0].granularity).toBe("year");
    expect(timeline[0].label).toBe("1950");
    expect(timeline.length).toBeLessThanOrEqual(120);
  });

  it("emits empty buckets so inactivity renders as a flat step", () => {
    const timeline = aggregateTimeline(
      [
        makeEvent({ dateKey: "2025-01-15", rounds: 100, knownCost: 100 }),
        makeEvent({ dateKey: "2026-12-15", rounds: 50, knownCost: 50 }),
      ],
      makePeriod("2025-01-01", "2026-12-31")
    );

    expect(timeline).toHaveLength(24);
    expect(timeline[0].rounds).toBe(100);
    expect(timeline[timeline.length - 1].rounds).toBe(50);
    expect(timeline[1].rounds).toBe(0);
  });

  it("reconciles the final cumulative total with the full round sum", () => {
    const events = [
      makeEvent({ dateKey: "2025-01-15", rounds: 100, knownCost: 100 }),
      makeEvent({ dateKey: "2025-06-15", rounds: 250, knownCost: 500 }),
      makeEvent({ dateKey: "2026-12-15", rounds: 50, knownCost: 50 }),
    ];
    const timeline = aggregateTimeline(events, makePeriod("2025-01-01", "2026-12-31"));

    const totalRounds = events.reduce((sum, event) => sum + event.rounds, 0);
    const totalCost = events.reduce(
      (sum, event) => sum + (event.knownCost ?? 0),
      0
    );

    expect(timeline[timeline.length - 1].cumulativeRounds).toBe(totalRounds);
    expect(timeline[timeline.length - 1].cumulativeKnownCost).toBe(totalCost);
  });

  it("counts distinct visits per bucket", () => {
    const timeline = aggregateTimeline(
      [
        makeEvent({ visitId: "v1", dateKey: "2026-09-12", rounds: 10 }),
        makeEvent({ visitId: "v2", dateKey: "2026-09-12", rounds: 10 }),
      ],
      makePeriod("2026-09-12", "2026-09-12")
    );

    expect(timeline[0].visitCount).toBe(2);
    expect(timeline[0].rounds).toBe(20);
  });

  it("ignores events outside the period bounds", () => {
    const timeline = aggregateTimeline(
      [
        makeEvent({ dateKey: "2026-09-12", rounds: 100 }),
        makeEvent({ dateKey: "2026-01-01", rounds: 999 }),
      ],
      makePeriod("2026-09-12", "2026-09-12")
    );

    expect(timeline).toHaveLength(1);
    expect(timeline[0].rounds).toBe(100);
  });
});
