import { storage } from "../storage-new";
import { StorageFactory } from "../storage-factory";
import { CleaningEventInput } from "../../validation/inputSchemas";
import { createMemoryStorage, MemoryStorage } from "../test-utils/memory-storage";

jest.mock("../error-handler", () => {
  const actual = jest.requireActual("../error-handler");
  return { ...actual, handleError: jest.fn() };
});

const eventInput = (
  overrides: Partial<CleaningEventInput> = {}
): CleaningEventInput => ({
  firearmId: "firearm-1",
  type: "field_strip",
  performedAt: "2026-01-01T12:00:00.000Z",
  ...overrides,
});

describe("cleaning-service", () => {
  let memoryStorage: MemoryStorage;
  let getStorageSpy: jest.SpyInstance;

  beforeAll(() => {
    getStorageSpy = jest.spyOn(StorageFactory, "getStorage");
  });

  afterAll(() => {
    getStorageSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    memoryStorage = createMemoryStorage();
    getStorageSpy.mockReturnValue(memoryStorage);
  });

  it("saving an event with an existing id updates it (no duplicate)", async () => {
    const id = await storage.saveCleaningEvent(eventInput());
    await storage.saveCleaningEvent(
      eventInput({ id, type: "complete_disassembly" })
    );

    const events = await storage.getCleaningEvents("firearm-1");
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("complete_disassembly");
  });

  it("saves and round-trips cleaning settings", async () => {
    await storage.saveCleaningSettings({
      firearmId: "firearm-1",
      fieldStripEnabled: true,
      fieldStripIntervalRounds: 500,
      completeEnabled: true,
      completeIntervalRounds: 3000,
      warningThresholdPercent: 80,
      trackingBaselineAt: "2026-09-07T12:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    const settings = await storage.getCleaningSettings("firearm-1");
    expect(settings?.fieldStripIntervalRounds).toBe(500);
    expect(settings?.completeIntervalRounds).toBe(3000);
  });

  it("deleting a firearm removes its cleaning events and settings", async () => {
    await storage.saveCleaningEvent(eventInput());
    await storage.saveCleaningSettings({
      firearmId: "firearm-1",
      fieldStripEnabled: true,
      fieldStripIntervalRounds: 500,
      completeEnabled: false,
      warningThresholdPercent: 80,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    await storage.deleteCleaningForFirearm("firearm-1");

    expect(await storage.getCleaningEvents("firearm-1")).toHaveLength(0);
    expect(await storage.getCleaningSettings("firearm-1")).toBeUndefined();
  });
});
