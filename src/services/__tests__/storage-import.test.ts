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
  RangeVisitStorage,
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

const firearmRecord = (
  overrides: Partial<FirearmStorage> = {}
): FirearmStorage => ({
  id: "firearm-import-1",
  modelName: "Glock 19",
  caliber: "9mm",
  datePurchased: now,
  amountPaid: 550,
  roundsFired: 0,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const ammunitionRecord = (
  overrides: Partial<AmmunitionStorage> = {}
): AmmunitionStorage => ({
  id: "ammo-import-1",
  caliber: "9mm",
  brand: "Fiocchi",
  grain: "115gr",
  quantity: 100,
  datePurchased: now,
  amountPaid: 25,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const visitRecord = (
  overrides: Partial<RangeVisitStorage> = {}
): RangeVisitStorage => ({
  id: "visit-import-1",
  date: now,
  location: "Indoor Range",
  firearmsUsed: [],
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

type ImportBundle = {
  firearms: FirearmStorage[];
  ammunition: AmmunitionStorage[];
  rangeVisits: RangeVisitStorage[];
};

const importBundle = (overrides: Partial<ImportBundle> = {}): ImportBundle => ({
  firearms: overrides.firearms ?? [],
  ammunition: overrides.ammunition ?? [],
  rangeVisits: overrides.rangeVisits ?? [],
});

describe("storage.importData", () => {
  let memoryStorage: MemoryStorage;
  let getStorageSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

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
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("merge applies visit usage to existing ammunition and firearms", async () => {
    await storage.saveFirearm(validFirearmInput());
    await storage.saveAmmunition(validAmmunitionInput({ quantity: 100 }));
    const [firearm] = await storage.getFirearms();
    const [ammo] = await storage.getAmmunition();

    await storage.importData(
      importBundle({
        rangeVisits: [
          visitRecord({
            id: "visit-1",
            firearmsUsed: [firearm.id],
            ammunitionUsed: {
              [firearm.id]: { ammunitionId: ammo.id, rounds: 30 },
            },
          }),
        ],
      }),
      "merge"
    );

    const [updatedAmmo] = await storage.getAmmunition();
    expect(updatedAmmo.quantity).toBe(70);

    const [updatedFirearm] = await storage.getFirearms();
    expect(updatedFirearm.roundsFired).toBe(30);

    expect((await storage.getRangeVisits()).map((v) => v.id)).toContain(
      "visit-1"
    );
  });

  it("merge does not double-count firearm rounds when the firearm is part of the import", async () => {
    await storage.importData(
      importBundle({
        firearms: [firearmRecord({ id: "f-1", roundsFired: 30 })],
        ammunition: [ammunitionRecord({ id: "a-1", quantity: 70 })],
        rangeVisits: [
          visitRecord({
            id: "visit-1",
            firearmsUsed: ["f-1"],
            ammunitionUsed: { "f-1": { ammunitionId: "a-1", rounds: 30 } },
          }),
        ],
      }),
      "merge"
    );

    const [firearm] = await storage.getFirearms();
    // The imported firearm already includes these rounds.
    expect(firearm.roundsFired).toBe(30);

    const [ammo] = await storage.getAmmunition();
    // Current behavior: ammunition is still deducted from the imported stock.
    expect(ammo.quantity).toBe(40);
  });

  it("merge replaces an existing visit without re-applying its usage", async () => {
    await storage.saveFirearm(validFirearmInput());
    await storage.saveAmmunition(validAmmunitionInput({ quantity: 100 }));
    const [firearm] = await storage.getFirearms();
    const [ammo] = await storage.getAmmunition();

    await storage.saveRangeVisitWithAmmunition(
      validRangeVisitInput({
        firearmsUsed: [firearm.id],
        ammunitionUsed: {
          [firearm.id]: { ammunitionId: ammo.id, rounds: 10 },
        },
      })
    );
    const [original] = await storage.getRangeVisits();

    await storage.importData(
      importBundle({
        rangeVisits: [
          visitRecord({
            id: original.id,
            firearmsUsed: [firearm.id],
            ammunitionUsed: {
              [firearm.id]: { ammunitionId: ammo.id, rounds: 25 },
            },
          }),
        ],
      }),
      "merge"
    );

    const visits = await storage.getRangeVisits();
    expect(visits).toHaveLength(1);
    expect(visits[0].ammunitionUsed?.[firearm.id]?.rounds).toBe(25);

    // Quantities are NOT adjusted for an existing visit.
    const [updatedAmmo] = await storage.getAmmunition();
    expect(updatedAmmo.quantity).toBe(90);
    const [updatedFirearm] = await storage.getFirearms();
    expect(updatedFirearm.roundsFired).toBe(10);
  });

  it("restore wipes existing data and imports the bundle verbatim", async () => {
    await storage.saveFirearm(validFirearmInput());
    await storage.saveAmmunition(validAmmunitionInput({ quantity: 7 }));
    await storage.saveRangeVisit(validRangeVisitInput());

    await storage.importData(
      importBundle({
        firearms: [firearmRecord({ id: "f-9", roundsFired: 12 })],
        ammunition: [ammunitionRecord({ id: "a-9", quantity: 500 })],
        rangeVisits: [
          visitRecord({
            id: "visit-9",
            firearmsUsed: ["f-9"],
            ammunitionUsed: { "f-9": { ammunitionId: "a-9", rounds: 25 } },
          }),
        ],
      }),
      "restore"
    );

    const firearms = await storage.getFirearms();
    expect(firearms.map((f) => f.id)).toEqual(["f-9"]);
    expect(firearms[0].roundsFired).toBe(12);

    const [ammo] = await storage.getAmmunition();
    // Usage is NOT applied during restore.
    expect(ammo.quantity).toBe(500);

    expect((await storage.getRangeVisits()).map((v) => v.id)).toEqual([
      "visit-9",
    ]);
    expect(cleanupOrphanedImages).toHaveBeenCalled();
  });

  it("merge lets imported records with matching ids overwrite existing ones", async () => {
    await storage.saveFirearm(
      validFirearmInput({ id: "f-1", initialRoundsFired: 5 })
    );
    await storage.saveAmmunition(validAmmunitionInput({ id: "a-1", quantity: 50 }));

    await storage.importData(
      importBundle({
        firearms: [
          firearmRecord({ id: "f-1", roundsFired: 100, modelName: "Replacement" }),
        ],
        ammunition: [ammunitionRecord({ id: "a-1", quantity: 999 })],
      }),
      "merge"
    );

    const [firearm] = await storage.getFirearms();
    expect(firearm.roundsFired).toBe(100);
    expect(firearm.modelName).toBe("Replacement");

    const [ammo] = await storage.getAmmunition();
    expect(ammo.quantity).toBe(999);
  });

  it("merge skips invalid records and imports the rest", async () => {
    await storage.importData(
      importBundle({
        firearms: [
          // Missing modelName -> invalid
          {
            id: "bad-firearm",
            caliber: "9mm",
            datePurchased: now,
            amountPaid: 1,
            roundsFired: 0,
            createdAt: now,
            updatedAt: now,
          } as unknown as FirearmStorage,
          firearmRecord({ id: "good-firearm" }),
        ],
        ammunition: [ammunitionRecord({ id: "good-ammo" })],
      }),
      "merge"
    );

    expect((await storage.getFirearms()).map((f) => f.id)).toEqual([
      "good-firearm",
    ]);
    expect((await storage.getAmmunition()).map((a) => a.id)).toEqual([
      "good-ammo",
    ]);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("merge attributes rounds to the sole firearm when ammunitionUsed is keyed by an unknown id", async () => {
    await storage.saveFirearm(validFirearmInput());
    await storage.saveAmmunition(validAmmunitionInput({ quantity: 100 }));
    const [firearm] = await storage.getFirearms();
    const [ammo] = await storage.getAmmunition();

    await storage.importData(
      importBundle({
        rangeVisits: [
          visitRecord({
            id: "visit-1",
            firearmsUsed: [firearm.id],
            ammunitionUsed: {
              "ghost-id": { ammunitionId: ammo.id, rounds: 20 },
            },
          }),
        ],
      }),
      "merge"
    );

    const [updatedFirearm] = await storage.getFirearms();
    expect(updatedFirearm.roundsFired).toBe(20);

    const [updatedAmmo] = await storage.getAmmunition();
    expect(updatedAmmo.quantity).toBe(80);
  });

  it("merge matches the firearm by ammo caliber when a visit has multiple firearms", async () => {
    await storage.saveFirearm(validFirearmInput({ modelName: "Nine", caliber: "9mm" }));
    await storage.saveFirearm(
      validFirearmInput({ modelName: "Forty", caliber: ".45 ACP" })
    );
    await storage.saveAmmunition(validAmmunitionInput({ caliber: "9mm", quantity: 100 }));
    const firearms = await storage.getFirearms();
    const nine = firearms.find((f) => f.modelName === "Nine")!;
    const forty = firearms.find((f) => f.modelName === "Forty")!;
    const [ammo] = await storage.getAmmunition();

    await storage.importData(
      importBundle({
        rangeVisits: [
          visitRecord({
            id: "visit-1",
            firearmsUsed: [nine.id, forty.id],
            ammunitionUsed: {
              "ghost-id": { ammunitionId: ammo.id, rounds: 15 },
            },
          }),
        ],
      }),
      "merge"
    );

    const after = await storage.getFirearms();
    expect(after.find((f) => f.id === nine.id)?.roundsFired).toBe(15);
    expect(after.find((f) => f.id === forty.id)?.roundsFired).toBe(0);

    const [updatedAmmo] = await storage.getAmmunition();
    expect(updatedAmmo.quantity).toBe(85);
  });

  it("merge tolerates unknown ammunition ids without failing", async () => {
    await storage.saveFirearm(validFirearmInput());
    const [firearm] = await storage.getFirearms();

    await storage.importData(
      importBundle({
        rangeVisits: [
          visitRecord({
            id: "visit-1",
            firearmsUsed: [firearm.id],
            ammunitionUsed: {
              [firearm.id]: { ammunitionId: "missing-ammo", rounds: 10 },
            },
          }),
        ],
      }),
      "merge"
    );

    // Firearm rounds are still applied even though the ammunition is unknown.
    const [updated] = await storage.getFirearms();
    expect(updated.roundsFired).toBe(10);
    expect(await storage.getAmmunition()).toEqual([]);
  });

  it("merge stores visits without ammunition usage as-is", async () => {
    await storage.importData(
      importBundle({
        rangeVisits: [visitRecord({ id: "visit-1", firearmsUsed: [] })],
      }),
      "merge"
    );

    const [visit] = await storage.getRangeVisits();
    expect(visit.id).toBe("visit-1");
    expect(visit.firearmsUsed).toEqual([]);
    expect(visit.ammunitionUsed).toBeUndefined();
  });

  it("restore skips invalid visits but keeps valid data", async () => {
    await storage.importData(
      importBundle({
        firearms: [firearmRecord({ id: "f-1" })],
        rangeVisits: [
          // Missing updatedAt -> invalid
          {
            id: "bad-visit",
            date: now,
            location: "X",
            firearmsUsed: [],
            createdAt: now,
          } as unknown as RangeVisitStorage,
          visitRecord({ id: "visit-1" }),
        ],
      }),
      "restore"
    );

    expect((await storage.getFirearms()).map((f) => f.id)).toEqual(["f-1"]);
    expect((await storage.getRangeVisits()).map((v) => v.id)).toEqual([
      "visit-1",
    ]);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("defaults to the merge strategy", async () => {
    await storage.saveAmmunition(validAmmunitionInput({ quantity: 100 }));
    const [ammo] = await storage.getAmmunition();

    await storage.importData(
      importBundle({
        rangeVisits: [
          visitRecord({
            id: "visit-1",
            firearmsUsed: [],
            ammunitionUsed: {
              "ghost-id": { ammunitionId: ammo.id, rounds: 40 },
            },
          }),
        ],
      })
    );

    const [updated] = await storage.getAmmunition();
    expect(updated.quantity).toBe(60);
  });
});
