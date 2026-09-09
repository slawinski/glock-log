import { parseISO } from "date-fns";
import { filterActivity } from "./filter";
import { buildActivityIndex } from "./buildActivityIndex";
import { resolvePeriod } from "./period";
import { makeAmmo, makeFirearm, makeVisit, localIso } from "./fixtures";
import type { RangeVisitStorage } from "../../validation/storageSchemas";

const today = parseISO("2026-08-12T12:00:00");
const ammo = [makeAmmo({ id: "a1", pricePerRound: 1 })];

const allFilters = (index: ReturnType<typeof buildActivityIndex>) => ({
  period: resolvePeriod("ALL", today, index),
  firearm: { kind: "all" as const },
});

describe("filterActivity", () => {
  it("Case D: merges same-day visits into a single daily record", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition: ammo,
      rangeVisits: [
        makeVisit({ id: "v1", date: localIso(2026, 1, 10), ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 100 } } }),
        makeVisit({ id: "v2", date: localIso(2026, 1, 10), ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 200 } } }),
      ],
    });

    const result = filterActivity(index, allFilters(index), ammo);

    expect(result.daily).toHaveLength(1);
    expect(result.daily[0]).toMatchObject({
      dateKey: "2026-01-10",
      rounds: 300,
      visitCount: 2,
    });
    expect(result.daily[0].visitIds).toEqual(["v1", "v2"]);
  });

  it("Case F: firearm filter keeps matching events and visits only", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" }), makeFirearm({ id: "f2" })],
      ammunition: ammo,
      rangeVisits: [
        makeVisit({
          id: "v1",
          firearmsUsed: ["f1"],
          ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 100 } },
        }),
        makeVisit({
          id: "v2",
          firearmsUsed: ["f2"],
          ammunitionUsed: { f2: { ammunitionId: "a1", rounds: 50 } },
        }),
      ],
    });

    const unfiltered = filterActivity(index, allFilters(index), ammo);
    expect(unfiltered.summary.rounds).toBe(150);
    expect(unfiltered.summary.visits).toBe(2);

    const filtered = filterActivity(
      index,
      {
        period: resolvePeriod("ALL", today, index),
        firearm: { kind: "firearm", firearmId: "f1" },
      },
      ammo
    );

    expect(filtered.events).toHaveLength(1);
    expect(filtered.visits).toHaveLength(1);
    expect(filtered.summary.rounds).toBe(100);
    expect(filtered.summary.visits).toBe(1);
    expect(filtered.events[0].firearmId).toBe("f1");
  });

  it("filters events by period boundaries", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition: ammo,
      rangeVisits: [
        makeVisit({ id: "v1", date: localIso(2026, 6, 10), ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 100 } } }),
        makeVisit({ id: "v2", date: localIso(2025, 6, 10), ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 40 } } }),
      ],
    });

    const result = filterActivity(
      index,
      { period: resolvePeriod("3M", today, index), firearm: { kind: "all" } },
      ammo
    );

    expect(result.visits).toHaveLength(1);
    expect(result.summary.rounds).toBe(100);
  });

  it("exposes a full derived dataset", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition: ammo,
      rangeVisits: [
        makeVisit({ id: "v1", date: localIso(2026, 1, 10), ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 100 } } }),
        makeVisit({ id: "v2", date: localIso(2026, 1, 20), ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 100 } } }),
      ],
    });

    const result = filterActivity(index, allFilters(index), ammo);

    expect(result.summary.rounds).toBe(200);
    expect(result.costs.ammoFired).toBe(200);
    expect(result.ranking).toHaveLength(1);
    expect(result.rhythm.avgBetweenVisitsDays).toBe(10);
    expect(result.timeline.length).toBeGreaterThan(0);
  });

  it("6M period resolves to weekly timeline buckets", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition: ammo,
      rangeVisits: [
        makeVisit({ id: "v1", date: localIso(2026, 4, 1), ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 100 } } }),
      ],
    });

    const result = filterActivity(
      index,
      { period: resolvePeriod("6M", today, index), firearm: { kind: "all" } },
      ammo
    );

    expect(result.timeline.every((bucket) => bucket.granularity === "week")).toBe(true);
    expect(result.timeline.length).toBeLessThanOrEqual(120);
  });

  it("an 8-year ALL period resolves to quarterly buckets", () => {
    const visits: RangeVisitStorage[] = [];
    for (let i = 0; i < 200; i += 1) {
      const year = 2018 + Math.floor((i * 8) / 200);
      visits.push(
        makeVisit({
          id: `v${i}`,
          date: localIso(year, (i % 12) + 1, (i % 28) + 1),
          ammunitionUsed: { f1: { ammunitionId: "a1", rounds: (i % 10) + 1 } },
        })
      );
    }

    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition: ammo,
      rangeVisits: visits,
    });

    const result = filterActivity(index, allFilters(index), ammo);

    expect(result.timeline[0].granularity).toBe("quarter");
    expect(result.timeline.length).toBeLessThanOrEqual(120);
  });

  it("handles 2,000 visits over 8 years without truncation", () => {
    const count = 2000;
    const visits: RangeVisitStorage[] = [];
    for (let i = 0; i < count; i += 1) {
      visits.push(
        makeVisit({
          id: `v${i}`,
          date: localIso(2018 + Math.floor((i * 8) / count), (i % 12) + 1, (i % 28) + 1),
          ammunitionUsed: { f1: { ammunitionId: "a1", rounds: (i % 50) + 1 } },
        })
      );
    }

    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition: ammo,
      rangeVisits: visits,
    });
    const result = filterActivity(index, allFilters(index), ammo);

    const expectedRounds = visits.reduce(
      (sum, _visit, i) => sum + ((i % 50) + 1),
      0
    );

    expect(result.events).toHaveLength(count);
    expect(result.visits).toHaveLength(count);
    expect(result.summary.rounds).toBe(expectedRounds);
    expect(result.timeline.length).toBeLessThanOrEqual(120);
    expect(result.timeline[result.timeline.length - 1].cumulativeRounds).toBe(
      expectedRounds
    );
  });

  it("handles 10,000 visits without pathological time or truncation", () => {
    const count = 10000;
    const visits: RangeVisitStorage[] = [];
    for (let i = 0; i < count; i += 1) {
      visits.push(
        makeVisit({
          id: `v${i}`,
          date: localIso(2018 + Math.floor((i * 8) / count), (i % 12) + 1, (i % 28) + 1),
          ammunitionUsed: { f1: { ammunitionId: "a1", rounds: (i % 50) + 1 } },
        })
      );
    }

    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition: ammo,
      rangeVisits: visits,
    });
    const result = filterActivity(index, allFilters(index), ammo);

    const expectedRounds = visits.reduce(
      (sum, _visit, i) => sum + ((i % 50) + 1),
      0
    );

    expect(result.events).toHaveLength(count);
    expect(result.summary.rounds).toBe(expectedRounds);
    expect(result.timeline.length).toBeLessThanOrEqual(120);
    expect(result.timeline[result.timeline.length - 1].cumulativeRounds).toBe(
      expectedRounds
    );
  });
});
