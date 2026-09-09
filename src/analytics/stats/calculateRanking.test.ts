import { calculateRanking } from "./calculateRanking";
import { buildActivityIndex } from "./buildActivityIndex";
import { makeAmmo, makeFirearm, makeVisit } from "./fixtures";

describe("calculateRanking", () => {
  const index = buildActivityIndex({
    firearms: [
      makeFirearm({ id: "f1", modelName: "Rifle" }),
      makeFirearm({ id: "f2", modelName: "Pistol" }),
    ],
    ammunition: [
      makeAmmo({ id: "a1", caliber: "5.56" }),
      makeAmmo({ id: "a2", caliber: "9mm" }),
    ],
    rangeVisits: [
      makeVisit({
        id: "v1",
        firearmsUsed: ["f1", "f2"],
        ammunitionUsed: {
          f1: { ammunitionId: "a1", rounds: 600 },
          f2: { ammunitionId: "a2", rounds: 400 },
        },
      }),
    ],
  });

  it("groups by firearm and sorts descending by rounds", () => {
    const ranking = calculateRanking(index.events, "firearms");

    expect(ranking).toHaveLength(2);
    expect(ranking[0]).toMatchObject({ key: "f1", label: "Rifle", rounds: 600 });
    expect(ranking[1]).toMatchObject({ key: "f2", label: "Pistol", rounds: 400 });
  });

  it("computes share as a fraction of total rounds", () => {
    const ranking = calculateRanking(index.events, "firearms");

    expect(ranking[0].share).toBeCloseTo(0.6);
    expect(ranking[1].share).toBeCloseTo(0.4);
  });

  it("groups by caliber", () => {
    const ranking = calculateRanking(index.events, "calibers");

    expect(ranking).toHaveLength(2);
    expect(ranking[0]).toMatchObject({ key: "5.56", rounds: 600 });
    expect(ranking[1]).toMatchObject({ key: "9mm", rounds: 400 });
  });

  it("returns an empty list for no events", () => {
    expect(calculateRanking([], "firearms")).toEqual([]);
    expect(calculateRanking([], "calibers")).toEqual([]);
  });
});
