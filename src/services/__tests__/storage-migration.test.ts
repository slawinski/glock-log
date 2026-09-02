import { storage } from "../storage-new";
import { StorageFactory } from "../storage-factory";
import {
  cleanupOrphanedImages,
  deleteImages,
  getImagePaths,
  saveImageToFileSystem,
  setNoBackupFlag,
  storeImagePaths,
} from "../image-storage";
import {
  AmmunitionInput,
  FirearmInput,
  RangeVisitInput,
} from "../../validation/inputSchemas";
import {
  AmmunitionStorage,
  FirearmStorage,
} from "../../validation/storageSchemas";
import {
  createMemoryStorage,
  MemoryStorage,
} from "../test-utils/memory-storage";

jest.mock("../image-storage", () => ({
  saveImageToFileSystem: jest.fn(),
  storeImagePaths: jest.fn(),
  deleteImages: jest.fn(),
  getImagePaths: jest.fn(),
  cleanupOrphanedImages: jest.fn(),
  setNoBackupFlag: jest.fn(),
}));

const now = "2026-01-15T10:00:00.000Z";

const legacyFirearm = (id: string, roundsFired = 0): FirearmStorage => ({
  id,
  modelName: "Glock 19",
  caliber: "9mm",
  datePurchased: now,
  amountPaid: 550,
  roundsFired,
  createdAt: now,
  updatedAt: now,
});

const legacyAmmo = (id: string, quantity = 100): AmmunitionStorage => ({
  id,
  caliber: "9mm",
  brand: "Fiocchi",
  grain: "115gr",
  quantity,
  datePurchased: now,
  amountPaid: 25,
  createdAt: now,
  updatedAt: now,
});

const validFirearmInput = (
  overrides: Partial<FirearmInput> = {}
): FirearmInput => ({
  modelName: "Glock 19",
  caliber: "9mm",
  datePurchased: now,
  amountPaid: 550,
  ...overrides,
});

const validAmmunitionInput = (
  overrides: Partial<AmmunitionInput> = {}
): AmmunitionInput => ({
  caliber: "9mm",
  brand: "Fiocchi",
  grain: "115gr",
  quantity: 100,
  datePurchased: now,
  amountPaid: 25,
  ...overrides,
});

const validRangeVisitInput = (
  overrides: Partial<RangeVisitInput> = {}
): RangeVisitInput => ({
  date: now,
  location: "Indoor Range",
  firearmsUsed: [],
  ...overrides,
});

describe("storage per-entity layout migration", () => {
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
    jest
      .mocked(saveImageToFileSystem)
      .mockImplementation(async (uri: string) => `/mock/images/${uri.split("/").pop()}`);
    jest.mocked(storeImagePaths).mockResolvedValue(undefined);
    jest.mocked(deleteImages).mockResolvedValue(undefined);
    jest.mocked(getImagePaths).mockResolvedValue([]);
    jest.mocked(cleanupOrphanedImages).mockResolvedValue(undefined);
    jest.mocked(setNoBackupFlag).mockResolvedValue(undefined);
  });

  it("migrates a legacy firearms blob to per-entity keys on first read", async () => {
    memoryStorage.map.set(
      "@storage:firearms",
      JSON.stringify([legacyFirearm("f-1"), legacyFirearm("f-2", 42)])
    );

    const firearms = await storage.getFirearms();

    expect(firearms.map((f) => f.id)).toEqual(["f-1", "f-2"]);
    expect(firearms[1].roundsFired).toBe(42);

    // Legacy blob removed, per-entity keys + index written.
    expect(memoryStorage.map.has("@storage:firearms")).toBe(false);
    expect(memoryStorage.map.get("@storage:firearms-index")).toBe(
      JSON.stringify(["f-1", "f-2"])
    );
    expect(memoryStorage.map.has("@storage:firearm:f-1")).toBe(true);
    expect(memoryStorage.map.has("@storage:firearm:f-2")).toBe(true);
  });

  it("migrates legacy ammunition and range-visit blobs on first read", async () => {
    memoryStorage.map.set(
      "@storage:ammunition",
      JSON.stringify([legacyAmmo("a-1", 250)])
    );
    memoryStorage.map.set(
      "@storage:range-visits",
      JSON.stringify([
        {
          id: "v-1",
          date: now,
          location: "Range",
          firearmsUsed: ["f-1"],
          createdAt: now,
          updatedAt: now,
        },
      ])
    );

    expect((await storage.getAmmunition()).map((a) => a.id)).toEqual(["a-1"]);
    expect((await storage.getRangeVisits()).map((v) => v.id)).toEqual(["v-1"]);

    expect(memoryStorage.map.has("@storage:ammunition")).toBe(false);
    expect(memoryStorage.map.has("@storage:range-visits")).toBe(false);
    expect(memoryStorage.map.get("@storage:ammunition-index")).toBe(
      JSON.stringify(["a-1"])
    );
    expect(memoryStorage.map.get("@storage:range-visits-index")).toBe(
      JSON.stringify(["v-1"])
    );
  });

  it("appends new entities to the index after migration, preserving order", async () => {
    memoryStorage.map.set(
      "@storage:firearms",
      JSON.stringify([legacyFirearm("f-1"), legacyFirearm("f-2")])
    );
    await storage.getFirearms();

    await storage.saveFirearm(validFirearmInput({ modelName: "New" }));
    const firearms = await storage.getFirearms();

    expect(firearms.map((f) => f.modelName)).toEqual(["Glock 19", "Glock 19", "New"]);
    const index = JSON.parse(
      memoryStorage.map.get("@storage:firearms-index") as string
    );
    expect(index).toEqual([firearms[0].id, firearms[1].id, firearms[2].id]);
    expect(memoryStorage.map.has("@storage:firearms")).toBe(false);
  });

  it("updates a single entity key without touching the index order", async () => {
    memoryStorage.map.set(
      "@storage:firearms",
      JSON.stringify([legacyFirearm("f-1"), legacyFirearm("f-2")])
    );
    await storage.getFirearms();

    await storage.saveFirearm(
      validFirearmInput({ id: "f-1", modelName: "Updated" })
    );

    const firearms = await storage.getFirearms();
    expect(firearms.map((f) => f.id)).toEqual(["f-1", "f-2"]);
    expect(firearms[0].modelName).toBe("Updated");
    expect(memoryStorage.map.get("@storage:firearms-index")).toBe(
      JSON.stringify(["f-1", "f-2"])
    );
    expect(JSON.parse(memoryStorage.map.get("@storage:firearm:f-1") as string).modelName).toBe(
      "Updated"
    );
  });

  it("removes the entity key and index entry on delete", async () => {
    memoryStorage.map.set(
      "@storage:firearms",
      JSON.stringify([legacyFirearm("f-1"), legacyFirearm("f-2")])
    );
    await storage.getFirearms();

    await storage.deleteFirearm("f-1");

    expect(memoryStorage.map.has("@storage:firearm:f-1")).toBe(false);
    expect(memoryStorage.map.get("@storage:firearms-index")).toBe(
      JSON.stringify(["f-2"])
    );
    expect((await storage.getFirearms()).map((f) => f.id)).toEqual(["f-2"]);
  });

  it("skips ghost ids whose entity key is missing", async () => {
    memoryStorage.map.set(
      "@storage:firearms-index",
      JSON.stringify(["f-1", "ghost", "f-3"])
    );
    memoryStorage.map.set(
      "@storage:firearm:f-1",
      JSON.stringify(legacyFirearm("f-1"))
    );
    memoryStorage.map.set(
      "@storage:firearm:f-3",
      JSON.stringify(legacyFirearm("f-3"))
    );

    const firearms = await storage.getFirearms();

    expect(firearms.map((f) => f.id)).toEqual(["f-1", "f-3"]);
  });

  it("re-runs migration cleanly when it previously crashed mid-write", async () => {
    memoryStorage.map.set(
      "@storage:firearms",
      JSON.stringify([legacyFirearm("f-1"), legacyFirearm("f-2")])
    );
    // Simulate a crash after the first entity was written but before the index.
    memoryStorage.map.set(
      "@storage:firearm:f-1",
      JSON.stringify(legacyFirearm("f-1"))
    );

    const firearms = await storage.getFirearms();

    expect(firearms.map((f) => f.id)).toEqual(["f-1", "f-2"]);
    expect(memoryStorage.map.has("@storage:firearms")).toBe(false);
    expect(memoryStorage.map.get("@storage:firearms-index")).toBe(
      JSON.stringify(["f-1", "f-2"])
    );
    expect(memoryStorage.map.has("@storage:firearm:f-2")).toBe(true);
  });

  it("applies visit side effects after migrating legacy data", async () => {
    memoryStorage.map.set(
      "@storage:firearms",
      JSON.stringify([legacyFirearm("f-1")])
    );
    memoryStorage.map.set(
      "@storage:ammunition",
      JSON.stringify([legacyAmmo("a-1", 100)])
    );

    await storage.saveRangeVisitWithAmmunition(
      validRangeVisitInput({
        firearmsUsed: ["f-1"],
        ammunitionUsed: { "f-1": { ammunitionId: "a-1", rounds: 30 } },
      })
    );

    const [firearm] = await storage.getFirearms();
    expect(firearm.roundsFired).toBe(30);
    const [ammo] = await storage.getAmmunition();
    expect(ammo.quantity).toBe(70);
    expect((await storage.getRangeVisits())).toHaveLength(1);

    expect(memoryStorage.map.has("@storage:firearms")).toBe(false);
    expect(memoryStorage.map.has("@storage:ammunition")).toBe(false);
  });

  it("merges imported data on top of legacy data", async () => {
    memoryStorage.map.set(
      "@storage:firearms",
      JSON.stringify([legacyFirearm("f-1")])
    );
    memoryStorage.map.set(
      "@storage:ammunition",
      JSON.stringify([legacyAmmo("a-1", 100)])
    );

    await storage.importData(
      {
        firearms: [],
        ammunition: [],
        rangeVisits: [
          {
            id: "v-1",
            date: now,
            location: "Range",
            firearmsUsed: ["f-1"],
            ammunitionUsed: { "f-1": { ammunitionId: "a-1", rounds: 25 } },
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      "merge"
    );

    const [ammo] = await storage.getAmmunition();
    expect(ammo.quantity).toBe(75);
    const [firearm] = await storage.getFirearms();
    expect(firearm.roundsFired).toBe(25);
    expect(memoryStorage.map.has("@storage:firearms")).toBe(false);
    expect(memoryStorage.map.has("@storage:ammunition")).toBe(false);
  });

  it("does not create index keys for collections that were never written", async () => {
    expect(await storage.getFirearms()).toEqual([]);
    expect(await storage.getAmmunition()).toEqual([]);
    expect(await storage.getRangeVisits()).toEqual([]);

    expect(memoryStorage.map.has("@storage:firearms-index")).toBe(false);
    expect(memoryStorage.map.has("@storage:ammunition-index")).toBe(false);
    expect(memoryStorage.map.has("@storage:range-visits-index")).toBe(false);
  });

  it("clearAllData removes entity keys and indexes but preserves settings", async () => {
    await storage.saveFirearm(validFirearmInput());
    await storage.saveAmmunition(validAmmunitionInput());
    await storage.saveRangeVisit(validRangeVisitInput());
    await storage.setCurrency("EUR");

    await storage.clearAllData();

    const storageKeys = Array.from(memoryStorage.map.keys()).filter((key) =>
      key.startsWith("@storage:")
    );
    expect(storageKeys).toEqual(["@storage:settings"]);
    expect(await storage.getSettings()).toEqual({
      currency: "EUR",
      biometricLockEnabled: true,
    });
  });
});
