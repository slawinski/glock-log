import { storage } from "../storage-new";
import { StorageFactory } from "../storage-factory";
import { AccessoryInput, FirearmInput } from "../../validation/inputSchemas";
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

const firearmInput = (
  overrides: Partial<FirearmInput> = {}
): FirearmInput => ({
  modelName: "Glock 19",
  caliber: "9mm",
  datePurchased: now,
  amountPaid: 0,
  ownership: "mine",
  firearmType: "pistol",
  ...overrides,
});

const accessoryInput = (
  overrides: Partial<AccessoryInput> = {}
): AccessoryInput => ({
  category: "red_dot",
  modelName: "Holosun 507Comp",
  initialRounds: 0,
  ...overrides,
});

describe("accessory operations do not mutate firearm records", () => {
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

  const snapshotOf = async (firearmId: string) => {
    const firearm = (await storage.getFirearms()).find((f) => f.id === firearmId);
    expect(firearm).toBeDefined();
    return { photos: firearm?.photos, updatedAt: firearm?.updatedAt };
  };

  it("does not rewrite the firearm when an accessory is mounted", async () => {
    const firearmId = await storage.saveFirearm(firearmInput());
    const accessoryId = await storage.saveAccessory(accessoryInput());
    const before = await snapshotOf(firearmId);

    await storage.mountAccessory(accessoryId, firearmId, now);

    const after = await snapshotOf(firearmId);
    expect(after).toEqual(before);
  });

  it("does not rewrite the firearm when an accessory is unmounted", async () => {
    const firearmId = await storage.saveFirearm(firearmInput());
    const accessoryId = await storage.saveAccessory(accessoryInput());
    await storage.mountAccessory(accessoryId, firearmId, now);
    const before = await snapshotOf(firearmId);

    await storage.unmountAccessory(accessoryId, now);

    const after = await snapshotOf(firearmId);
    expect(after).toEqual(before);
  });

  it("does not rewrite either firearm when an accessory moves", async () => {
    const sourceId = await storage.saveFirearm(firearmInput());
    const destId = await storage.saveFirearm(
      firearmInput({ modelName: "Beretta 92" })
    );
    const accessoryId = await storage.saveAccessory(accessoryInput());

    await storage.mountAccessory(accessoryId, sourceId, now);
    const sourceBefore = await snapshotOf(sourceId);
    const destBefore = await snapshotOf(destId);

    await storage.moveAccessory(accessoryId, destId, now);

    expect(await snapshotOf(sourceId)).toEqual(sourceBefore);
    expect(await snapshotOf(destId)).toEqual(destBefore);
  });

  it("does not rewrite the firearm when a mounted accessory is archived", async () => {
    const firearmId = await storage.saveFirearm(firearmInput());
    const accessoryId = await storage.saveAccessory(accessoryInput());
    await storage.mountAccessory(accessoryId, firearmId, now);
    const before = await snapshotOf(firearmId);

    await storage.archiveAccessory(accessoryId);

    expect(await snapshotOf(firearmId)).toEqual(before);
  });
});
