import { parseISO } from "date-fns";
import { calculateRhythm } from "./calculateRhythm";
import { buildActivityIndex } from "./buildActivityIndex";
import { resolvePeriod } from "./period";
import { makeAmmo, makeFirearm, makeVisit, localIso } from "./fixtures";

const today = parseISO("2026-08-12T12:00:00");

const build = (visits: ReturnType<typeof makeVisit>[]) => {
  const index = buildActivityIndex({
    firearms: [makeFirearm({ id: "f1" })],
    ammunition: [makeAmmo({ id: "a1" })],
    rangeVisits: visits,
  });
  const period = resolvePeriod("ALL", today, index);
  return calculateRhythm(index.events, index.visits, period);
};

describe("calculateRhythm", () => {
  it("computes the mean days between consecutive visits", () => {
    const rhythm = build([
      makeVisit({ id: "v1", date: localIso(2026, 1, 1) }),
      makeVisit({ id: "v2", date: localIso(2026, 1, 11) }),
      makeVisit({ id: "v3", date: localIso(2026, 1, 21) }),
    ]);

    expect(rhythm.avgBetweenVisitsDays).toBe(10);
  });

  it("returns null for fewer than two visits", () => {
    const rhythm = build([makeVisit({ id: "v1", date: localIso(2026, 1, 1) })]);
    expect(rhythm.avgBetweenVisitsDays).toBeNull();
    expect(rhythm.longestGapDays).toBeNull();
  });

  it("computes the longest visit-to-visit gap without a period boundary", () => {
    const rhythm = build([
      makeVisit({ id: "v1", date: localIso(2026, 1, 1) }),
      makeVisit({ id: "v2", date: localIso(2026, 1, 3) }),
      makeVisit({ id: "v3", date: localIso(2026, 1, 20) }),
    ]);

    expect(rhythm.longestGapDays).toBe(17);
  });

  it("averages rounds per month including zero-activity months", () => {
    const rhythm = build([
      makeVisit({ id: "v1", date: localIso(2026, 1, 1), ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 100 } } }),
      makeVisit({ id: "v2", date: localIso(2026, 3, 1), ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 100 } } }),
    ]);

    expect(rhythm.roundsPerMonth).toBeCloseTo(200 / 3);
  });

  it("returns null roundsPerMonth when there is no activity", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition: [makeAmmo({ id: "a1" })],
      rangeVisits: [],
    });
    const period = resolvePeriod("ALL", today, index);
    const rhythm = calculateRhythm(index.events, index.visits, period);

    expect(rhythm.roundsPerMonth).toBeNull();
    expect(rhythm.mostActiveMonth).toBeNull();
  });

  it("selects the month with the most rounds", () => {
    const rhythm = build([
      makeVisit({ id: "v1", date: localIso(2026, 1, 1), ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 500 } } }),
      makeVisit({ id: "v2", date: localIso(2026, 2, 1), ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 100 } } }),
    ]);

    expect(rhythm.mostActiveMonth).toMatchObject({
      key: "2026-01",
      rounds: 500,
      label: "JANUARY 2026",
    });
  });

  it("breaks ties by visit count, then by recency", () => {
    const tiedOnVisits = build([
      makeVisit({ id: "v1", date: localIso(2026, 1, 1), ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 200 } } }),
      makeVisit({ id: "v2", date: localIso(2026, 1, 15), ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 0 } } }),
      makeVisit({ id: "v3", date: localIso(2026, 2, 1), ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 200 } } }),
    ]);

    expect(tiedOnVisits.mostActiveMonth?.key).toBe("2026-01");

    const tiedOnRecency = build([
      makeVisit({ id: "v1", date: localIso(2026, 1, 1), ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 100 } } }),
      makeVisit({ id: "v2", date: localIso(2026, 3, 1), ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 100 } } }),
    ]);

    expect(tiedOnRecency.mostActiveMonth?.key).toBe("2026-03");
  });
});
