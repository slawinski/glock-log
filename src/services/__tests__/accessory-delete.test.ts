import { storage } from "../storage-new";
import { StorageFactory } from "../storage-factory";
import {
  AccessoryInput,
  FirearmInput,
} from "../../validation/inputSchemas";
import {
  createMemoryStorage,
  MemoryStorage,
} from "../test-utils/memory-storage";

jest.mock("../error-handler", () => {
  const actual = jest.requireActual("../error-handler");
  return { ...actual, handleError: jest.fn() };
});

jest.mock("../image-storage", () => ({
  saveImageToFileSystem: jest.fn((uri: string) => uri),
  storeImagePaths: jest.fn(),
  deleteImages: jest.fn(),
  getImagePaths: jest.fn(),
  cleanupOrphanedImages: jest.fn(),
  setNoBackupFlag: jest.fn(),
}));

const now = "2026-01-15T10:00:00.000Z";

const firearmInput = (): FirearmInput => ({
  modelName: "Glock 19",
  caliber: "9mm",
  datePurchased: now,
  amountPaid: 0,
  ownership: "mine",
  firearmType: "pistol",
});

const accessoryInput = (
  overrides: Partial<AccessoryInput> = {}
): AccessoryInput => ({
  category: "red_dot",
  modelName: "Holosun 507C",
  initialRounds: 0,
  ...overrides,
});

describe("accessory deletion", () => {
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

  const accessoryIds = async (): Promise<string[]> =>
    (await storage.getAccessories()).map((a) => a.id);

  it("deletes a never-mounted accessory", async () => {
    const id = await storage.saveAccessory(accessoryInput());

    await storage.deleteAccessory(id);

    expect(await accessoryIds()).not.toContain(id);
  });

  it("deletes an unmounted accessory that has mount history", async () => {
    const firearmId = await storage.saveFirearm(firearmInput());
    const id = await storage.saveAccessory(accessoryInput());
    await storage.mountAccessory(id, firearmId, now);
    await storage.unmountAccessory(id, now);

    await storage.deleteAccessory(id);

    expect(await accessoryIds()).not.toContain(id);
  });

  it("deletes a currently-mounted accessory", async () => {
    const firearmId = await storage.saveFirearm(firearmInput());
    const id = await storage.saveAccessory(accessoryInput());
    await storage.mountAccessory(id, firearmId, now);

    await storage.deleteAccessory(id);

    expect(await accessoryIds()).not.toContain(id);
  });

  it("refuses to delete an accessory with usage history", async () => {
    const id = await storage.saveAccessory(accessoryInput());
    await storage.saveRangeVisit({
      date: now,
      location: "Indoor Range",
      firearmsUsed: [],
      accessoryUsage: [
        {
          accessoryId: id,
          firearmId: "f1",
          accessoryNameSnapshot: "Holosun 507C",
          categorySnapshot: "red_dot",
          rounds: 10,
          mode: "full_visit",
          attribution: "visit_entry",
        },
      ],
    });

    await expect(storage.deleteAccessory(id)).rejects.toThrow(
      "ACCESSORY_HAS_HISTORY"
    );
    expect(await accessoryIds()).toContain(id);
  });
});
