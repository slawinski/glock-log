import { findReconciliation } from "../accessory-reconciliation";
import {
  AccessoryMountSession,
  AccessoryStorage,
  RangeVisitStorage,
} from "../../validation/storageSchemas";

const firearmId = "f1";
const created = "2026-01-01T00:00:00.000Z";
const updated = "2026-01-01T00:00:00.000Z";

const accessory = (
  mountHistory: AccessoryMountSession[] = []
): AccessoryStorage => ({
  id: "acc1",
  category: "red_dot",
  modelName: "Holosun 507Comp",
  initialRounds: 0,
  status: "active",
  mountHistory,
  createdAt: created,
  updatedAt: updated,
});

const mount = (
  overrides: Partial<AccessoryMountSession> = {}
): AccessoryMountSession => ({
  id: "m1",
  firearmId,
  firearmNameSnapshot: "Glock 17",
  mountedAt: "2026-08-20T12:00:00.000Z",
  createdAt: created,
  updatedAt: updated,
  ...overrides,
});

let counter = 0;
const visit = (
  date: string,
  rounds: number,
  accessoryUsage?: RangeVisitStorage["accessoryUsage"]
): RangeVisitStorage => ({
  id: `v${counter++}`,
  date,
  location: "Range",
  firearmsUsed: [firearmId],
  ammunitionUsed: { [firearmId]: { ammunitionId: "a1", rounds } },
  accessoryUsage,
  createdAt: created,
  updatedAt: updated,
});

describe("accessory reconciliation", () => {
  beforeEach(() => {
    counter = 0;
  });

  it("Case A — detects a visit inside a retroactively-added mount interval", () => {
    const acc = accessory([mount({ mountedAt: "2026-08-20T12:00:00.000Z" })]);
    const reconciliation = findReconciliation(acc, [
      visit("2026-09-01T12:00:00.000Z", 300),
    ]);
    expect(reconciliation.missingUsage).toHaveLength(1);
    expect(reconciliation.missingUsage[0].firearmRounds).toBe(300);
    expect(reconciliation.missingUsage[0].confidence).toBe("inside_interval");
  });

  it("Case C — excludes visits before the mount interval", () => {
    const acc = accessory([mount({ mountedAt: "2026-08-20T12:00:00.000Z" })]);
    const reconciliation = findReconciliation(acc, [
      visit("2026-08-10T12:00:00.000Z", 200),
      visit("2026-09-01T12:00:00.000Z", 300),
    ]);
    expect(reconciliation.missingUsage).toHaveLength(1);
    expect(reconciliation.missingUsage[0].visitId).toBe("v1");
  });

  it("Case G — same-day mount is ambiguous, not auto-selected", () => {
    const acc = accessory([mount({ mountedAt: "2026-09-01T12:00:00.000Z" })]);
    const reconciliation = findReconciliation(acc, [
      visit("2026-09-01T09:00:00.000Z", 300),
    ]);
    expect(reconciliation.missingUsage).toHaveLength(0);
    expect(reconciliation.ambiguousUsage).toHaveLength(1);
    expect(reconciliation.ambiguousUsage[0].confidence).toBe("same_day_ambiguous");
  });

  it("detects usage that falls outside edited mount history as a conflict", () => {
    const acc = accessory([mount({ mountedAt: "2026-09-05T12:00:00.000Z" })]);
    const reconciliation = findReconciliation(acc, [
      visit("2026-09-01T12:00:00.000Z", 300, [
        {
          accessoryId: "acc1",
          firearmId,
          accessoryNameSnapshot: "Holosun 507Comp",
          categorySnapshot: "red_dot",
          rounds: 300,
          mode: "full_visit",
          attribution: "historical_backfill",
        },
      ]),
    ]);
    expect(reconciliation.outsideMountUsage).toHaveLength(1);
    expect(reconciliation.outsideMountUsage[0].rounds).toBe(300);
  });

  it("treats already-recorded usage as reconciled (not a candidate)", () => {
    const acc = accessory([mount({ mountedAt: "2026-08-20T12:00:00.000Z" })]);
    const reconciliation = findReconciliation(acc, [
      visit("2026-09-01T12:00:00.000Z", 300, [
        {
          accessoryId: "acc1",
          firearmId,
          accessoryNameSnapshot: "Holosun 507Comp",
          categorySnapshot: "red_dot",
          rounds: 300,
          mode: "full_visit",
          attribution: "visit_entry",
        },
      ]),
    ]);
    expect(reconciliation.missingUsage).toHaveLength(0);
    expect(reconciliation.ambiguousUsage).toHaveLength(0);
    expect(reconciliation.outsideMountUsage).toHaveLength(0);
  });
});
