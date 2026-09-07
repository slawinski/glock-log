import { computeFirearmAttention } from "../maintenance-attention";
import {
  CleaningEvent,
  CleaningSettings,
  CleaningType,
  PartInstance,
  PartInstallationPeriod,
  PartSlot,
  RangeVisitStorage,
} from "../../validation/storageSchemas";

const firearmId = "f1";
const created = "2026-01-01T00:00:00.000Z";
const updated = "2026-01-01T00:00:00.000Z";

const cleaningSettings = (
  overrides: Partial<CleaningSettings> = {}
): CleaningSettings => ({
  firearmId,
  fieldStripEnabled: true,
  fieldStripIntervalRounds: 500,
  completeEnabled: false,
  completeIntervalRounds: undefined,
  warningThresholdPercent: 80,
  createdAt: created,
  updatedAt: updated,
  ...overrides,
});

let cCounter = 0;
const cleaningEvent = (type: CleaningType, performedAt: string): CleaningEvent => ({
  id: `c${cCounter++}`,
  firearmId,
  type,
  performedAt,
  createdAt: created,
  updatedAt: updated,
});

let vCounter = 0;
const visit = (date: string, rounds: number): RangeVisitStorage => ({
  id: `v${vCounter++}`,
  date,
  location: "Range",
  firearmsUsed: [firearmId],
  ammunitionUsed: { [firearmId]: { ammunitionId: "a1", rounds } },
  createdAt: created,
  updatedAt: updated,
});

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

describe("computeFirearmAttention", () => {
  beforeEach(() => {
    cCounter = 0;
    vCounter = 0;
  });

  it("returns null when nothing needs attention", () => {
    expect(computeFirearmAttention(firearmId, undefined, [], [], [], [], [])).toBeNull();
  });

  it("detects cleaning due-soon", () => {
    const events = [cleaningEvent("field_strip", "2026-01-01T12:00:00.000Z")];
    const visits = [visit("2026-01-10T12:00:00.000Z", 450)];
    expect(
      computeFirearmAttention(firearmId, cleaningSettings(), events, [], [], [], visits)
    ).toBe("due_soon");
  });

  it("detects cleaning due", () => {
    const events = [cleaningEvent("field_strip", "2026-01-01T12:00:00.000Z")];
    const visits = [visit("2026-01-10T12:00:00.000Z", 600)];
    expect(
      computeFirearmAttention(firearmId, cleaningSettings(), events, [], [], [], visits)
    ).toBe("due");
  });

  it("detects part due-soon", () => {
    const visits = [visit("2026-01-10T12:00:00.000Z", 4500)];
    expect(
      computeFirearmAttention(firearmId, undefined, [], [slot()], [instance()], [period()], visits)
    ).toBe("due_soon");
  });

  it("detects part due", () => {
    const visits = [visit("2026-01-10T12:00:00.000Z", 5100)];
    expect(
      computeFirearmAttention(firearmId, undefined, [], [slot()], [instance()], [period()], visits)
    ).toBe("due");
  });

  it("due outranks due-soon across cleaning and parts", () => {
    const events = [cleaningEvent("field_strip", "2026-01-01T12:00:00.000Z")];
    // cleaning at 450/500 → due_soon; part at 5100/5000 → due
    const visits = [visit("2026-01-10T12:00:00.000Z", 5100)];
    expect(
      computeFirearmAttention(
        firearmId,
        cleaningSettings(),
        events,
        [slot()],
        [instance()],
        [period()],
        visits
      )
    ).toBe("due");
  });

  it("ignores parts with no interval or unknown baseline", () => {
    const visits = [visit("2026-01-10T12:00:00.000Z", 12420)];
    expect(
      computeFirearmAttention(
        firearmId,
        undefined,
        [],
        [slot({ serviceIntervalRounds: undefined })],
        [instance()],
        [period()],
        visits
      )
    ).toBeNull();
    expect(
      computeFirearmAttention(
        firearmId,
        undefined,
        [],
        [slot()],
        [instance({ baselineType: "unknown" })],
        [period()],
        visits
      )
    ).toBeNull();
  });
});
