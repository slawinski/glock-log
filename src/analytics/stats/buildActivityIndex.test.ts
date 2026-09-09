import { buildActivityIndex } from "./buildActivityIndex";
import { makeAmmo, makeFirearm, makeVisit, localIso } from "./fixtures";

describe("buildActivityIndex", () => {
  it("produces one normalized visit per range visit with summed rounds", () => {
    const visit = makeVisit({
      id: "v1",
      ammunitionUsed: {
        f1: { ammunitionId: "a1", rounds: 60 },
        f2: { ammunitionId: "a1", rounds: 40 },
      },
    });
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" }), makeFirearm({ id: "f2" })],
      ammunition: [makeAmmo({ id: "a1" })],
      rangeVisits: [visit],
    });

    expect(index.visits).toHaveLength(1);
    expect(index.visits[0].rounds).toBe(100);
    expect(index.visits[0].dateKey).toBe("2026-01-10");
  });

  it("builds one event per ammo entry with resolved fields", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1", modelName: "Glock 17" })],
      ammunition: [makeAmmo({ id: "a1", caliber: "9mm", pricePerRound: 2 })],
      rangeVisits: [
        makeVisit({
          id: "v1",
          date: localIso(2026, 1, 10),
          firearmsUsed: ["f1"],
          ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 50 } },
        }),
      ],
    });

    expect(index.events).toHaveLength(1);
    const event = index.events[0];
    expect(event.visitId).toBe("v1");
    expect(event.firearmId).toBe("f1");
    expect(event.firearmName).toBe("Glock 17");
    expect(event.caliber).toBe("9mm");
    expect(event.pricePerRound).toBe(2);
    expect(event.knownCost).toBe(100);
    expect(event.rounds).toBe(50);
    expect(event.dateKey).toBe("2026-01-10");
  });

  it("prefers the visit snapshot over current ammo price (spec 11.5)", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition: [makeAmmo({ id: "a1", pricePerRound: 3 })],
      rangeVisits: [
        makeVisit({
          ammunitionUsed: {
            f1: {
              ammunitionId: "a1",
              rounds: 10,
              pricePerRoundSnapshot: 1,
              caliberSnapshot: "45 ACP",
              firearmNameSnapshot: "1911",
            },
          },
        }),
      ],
    });

    const event = index.events[0];
    expect(event.pricePerRound).toBe(1);
    expect(event.knownCost).toBe(10);
    expect(event.caliber).toBe("45 ACP");
    expect(event.firearmName).toBe("1911");
  });

  it("falls back to current ammo price when no snapshot exists", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition: [makeAmmo({ id: "a1", pricePerRound: 2 })],
      rangeVisits: [makeVisit({ ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 5 } } })],
    });

    expect(index.events[0].pricePerRound).toBe(2);
    expect(index.events[0].knownCost).toBe(10);
  });

  it("leaves price undefined when neither snapshot nor current price exists", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition: [makeAmmo({ id: "a1", pricePerRound: undefined })],
      rangeVisits: [makeVisit({ ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 5 } } })],
    });

    expect(index.events[0].pricePerRound).toBeUndefined();
    expect(index.events[0].knownCost).toBeUndefined();
  });

  it("labels deleted firearms via snapshot and falls back to placeholder", () => {
    const withSnapshot = buildActivityIndex({
      firearms: [],
      ammunition: [makeAmmo({ id: "a1" })],
      rangeVisits: [
        makeVisit({
          ammunitionUsed: {
            gone: { ammunitionId: "a1", rounds: 10, firearmNameSnapshot: "Walther PPQ" },
          },
        }),
      ],
    });
    expect(withSnapshot.events[0].firearmName).toBe("Walther PPQ");
    expect(withSnapshot.firearmNames.get("gone")).toBe("Walther PPQ");

    const withoutSnapshot = buildActivityIndex({
      firearms: [],
      ammunition: [makeAmmo({ id: "a1" })],
      rangeVisits: [
        makeVisit({ ammunitionUsed: { gone: { ammunitionId: "a1", rounds: 10 } } }),
      ],
    });
    expect(withoutSnapshot.events[0].firearmName).toBe("Deleted firearm");
    expect(withoutSnapshot.firearmNames.get("gone")).toBe("Deleted firearm");
  });

  it("covers current firearms and historical firearms in firearmNames", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "current", modelName: "Current" })],
      ammunition: [makeAmmo({ id: "a1" })],
      rangeVisits: [
        makeVisit({
          firearmsUsed: ["current", "deleted"],
          ammunitionUsed: {
            current: { ammunitionId: "a1", rounds: 10 },
            deleted: { ammunitionId: "a1", rounds: 5, firearmNameSnapshot: "Old Gun" },
          },
        }),
      ],
    });

    expect(index.firearmNames.get("current")).toBe("Current");
    expect(index.firearmNames.get("deleted")).toBe("Old Gun");
  });

  it("collects unique active firearm ids in first-appearance order", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" }), makeFirearm({ id: "f2" })],
      ammunition: [makeAmmo({ id: "a1" })],
      rangeVisits: [
        makeVisit({
          id: "v1",
          firearmsUsed: ["f1", "f2"],
          ammunitionUsed: {
            f2: { ammunitionId: "a1", rounds: 5 },
            f1: { ammunitionId: "a1", rounds: 5 },
          },
        }),
        makeVisit({ id: "v2", firearmsUsed: ["f1"] }),
      ],
    });

    expect(index.activeFirearmIds).toEqual(["f1", "f2"]);
  });

  it("computes earliest and latest date keys", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition: [makeAmmo({ id: "a1" })],
      rangeVisits: [
        makeVisit({ id: "v1", date: localIso(2026, 3, 5) }),
        makeVisit({ id: "v2", date: localIso(2025, 1, 1) }),
      ],
    });

    expect(index.earliestDateKey).toBe("2025-01-01");
    expect(index.latestDateKey).toBe("2026-03-05");
  });

  it("returns null date keys when there is no activity", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition: [makeAmmo({ id: "a1" })],
      rangeVisits: [],
    });

    expect(index.earliestDateKey).toBeNull();
    expect(index.latestDateKey).toBeNull();
    expect(index.events).toHaveLength(0);
    expect(index.visits).toHaveLength(0);
  });

  it("groups events by visit id", () => {
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" }), makeFirearm({ id: "f2" })],
      ammunition: [makeAmmo({ id: "a1" })],
      rangeVisits: [
        makeVisit({
          id: "v1",
          firearmsUsed: ["f1", "f2"],
          ammunitionUsed: {
            f1: { ammunitionId: "a1", rounds: 5 },
            f2: { ammunitionId: "a1", rounds: 5 },
          },
        }),
      ],
    });

    expect(index.eventsByVisit.get("v1")).toHaveLength(2);
  });
});
