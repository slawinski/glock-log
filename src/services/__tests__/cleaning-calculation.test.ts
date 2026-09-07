import {
  calculateCleaningStatus,
  calculateCleaningTimeline,
  visitAfterCleaning,
} from "../cleaning-calculation";
import {
  CleaningEvent,
  CleaningSettings,
  CleaningType,
  RangeVisitStorage,
} from "../../validation/storageSchemas";

const firearmId = "f1";
const created = "2026-01-01T00:00:00.000Z";
const updated = "2026-01-01T00:00:00.000Z";

const settings = (
  overrides: Partial<CleaningSettings> = {}
): CleaningSettings => ({
  firearmId,
  fieldStripEnabled: true,
  fieldStripIntervalRounds: 500,
  completeEnabled: true,
  completeIntervalRounds: 3000,
  warningThresholdPercent: 80,
  createdAt: created,
  updatedAt: updated,
  ...overrides,
});

let visitCounter = 0;
const visit = (date: string, rounds: number): RangeVisitStorage => ({
  id: `v${visitCounter++}`,
  date,
  location: "Range",
  firearmsUsed: [firearmId],
  ammunitionUsed: { [firearmId]: { ammunitionId: "a1", rounds } },
  createdAt: created,
  updatedAt: updated,
});

let cleanCounter = 0;
const cleaning = (type: CleaningType, performedAt: string): CleaningEvent => ({
  id: `c${cleanCounter++}`,
  firearmId,
  type,
  performedAt,
  createdAt: created,
  updatedAt: updated,
});

describe("cleaning calculation", () => {
  beforeEach(() => {
    visitCounter = 0;
    cleanCounter = 0;
  });

  it("Scenario A — normal field strip accumulates rounds", () => {
    const result = calculateCleaningStatus(
      settings(),
      [cleaning("field_strip", "2026-01-01T12:00:00.000Z")],
      [
        visit("2026-01-02T12:00:00.000Z", 200),
        visit("2026-01-03T12:00:00.000Z", 150),
      ],
      firearmId
    );
    expect(result.fieldStrip.roundsSinceCleaning).toBe(350);
    expect(result.fieldStrip.remainingRounds).toBe(150);
    expect(result.fieldStrip.status).toBe("ok");
  });

  it("Scenario B — complete cleaning resets both counters", () => {
    const result = calculateCleaningStatus(
      settings(),
      [
        cleaning("field_strip", "2026-01-01T12:00:00.000Z"),
        cleaning("complete_disassembly", "2026-01-02T12:00:00.000Z"),
      ],
      [visit("2026-01-03T12:00:00.000Z", 0)],
      firearmId
    );
    expect(result.fieldStrip.roundsSinceCleaning).toBe(0);
    expect(result.completeDisassembly.roundsSinceCleaning).toBe(0);
  });

  it("Scenario C — field strip resets only field-strip counter", () => {
    const result = calculateCleaningStatus(
      settings(),
      [
        cleaning("complete_disassembly", "2026-01-01T12:00:00.000Z"),
        cleaning("field_strip", "2026-01-02T12:00:00.000Z"),
      ],
      [
        visit("2026-01-03T12:00:00.000Z", 100),
        visit("2026-01-04T12:00:00.000Z", 100),
      ],
      firearmId
    );
    // field strip reset at Jan 2 → only Jan 3+4 rounds (200)
    expect(result.fieldStrip.roundsSinceCleaning).toBe(200);
    // complete not reset by field strip → Jan 3+4 rounds (200)
    expect(result.completeDisassembly.roundsSinceCleaning).toBe(200);
  });

  it("Scenario D — retroactive range visit recalculates historical interval", () => {
    const events = [
      cleaning("field_strip", "2026-01-01T12:00:00.000Z"),
      cleaning("field_strip", "2026-01-20T12:00:00.000Z"),
    ];
    const visits = [
      visit("2026-01-30T12:00:00.000Z", 100),
      visit("2026-01-10T12:00:00.000Z", 300),
    ];
    const result = calculateCleaningStatus(settings(), events, visits, firearmId);
    // only the Jan 30 visit is after the Jan 20 cleaning
    expect(result.fieldStrip.roundsSinceCleaning).toBe(100);

    const timeline = calculateCleaningTimeline(events, visits, firearmId);
    const jan20 = timeline.find(
      (s) => s.event.performedAt === "2026-01-20T12:00:00.000Z"
    );
    expect(jan20?.roundsSincePreviousFieldStrip).toBe(300);
  });

  it("Scenario E — backdated cleaning splits the timeline", () => {
    const events = [cleaning("field_strip", "2026-01-25T12:00:00.000Z")];
    const visits = [
      visit("2026-01-01T12:00:00.000Z", 200),
      visit("2026-01-20T12:00:00.000Z", 300),
      visit("2026-01-30T12:00:00.000Z", 100),
    ];
    const result = calculateCleaningStatus(settings(), events, visits, firearmId);
    expect(result.fieldStrip.roundsSinceCleaning).toBe(100);
  });

  it("Scenario F — interval reduction can create overdue without a new event", () => {
    const result = calculateCleaningStatus(
      settings({ fieldStripIntervalRounds: 500 }),
      [cleaning("field_strip", "2026-01-01T12:00:00.000Z")],
      [visit("2026-01-10T12:00:00.000Z", 600)],
      firearmId
    );
    expect(result.fieldStrip.roundsSinceCleaning).toBe(600);
    expect(result.fieldStrip.remainingRounds).toBe(-100);
    expect(result.fieldStrip.status).toBe("due");
  });

  it("Scenario G — tracking baseline ignores pre-existing mileage", () => {
    const result = calculateCleaningStatus(
      settings({ trackingBaselineAt: "2026-09-01T12:00:00.000Z" }),
      [],
      [
        visit("2026-08-01T12:00:00.000Z", 5000),
        visit("2026-09-02T12:00:00.000Z", 0),
      ],
      firearmId
    );
    expect(result.fieldStrip.roundsSinceCleaning).toBe(0);
    expect(result.fieldStrip.status).toBe("ok");
  });

  it("Scenario H — same-day visit counts toward the interval that just ended", () => {
    const sameDay = "2026-09-07T12:00:00.000Z";
    const result = calculateCleaningStatus(
      settings(),
      [cleaning("field_strip", sameDay)],
      [visit(sameDay, 250)],
      firearmId
    );
    expect(result.fieldStrip.roundsSinceCleaning).toBe(0);
  });

  it("shows not_initialized when enabled but no baseline or history", () => {
    const result = calculateCleaningStatus(settings(), [], [], firearmId);
    expect(result.fieldStrip.status).toBe("not_initialized");
    expect(result.fieldStrip.roundsSinceCleaning).toBeNull();
  });

  it("shows not_configured when interval disabled", () => {
    const result = calculateCleaningStatus(
      settings({ fieldStripEnabled: false, completeEnabled: false }),
      [],
      [],
      firearmId
    );
    expect(result.fieldStrip.status).toBe("not_configured");
    expect(result.completeDisassembly.status).toBe("not_configured");
  });

  it("visitAfterCleaning treats same-day as before, later day as after", () => {
    expect(
      visitAfterCleaning("2026-09-07T18:00:00.000Z", "2026-09-07T09:00:00.000Z")
    ).toBe(false);
    expect(
      visitAfterCleaning("2026-09-08T00:00:00.000Z", "2026-09-07T09:00:00.000Z")
    ).toBe(true);
  });
});
