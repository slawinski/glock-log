import { storage } from "../storage-new";
import { StorageFactory } from "../storage-factory";
import { AddPartInput, ReplacePartInput } from "../../validation/inputSchemas";
import { createMemoryStorage, MemoryStorage } from "../test-utils/memory-storage";

jest.mock("../error-handler", () => {
  const actual = jest.requireActual("../error-handler");
  return { ...actual, handleError: jest.fn() };
});

const addPartInput = (
  overrides: Partial<AddPartInput> = {}
): AddPartInput => ({
  firearmId: "firearm-1",
  name: "Recoil spring",
  trackInterval: true,
  serviceIntervalRounds: "5000",
  notifyBeforeRounds: "500",
  baselineType: "new",
  startingUsageRounds: "",
  ...overrides,
});

const replacePartInput = (
  overrides: Partial<ReplacePartInput> = {}
): ReplacePartInput => ({
  replacementDate: "2026-06-01T12:00:00.000Z",
  reason: "scheduled",
  baselineType: "new",
  startingUsageRounds: "",
  ...overrides,
});

describe("parts-life-service", () => {
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

  it("addPart creates a slot with a current instance", async () => {
    const slotId = await storage.addPart(addPartInput());
    const slots = await storage.getAllPartSlots();
    expect(slots).toHaveLength(1);
    const current = await storage.getCurrentInstance(slotId);
    expect(current).not.toBeNull();
  });

  it("replacePart preserves instances from other slots (no index corruption)", async () => {
    const recoilSlot = await storage.addPart(addPartInput());
    const extractorSlot = await storage.addPart(
      addPartInput({ name: "Extractor" })
    );

    await storage.replacePart(recoilSlot, replacePartInput());

    // All instances must remain readable — the global index must not be
    // clobbered to only the replaced slot's instances.
    const allInstances = await storage.getAllPartInstances();
    const slotIds = new Set(allInstances.map((i) => i.partSlotId));
    expect(slotIds.has(recoilSlot)).toBe(true);
    expect(slotIds.has(extractorSlot)).toBe(true);
    // 2 original instances + 1 replacement instance.
    expect(allInstances).toHaveLength(3);
  });

  it("replacePart ends the old period and starts a new one", async () => {
    const slotId = await storage.addPart(addPartInput());
    await storage.replacePart(slotId, replacePartInput());

    const instances = await storage.getPartInstances(slotId);
    expect(instances).toHaveLength(2);

    const periods = await storage.getAllPartPeriods();
    const removed = periods.filter((p) => p.removedAt !== undefined);
    const active = periods.filter((p) => p.removedAt === undefined);
    expect(removed).toHaveLength(1);
    expect(active).toHaveLength(1);
    expect(removed[0].removedAt).toBe("2026-06-01T12:00:00.000Z");
  });

  it("removePartSlot removes its instances and keeps others", async () => {
    const recoilSlot = await storage.addPart(addPartInput());
    const extractorSlot = await storage.addPart(
      addPartInput({ name: "Extractor" })
    );
    await storage.removePartSlot(recoilSlot);

    const slots = await storage.getAllPartSlots();
    expect(slots.map((s) => s.id)).toEqual([extractorSlot]);
  });
});
