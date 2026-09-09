import { calculateSummary } from "./calculateSummary";
import { buildActivityIndex } from "./buildActivityIndex";
import { makeAmmo, makeFirearm, makeVisit, localIso } from "./fixtures";
import type { NormalizedVisit, ShootingUsageEvent } from "./types";

const events = (list: ShootingUsageEvent[]) => list;
const visits = (list: NormalizedVisit[]) => list;

describe("calculateSummary", () => {
  it("Case A: two visits of 100 rounds each at 1 unit", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition: [makeAmmo({ id: "a1", pricePerRound: 1 })],
      rangeVisits: [
        makeVisit({ id: "v1", date: localIso(2026, 1, 10), ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 100 } } }),
        makeVisit({ id: "v2", date: localIso(2026, 1, 11), ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 100 } } }),
      ],
    });

    const summary = calculateSummary(index.events, index.visits);

    expect(summary.rounds).toBe(200);
    expect(summary.visits).toBe(2);
    expect(summary.knownCost).toBe(200);
    expect(summary.pricedRounds).toBe(200);
    expect(summary.priceCoverage).toBe(100);
    expect(summary.avgRoundsPerVisit).toBe(100);
    expect(summary.hasPriceData).toBe(true);
    expect(summary.hasFiredRounds).toBe(true);
  });

  it("Case C: partial pricing yields 50% coverage", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition: [
        makeAmmo({ id: "a1", pricePerRound: 1 }),
        makeAmmo({ id: "a2", pricePerRound: undefined }),
      ],
      rangeVisits: [
        makeVisit({
          id: "v1",
          ammunitionUsed: {
            f1: { ammunitionId: "a1", rounds: 100 },
            f2: { ammunitionId: "a2", rounds: 100 },
          },
          firearmsUsed: ["f1", "f2"],
        }),
      ],
    });

    const summary = calculateSummary(index.events, index.visits);

    expect(summary.rounds).toBe(200);
    expect(summary.knownCost).toBe(100);
    expect(summary.pricedRounds).toBe(100);
    expect(summary.priceCoverage).toBe(50);
  });

  it("returns nulls for empty datasets", () => {
    const summary = calculateSummary(events([]), visits([]));

    expect(summary.rounds).toBe(0);
    expect(summary.visits).toBe(0);
    expect(summary.priceCoverage).toBeNull();
    expect(summary.avgRoundsPerVisit).toBeNull();
    expect(summary.hasPriceData).toBe(false);
    expect(summary.hasFiredRounds).toBe(false);
  });

  it("rounds the average rounds per visit to a whole number", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition: [makeAmmo({ id: "a1" })],
      rangeVisits: [
        makeVisit({ id: "v1", ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 10 } } }),
        makeVisit({ id: "v2", ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 10 } } }),
        makeVisit({ id: "v3", ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 11 } } }),
      ],
    });

    expect(calculateSummary(index.events, index.visits).avgRoundsPerVisit).toBe(10);
  });

  it("hasPriceData reflects priced rounds, not total rounds", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition: [makeAmmo({ id: "a1", pricePerRound: undefined })],
      rangeVisits: [makeVisit({ ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 50 } } })],
    });

    const summary = calculateSummary(index.events, index.visits);
    expect(summary.rounds).toBe(50);
    expect(summary.hasFiredRounds).toBe(true);
    expect(summary.hasPriceData).toBe(false);
  });
});
