import * as FileSystem from "expo-file-system";
import { storage } from "../storage-new";
import { StorageFactory } from "../storage-factory";
import { handleError } from "../error-handler";
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
  createMemoryStorage,
  MemoryStorage,
} from "../test-utils/memory-storage";

jest.mock("../error-handler", () => {
  const actual = jest.requireActual("../error-handler");
  return { ...actual, handleError: jest.fn() };
});

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
  ownership: "mine",
  firearmType: "pistol",
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

describe("storage service", () => {
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

  describe("firearms", () => {
    it("creates a firearm with a generated id and defaults", async () => {
      await storage.saveFirearm(validFirearmInput());

      const firearms = await storage.getFirearms();
      expect(firearms).toHaveLength(1);
      const saved = firearms[0];
      expect(saved.id).toMatch(/^firearm-/);
      expect(saved.modelName).toBe("Glock 19");
      expect(saved.caliber).toBe("9mm");
      expect(saved.roundsFired).toBe(0);
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
      expect(saved.photos ?? []).toEqual([]);
    });

    it("applies initialRoundsFired on create", async () => {
      await storage.saveFirearm(validFirearmInput({ initialRoundsFired: 120 }));

      const [saved] = await storage.getFirearms();
      expect(saved.roundsFired).toBe(120);
    });

    it("saves real photo uris via image storage and drops placeholders", async () => {
      await storage.saveFirearm(
        validFirearmInput({
          photos: ["file://one.jpg", "placeholder:abc", "file://two.jpg"],
        })
      );

      const [saved] = await storage.getFirearms();
      expect(saveImageToFileSystem).toHaveBeenCalledTimes(2);
      expect(saveImageToFileSystem).toHaveBeenCalledWith(
        "file://one.jpg",
        "firearm",
        saved.id
      );
      expect(saveImageToFileSystem).toHaveBeenCalledWith(
        "file://two.jpg",
        "firearm",
        saved.id
      );
      // Generated placeholder entries never reach storage.
      expect(saved.photos).toEqual([
        "/mock/images/one.jpg",
        "/mock/images/two.jpg",
      ]);
      expect(storeImagePaths).toHaveBeenCalledWith("firearm", saved.id, [
        "/mock/images/one.jpg",
        "/mock/images/two.jpg",
      ]);
    });

    it("updates an existing firearm while preserving createdAt and existing rounds", async () => {
      await storage.saveFirearm(validFirearmInput({ initialRoundsFired: 50 }));
      const [created] = await storage.getFirearms();

      await storage.saveFirearm(
        validFirearmInput({
          id: created.id,
          modelName: "Glock 17",
          initialRoundsFired: 999,
        })
      );

      const firearms = await storage.getFirearms();
      expect(firearms).toHaveLength(1);
      expect(firearms[0].id).toBe(created.id);
      expect(firearms[0].modelName).toBe("Glock 17");
      expect(firearms[0].createdAt).toBe(created.createdAt);
      // Existing roundsFired wins over a new initialRoundsFired
      expect(firearms[0].roundsFired).toBe(50);
    });

    it("uses initialRoundsFired when the existing roundsFired is zero", async () => {
      await storage.saveFirearm(validFirearmInput());
      const [created] = await storage.getFirearms();
      expect(created.roundsFired).toBe(0);

      await storage.saveFirearm(
        validFirearmInput({ id: created.id, initialRoundsFired: 30 })
      );

      const [updated] = await storage.getFirearms();
      expect(updated.roundsFired).toBe(30);
    });

    it("keeps existing photos when updating without photos", async () => {
      await storage.saveFirearm(validFirearmInput({ photos: ["file://one.jpg"] }));
      const [created] = await storage.getFirearms();

      await storage.saveFirearm(
        validFirearmInput({ id: created.id, notes: "updated" })
      );

      const [updated] = await storage.getFirearms();
      expect(updated.photos).toEqual(created.photos);
    });

    it("deletes a firearm and its images", async () => {
      await storage.saveFirearm(validFirearmInput());
      const [created] = await storage.getFirearms();

      await storage.deleteFirearm(created.id);

      expect(deleteImages).toHaveBeenCalledWith("firearm", created.id);
      expect(await storage.getFirearms()).toEqual([]);
    });

    it("returns an empty array when nothing is stored", async () => {
      expect(await storage.getFirearms()).toEqual([]);
    });

    it("throws a validation error when stored firearms data is corrupt", async () => {
      // NOTE: peeks at the raw storage key; adjust alongside storage layout changes.
      memoryStorage.map.set("@storage:firearms", "not-json");

      await expect(storage.getFirearms()).rejects.toThrow(
        "Please check your input and try again."
      );
    });
  });

  describe("ammunition", () => {
    it("creates ammunition with a generated id", async () => {
      await storage.saveAmmunition(validAmmunitionInput());

      const [saved] = await storage.getAmmunition();
      expect(saved.id).toMatch(/^ammo-/);
      expect(saved.quantity).toBe(100);
      expect(saved.caliber).toBe("9mm");
      expect(saved.brand).toBe("Fiocchi");
    });

    it("updates ammunition while preserving createdAt", async () => {
      await storage.saveAmmunition(validAmmunitionInput());
      const [created] = await storage.getAmmunition();

      await storage.saveAmmunition(
        validAmmunitionInput({ id: created.id, quantity: 42, brand: "Sellier" })
      );

      const list = await storage.getAmmunition();
      expect(list).toHaveLength(1);
      expect(list[0].quantity).toBe(42);
      expect(list[0].brand).toBe("Sellier");
      expect(list[0].createdAt).toBe(created.createdAt);
    });

    it("deletes ammunition", async () => {
      await storage.saveAmmunition(validAmmunitionInput());
      const [created] = await storage.getAmmunition();

      await storage.deleteAmmunition(created.id);

      expect(await storage.getAmmunition()).toEqual([]);
    });

    it("returns an empty array when nothing is stored", async () => {
      expect(await storage.getAmmunition()).toEqual([]);
    });
  });

  describe("range visits", () => {
    it("creates a range visit defaulting ammunitionUsed to {}", async () => {
      await storage.saveRangeVisit(validRangeVisitInput({ notes: "cold day" }));

      const [saved] = await storage.getRangeVisits();
      expect(saved.id).toMatch(/^visit-/);
      expect(saved.ammunitionUsed).toEqual({});
      expect(saved.notes).toBe("cold day");
    });

    it("stores visit photos via image storage", async () => {
      await storage.saveRangeVisit(validRangeVisitInput({ photos: ["file://v.jpg"] }));

      const [saved] = await storage.getRangeVisits();
      expect(saveImageToFileSystem).toHaveBeenCalledWith(
        "file://v.jpg",
        "range-visit",
        saved.id
      );
      expect(saved.photos).toEqual(["/mock/images/v.jpg"]);
      expect(storeImagePaths).toHaveBeenCalledWith("range-visit", saved.id, [
        "/mock/images/v.jpg",
      ]);
    });

    it("updates a visit while preserving createdAt", async () => {
      await storage.saveRangeVisit(validRangeVisitInput({ location: "A" }));
      const [created] = await storage.getRangeVisits();

      await storage.saveRangeVisit(
        validRangeVisitInput({ id: created.id, location: "B" })
      );

      const visits = await storage.getRangeVisits();
      expect(visits).toHaveLength(1);
      expect(visits[0].location).toBe("B");
      expect(visits[0].createdAt).toBe(created.createdAt);
    });

    it("deletes a range visit and its images", async () => {
      await storage.saveRangeVisit(validRangeVisitInput());
      const [created] = await storage.getRangeVisits();

      await storage.deleteRangeVisit(created.id);

      expect(deleteImages).toHaveBeenCalledWith("range-visit", created.id);
      expect(await storage.getRangeVisits()).toEqual([]);
    });

    it("returns an empty array when nothing is stored", async () => {
      expect(await storage.getRangeVisits()).toEqual([]);
    });
  });

  describe("updateAmmunitionQuantity", () => {
    it("decrements the quantity", async () => {
      await storage.saveAmmunition(validAmmunitionInput({ quantity: 50 }));
      const [created] = await storage.getAmmunition();

      await storage.updateAmmunitionQuantity(created.id, -30);

      const [updated] = await storage.getAmmunition();
      expect(updated.quantity).toBe(20);
    });

    it("increments the quantity", async () => {
      await storage.saveAmmunition(validAmmunitionInput({ quantity: 50 }));
      const [created] = await storage.getAmmunition();

      await storage.updateAmmunitionQuantity(created.id, 10);

      const [updated] = await storage.getAmmunition();
      expect(updated.quantity).toBe(60);
    });

    it("clamps the quantity at zero", async () => {
      await storage.saveAmmunition(validAmmunitionInput({ quantity: 5 }));
      const [created] = await storage.getAmmunition();

      await storage.updateAmmunitionQuantity(created.id, -20);

      const [updated] = await storage.getAmmunition();
      expect(updated.quantity).toBe(0);
    });

    it("throws when the ammunition is not found", async () => {
      await expect(
        storage.updateAmmunitionQuantity("missing-id", -5)
      ).rejects.toThrow("Ammunition not found");
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        "Storage.updateAmmunitionQuantity",
        { userMessage: "Failed to update ammunition quantity." }
      );
    });
  });

  describe("updateFirearmRoundsFired", () => {
    it("adds rounds to the firearm", async () => {
      await storage.saveFirearm(validFirearmInput());
      const [created] = await storage.getFirearms();

      await storage.updateFirearmRoundsFired(created.id, 100);

      const [updated] = await storage.getFirearms();
      expect(updated.roundsFired).toBe(100);
    });

    it("throws when the firearm is not found", async () => {
      await expect(
        storage.updateFirearmRoundsFired("missing-id", 10)
      ).rejects.toThrow("Firearm not found");
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        "Storage.updateFirearmRoundsFired",
        { userMessage: "Failed to update firearm rounds fired." }
      );
    });
  });

  describe("saveRangeVisitWithAmmunition", () => {
    it("saves the visit, deducts ammunition and adds firearm rounds on create", async () => {
      await storage.saveFirearm(validFirearmInput());
      await storage.saveAmmunition(validAmmunitionInput({ quantity: 100 }));
      const [firearm] = await storage.getFirearms();
      const [ammo] = await storage.getAmmunition();

      await storage.saveRangeVisitWithAmmunition(
        validRangeVisitInput({
          firearmsUsed: [firearm.id],
          ammunitionUsed: {
            [firearm.id]: { ammunitionId: ammo.id, rounds: 25 },
          },
        })
      );

      const [visit] = await storage.getRangeVisits();
      expect(visit.ammunitionUsed).toEqual({
        [firearm.id]: { ammunitionId: ammo.id, rounds: 25 },
      });

      const [updatedAmmo] = await storage.getAmmunition();
      expect(updatedAmmo.quantity).toBe(75);

      const [updatedFirearm] = await storage.getFirearms();
      expect(updatedFirearm.roundsFired).toBe(25);
    });

    it("clamps ammunition deduction at zero", async () => {
      await storage.saveFirearm(validFirearmInput());
      await storage.saveAmmunition(validAmmunitionInput({ quantity: 10 }));
      const [firearm] = await storage.getFirearms();
      const [ammo] = await storage.getAmmunition();

      await storage.saveRangeVisitWithAmmunition(
        validRangeVisitInput({
          firearmsUsed: [firearm.id],
          ammunitionUsed: {
            [firearm.id]: { ammunitionId: ammo.id, rounds: 25 },
          },
        })
      );

      const [updatedAmmo] = await storage.getAmmunition();
      expect(updatedAmmo.quantity).toBe(0);

      const [updatedFirearm] = await storage.getFirearms();
      expect(updatedFirearm.roundsFired).toBe(25);
    });

    it("applies the rounds difference when increasing rounds on update", async () => {
      await storage.saveFirearm(validFirearmInput());
      await storage.saveAmmunition(validAmmunitionInput({ quantity: 100 }));
      const [firearm] = await storage.getFirearms();
      const [ammo] = await storage.getAmmunition();

      await storage.saveRangeVisitWithAmmunition(
        validRangeVisitInput({
          firearmsUsed: [firearm.id],
          ammunitionUsed: {
            [firearm.id]: { ammunitionId: ammo.id, rounds: 25 },
          },
        })
      );
      const [created] = await storage.getRangeVisits();

      await storage.saveRangeVisitWithAmmunition(
        validRangeVisitInput({
          id: created.id,
          firearmsUsed: [firearm.id],
          ammunitionUsed: {
            [firearm.id]: { ammunitionId: ammo.id, rounds: 40 },
          },
        })
      );

      const [updatedAmmo] = await storage.getAmmunition();
      expect(updatedAmmo.quantity).toBe(60);
      const [updatedFirearm] = await storage.getFirearms();
      expect(updatedFirearm.roundsFired).toBe(40);
    });

    it("restores ammunition and subtracts firearm rounds when rounds decrease", async () => {
      await storage.saveFirearm(validFirearmInput());
      await storage.saveAmmunition(validAmmunitionInput({ quantity: 100 }));
      const [firearm] = await storage.getFirearms();
      const [ammo] = await storage.getAmmunition();

      await storage.saveRangeVisitWithAmmunition(
        validRangeVisitInput({
          firearmsUsed: [firearm.id],
          ammunitionUsed: {
            [firearm.id]: { ammunitionId: ammo.id, rounds: 25 },
          },
        })
      );
      const [created] = await storage.getRangeVisits();

      await storage.saveRangeVisitWithAmmunition(
        validRangeVisitInput({
          id: created.id,
          firearmsUsed: [firearm.id],
          ammunitionUsed: {
            [firearm.id]: { ammunitionId: ammo.id, rounds: 10 },
          },
        })
      );

      const [updatedAmmo] = await storage.getAmmunition();
      expect(updatedAmmo.quantity).toBe(90);
      const [updatedFirearm] = await storage.getFirearms();
      expect(updatedFirearm.roundsFired).toBe(10);
    });

    it("restores ammunition and removes firearm rounds when a firearm is removed from the visit", async () => {
      await storage.saveFirearm(validFirearmInput());
      await storage.saveAmmunition(validAmmunitionInput({ quantity: 100 }));
      const [firearm] = await storage.getFirearms();
      const [ammo] = await storage.getAmmunition();

      await storage.saveRangeVisitWithAmmunition(
        validRangeVisitInput({
          firearmsUsed: [firearm.id],
          ammunitionUsed: {
            [firearm.id]: { ammunitionId: ammo.id, rounds: 25 },
          },
        })
      );
      const [created] = await storage.getRangeVisits();

      await storage.saveRangeVisitWithAmmunition(
        validRangeVisitInput({
          id: created.id,
          firearmsUsed: [],
          ammunitionUsed: {},
        })
      );

      const [updatedAmmo] = await storage.getAmmunition();
      expect(updatedAmmo.quantity).toBe(100);
      const [updatedFirearm] = await storage.getFirearms();
      expect(updatedFirearm.roundsFired).toBe(0);
    });

    it("does not modify quantities when the updated visit keeps the same rounds", async () => {
      await storage.saveFirearm(validFirearmInput());
      await storage.saveAmmunition(validAmmunitionInput({ quantity: 100 }));
      const [firearm] = await storage.getFirearms();
      const [ammo] = await storage.getAmmunition();

      await storage.saveRangeVisitWithAmmunition(
        validRangeVisitInput({
          firearmsUsed: [firearm.id],
          ammunitionUsed: {
            [firearm.id]: { ammunitionId: ammo.id, rounds: 25 },
          },
        })
      );
      const [created] = await storage.getRangeVisits();

      await storage.saveRangeVisitWithAmmunition(
        validRangeVisitInput({
          id: created.id,
          firearmsUsed: [firearm.id],
          ammunitionUsed: {
            [firearm.id]: { ammunitionId: ammo.id, rounds: 25 },
          },
        })
      );

      const [updatedAmmo] = await storage.getAmmunition();
      expect(updatedAmmo.quantity).toBe(75);
      const [updatedFirearm] = await storage.getFirearms();
      expect(updatedFirearm.roundsFired).toBe(25);
    });

    it("does not adjust quantities when switching ammunition type with the same rounds", async () => {
      await storage.saveFirearm(validFirearmInput());
      await storage.saveAmmunition(validAmmunitionInput({ brand: "Old", quantity: 100 }));
      await storage.saveAmmunition(validAmmunitionInput({ brand: "New", quantity: 100 }));
      const [firearm] = await storage.getFirearms();
      const [oldAmmo, newAmmo] = await storage.getAmmunition();

      await storage.saveRangeVisitWithAmmunition(
        validRangeVisitInput({
          firearmsUsed: [firearm.id],
          ammunitionUsed: {
            [firearm.id]: { ammunitionId: oldAmmo.id, rounds: 10 },
          },
        })
      );
      const [created] = await storage.getRangeVisits();

      await storage.saveRangeVisitWithAmmunition(
        validRangeVisitInput({
          id: created.id,
          firearmsUsed: [firearm.id],
          ammunitionUsed: {
            [firearm.id]: { ammunitionId: newAmmo.id, rounds: 10 },
          },
        })
      );

      const ammoList = await storage.getAmmunition();
      expect(ammoList.find((a) => a.id === oldAmmo.id)?.quantity).toBe(90);
      expect(ammoList.find((a) => a.id === newAmmo.id)?.quantity).toBe(100);
      const [updatedFirearm] = await storage.getFirearms();
      expect(updatedFirearm.roundsFired).toBe(10);
    });

    it("only deducts the difference from the new ammunition type when switching type with more rounds", async () => {
      await storage.saveFirearm(validFirearmInput());
      await storage.saveAmmunition(validAmmunitionInput({ brand: "Old", quantity: 100 }));
      await storage.saveAmmunition(validAmmunitionInput({ brand: "New", quantity: 100 }));
      const [firearm] = await storage.getFirearms();
      const [oldAmmo, newAmmo] = await storage.getAmmunition();

      await storage.saveRangeVisitWithAmmunition(
        validRangeVisitInput({
          firearmsUsed: [firearm.id],
          ammunitionUsed: {
            [firearm.id]: { ammunitionId: oldAmmo.id, rounds: 10 },
          },
        })
      );
      const [created] = await storage.getRangeVisits();

      await storage.saveRangeVisitWithAmmunition(
        validRangeVisitInput({
          id: created.id,
          firearmsUsed: [firearm.id],
          ammunitionUsed: {
            [firearm.id]: { ammunitionId: newAmmo.id, rounds: 25 },
          },
        })
      );

      const ammoList = await storage.getAmmunition();
      expect(ammoList.find((a) => a.id === oldAmmo.id)?.quantity).toBe(90);
      expect(ammoList.find((a) => a.id === newAmmo.id)?.quantity).toBe(85);
      const [updatedFirearm] = await storage.getFirearms();
      expect(updatedFirearm.roundsFired).toBe(25);
    });

    it("keeps the visit saved even when a later ammunition update fails (partial write)", async () => {
      await storage.saveFirearm(validFirearmInput());
      const [firearm] = await storage.getFirearms();

      await expect(
        storage.saveRangeVisitWithAmmunition(
          validRangeVisitInput({
            firearmsUsed: [firearm.id],
            ammunitionUsed: {
              [firearm.id]: { ammunitionId: "missing-ammo", rounds: 5 },
            },
          })
        )
      ).rejects.toThrow("Ammunition not found");

      // Documented partial-write behavior: the visit was persisted before the failure.
      const visits = await storage.getRangeVisits();
      expect(visits).toHaveLength(1);
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        "Storage.saveRangeVisitWithAmmunition",
        expect.objectContaining({
          userMessage: "Failed to save range visit with ammunition.",
        })
      );
    });

    it("keeps the visit and ammunition deduction even when the firearm update fails (partial write)", async () => {
      await storage.saveAmmunition(validAmmunitionInput({ quantity: 100 }));
      const [ammo] = await storage.getAmmunition();

      await expect(
        storage.saveRangeVisitWithAmmunition(
          validRangeVisitInput({
            firearmsUsed: ["missing-firearm"],
            ammunitionUsed: {
              "missing-firearm": { ammunitionId: ammo.id, rounds: 30 },
            },
          })
        )
      ).rejects.toThrow("Firearm not found");

      const visits = await storage.getRangeVisits();
      expect(visits).toHaveLength(1);
      const [updatedAmmo] = await storage.getAmmunition();
      expect(updatedAmmo.quantity).toBe(70);
    });
  });

  describe("settings", () => {
    it("returns defaults when no settings are stored", async () => {
      expect(await storage.getSettings()).toEqual({
        currency: "USD",
        biometricLockEnabled: true,
        crtEffectEnabled: true,
      });
    });

    it("defaults biometricLockEnabled to true for legacy settings", async () => {
      memoryStorage.map.set(
        "@storage:settings",
        JSON.stringify({ currency: "EUR" })
      );

      expect(await storage.getSettings()).toEqual({
        currency: "EUR",
        biometricLockEnabled: true,
        crtEffectEnabled: true,
      });
    });

    it("defaults crtEffectEnabled to true for legacy settings", async () => {
      memoryStorage.map.set(
        "@storage:settings",
        JSON.stringify({ currency: "EUR", biometricLockEnabled: false })
      );

      expect(await storage.getSettings()).toEqual({
        currency: "EUR",
        biometricLockEnabled: false,
        crtEffectEnabled: true,
      });
    });

    it("reads an explicit biometricLockEnabled of false", async () => {
      memoryStorage.map.set(
        "@storage:settings",
        JSON.stringify({ currency: "EUR", biometricLockEnabled: false })
      );

      expect(await storage.getSettings()).toEqual({
        currency: "EUR",
        biometricLockEnabled: false,
        crtEffectEnabled: true,
      });
    });

    it("reads an explicit crtEffectEnabled of false", async () => {
      memoryStorage.map.set(
        "@storage:settings",
        JSON.stringify({
          currency: "EUR",
          biometricLockEnabled: true,
          crtEffectEnabled: false,
        })
      );

      expect(await storage.getSettings()).toEqual({
        currency: "EUR",
        biometricLockEnabled: true,
        crtEffectEnabled: false,
      });
    });

    it("falls back to defaults when stored settings are corrupt", async () => {
      memoryStorage.map.set("@storage:settings", "not-json");

      expect(await storage.getSettings()).toEqual({
        currency: "USD",
        biometricLockEnabled: true,
        crtEffectEnabled: true,
      });
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        "Storage.getSettings",
        { userMessage: "Failed to get settings." }
      );
    });

    it("setCurrency preserves biometricLockEnabled and crtEffectEnabled", async () => {
      await storage.setCurrency("EUR");
      await storage.setBiometricLockEnabled(false);
      await storage.setCrtEffectEnabled(false);
      expect(await storage.getSettings()).toEqual({
        currency: "EUR",
        biometricLockEnabled: false,
        crtEffectEnabled: false,
      });

      await storage.setCurrency("GBP");
      expect(await storage.getSettings()).toEqual({
        currency: "GBP",
        biometricLockEnabled: false,
        crtEffectEnabled: false,
      });

      await storage.setBiometricLockEnabled(true);
      expect(await storage.getSettings()).toEqual({
        currency: "GBP",
        biometricLockEnabled: true,
        crtEffectEnabled: false,
      });

      await storage.setCrtEffectEnabled(true);
      expect(await storage.getSettings()).toEqual({
        currency: "GBP",
        biometricLockEnabled: true,
        crtEffectEnabled: true,
      });
    });

    it("getCurrency returns the configured currency", async () => {
      expect(await storage.getCurrency()).toBe("USD");

      await storage.setCurrency("PLN");
      expect(await storage.getCurrency()).toBe("PLN");
    });
  });

  describe("clearAllData", () => {
    it("wipes entity data but preserves settings", async () => {
      await storage.saveFirearm(validFirearmInput());
      await storage.saveAmmunition(validAmmunitionInput());
      await storage.saveRangeVisit(validRangeVisitInput());
      await storage.setCurrency("EUR");
      await storage.setBiometricLockEnabled(false);
      memoryStorage.map.set("image_paths_firearm_abc", "[]");

      await storage.clearAllData();

      expect(await storage.getFirearms()).toEqual([]);
      expect(await storage.getAmmunition()).toEqual([]);
      expect(await storage.getRangeVisits()).toEqual([]);
      expect(await storage.getSettings()).toEqual({
        currency: "EUR",
        biometricLockEnabled: false,
        crtEffectEnabled: true,
      });
      expect(memoryStorage.map.has("image_paths_firearm_abc")).toBe(false);
    });

    it("deletes and recreates the images directory", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

      await storage.clearAllData();

      const imagesDir = `${FileSystem.documentDirectory}images/`;
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(imagesDir, {
        idempotent: true,
      });
      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(imagesDir, {
        intermediates: true,
      });
      expect(setNoBackupFlag).toHaveBeenCalledWith(imagesDir);
    });
  });

  describe("image paths", () => {
    it("getFirearmImages returns paths from image storage", async () => {
      jest.mocked(getImagePaths).mockResolvedValue(["/a.jpg"]);

      expect(await storage.getFirearmImages("f1")).toEqual(["/a.jpg"]);
      expect(getImagePaths).toHaveBeenCalledWith("firearm", "f1");
    });

    it("getFirearmImages propagates image storage failures", async () => {
      jest.mocked(getImagePaths).mockRejectedValue(new Error("boom"));

      // The image-path getters do not swallow async rejections (the internal
      // catch only handles synchronous throws), so the error propagates.
      await expect(storage.getFirearmImages("f1")).rejects.toThrow("boom");
    });

    it("getRangeVisitImages delegates to image storage", async () => {
      jest.mocked(getImagePaths).mockResolvedValue(["/v.jpg"]);

      expect(await storage.getRangeVisitImages("v1")).toEqual(["/v.jpg"]);
      expect(getImagePaths).toHaveBeenCalledWith("range-visit", "v1");
    });

    it("getAmmunitionImages delegates to image storage", async () => {
      jest.mocked(getImagePaths).mockResolvedValue(["/a.jpg"]);

      expect(await storage.getAmmunitionImages("a1")).toEqual(["/a.jpg"]);
      expect(getImagePaths).toHaveBeenCalledWith("ammunition", "a1");
    });
  });
});
