import {
  calculatePartInstanceUsage,
  calculatePartStatus,
  roundsInPeriod,
} from "../parts-life-calculation";
import {
  PartInstance,
  PartInstallationPeriod,
  PartSlot,
  RangeVisitStorage,
} from "../../validation/storageSchemas";

const firearmId = "f1";
const created = "2026-01-01T00:00:00.000Z";
const updated = "2026-01-01T00:00:00.000Z";

const slot = (overrides: Partial<PartSlot> = {}): PartSlot => ({
  id: "slot1",
  firearmId,
  name: "Recoil spring",
  enabled: true,
  serviceIntervalRounds: 5000,
  notifyBeforeRounds: 500,
  createdAt: created,
  updatedAt: updated,
  ...overrides,
});

const instance = (overrides: Partial<PartInstance> = {}): PartInstance => ({
  id: "i1",
  partSlotId: "slot1",
  startingUsageRounds: 0,
  baselineType: "new",
  createdAt: created,
  updatedAt: updated,
  ...overrides,
});

const period = (
  overrides: Partial<PartInstallationPeriod> = {}
): PartInstallationPeriod => ({
  id: "p1",
  partInstanceId: "i1",
  firearmId,
  installedAt: "2026-01-01T12:00:00.000Z",
  ...overrides,
});

let counter = 0;
const visit = (date: string, rounds: number): RangeVisitStorage => ({
  id: `v${counter++}`,
  date,
  location: "Range",
  firearmsUsed: [firearmId],
  ammunitionUsed: { [firearmId]: { ammunitionId: "a1", rounds } },
  createdAt: created,
  updatedAt: updated,
});

describe("parts-life calculation", () => {
  beforeEach(() => {
    counter = 0;
  });

  it("sums starting usage plus rounds fired during installation periods", () => {
    const inst = instance({ startingUsageRounds: 1750 });
    const usage = calculatePartInstanceUsage(
      inst,
      [period()],
      [
        visit("2026-01-02T12:00:00.000Z", 300),
        visit("2026-01-03T12:00:00.000Z", 200),
      ]
    );
    expect(usage).toBe(2250);
  });

  it("ignores rounds outside the installation period", () => {
    const inst = instance();
    const usage = calculatePartInstanceUsage(
      inst,
      [period({ removedAt: "2026-01-02T12:00:00.000Z" })],
      [
        visit("2026-01-01T12:00:00.000Z", 100),
        visit("2026-01-03T12:00:00.000Z", 500),
      ]
    );
    expect(usage).toBe(100);
  });

  it("reports OK below the notify-before window", () => {
    const result = calculatePartStatus(
      slot(),
      instance(),
      [period()],
      [visit("2026-01-02T12:00:00.000Z", 4000)]
    );
    expect(result.status).toBe("ok");
    expect(result.currentUsage).toBe(4000);
  });

  it("reports DUE SOON within the notify-before window", () => {
    const result = calculatePartStatus(
      slot(),
      instance(),
      [period()],
      [visit("2026-01-02T12:00:00.000Z", 4500)]
    );
    expect(result.status).toBe("due_soon");
    expect(result.remainingRounds).toBe(500);
  });

  it("reports DUE past the interval and shows overdue rounds", () => {
    const result = calculatePartStatus(
      slot(),
      instance(),
      [period()],
      [visit("2026-01-02T12:00:00.000Z", 5100)]
    );
    expect(result.status).toBe("due");
    expect(result.remainingRounds).toBe(-100);
  });

  it("reports BASELINE_UNKNOWN with no misleading precise value", () => {
    const result = calculatePartStatus(
      slot(),
      instance({ baselineType: "unknown" }),
      [period()],
      [visit("2026-01-02T12:00:00.000Z", 1420)]
    );
    expect(result.status).toBe("baseline_unknown");
    expect(result.currentUsage).toBeNull();
    expect(result.trackedUsage).toBe(1420);
  });

  it("reports NO_INTERVAL when no service interval is configured", () => {
    const result = calculatePartStatus(
      slot({ serviceIntervalRounds: undefined }),
      instance(),
      [period()],
      [visit("2026-01-02T12:00:00.000Z", 12420)]
    );
    expect(result.status).toBe("no_interval");
    expect(result.currentUsage).toBe(12420);
  });

  it("reports NO_PART_INSTALLED when no current instance exists", () => {
    const result = calculatePartStatus(slot(), null, [], []);
    expect(result.status).toBe("no_part_installed");
  });

  it("roundsInPeriod respects half-open [installedAt, removedAt)", () => {
    const p = period({
      installedAt: "2026-06-01T12:00:00.000Z",
      removedAt: "2026-07-01T12:00:00.000Z",
    });
    expect(
      roundsInPeriod(p, [
        visit("2026-06-15T12:00:00.000Z", 200),
        visit("2026-07-01T12:00:00.000Z", 300),
      ])
    ).toBe(200);
  });
});
