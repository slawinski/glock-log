import { z } from "zod";
import { StorageFactory } from "./storage-factory";
import {
  firearmStorageSchema,
  ammunitionStorageSchema,
  rangeVisitStorageSchema,
  FirearmStorage,
  AmmunitionStorage,
  RangeVisitStorage,
} from "../validation/storageSchemas";
import {
  FirearmInput,
  RangeVisitInput,
  AmmunitionInput,
} from "../validation/inputSchemas";
import {
  saveImageToFileSystem,
  storeImagePaths,
  deleteImages,
  getImagePaths,
} from "./image-storage";
import { handleStorageError, logAndGetUserError } from "./error-handler";

const STORAGE_KEYS = {
  FIREARMS: "@storage:firearms",
  AMMUNITION: "@storage:ammunition",
  RANGE_VISITS: "@storage:range-visits",
};

// Helper function to validate and parse data
async function validateAndParse<T>(
  data: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const parsed = JSON.parse(data);
    return schema.parse(parsed);
  } catch (error) {
    console.error("Validation error:", error);
    throw new Error("Data validation failed");
  }
}

// Helper function to validate data before saving
function validateBeforeSave<T>(data: T, schema: z.ZodSchema<T>): T {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error("Validation error:", error);
    throw new Error("Data validation failed");
  }
}

// Helper function to generate a unique ID
function generateId(prefix: string): string {
  // Generate a more secure random ID using crypto.getRandomValues if available
  const timestamp = Date.now();
  const randomPart = typeof crypto !== 'undefined' && crypto.getRandomValues
    ? Array.from(crypto.getRandomValues(new Uint8Array(6)))
        .map(b => b.toString(36))
        .join('')
    : Math.random().toString(36).slice(2, 11);
  
  return `${prefix}-${timestamp}-${randomPart}`;
}

export const storage = {
  // Firearms
  async saveFirearm(firearm: FirearmInput): Promise<void> {
    try {
      const firearms = await this.getFirearms();
      const isUpdate = !!firearm.id;
      const firearmId = firearm.id || generateId("firearm");

      let existingFirearm: FirearmStorage | undefined;
      if (isUpdate) {
        existingFirearm = firearms.find((f) => f.id === firearmId);
      }

      // Handle image storage if photos are provided
      let savedImagePaths: string[] = [];
      if (firearm.photos && firearm.photos.length > 0) {
        const imageUrisToSave = firearm.photos.filter(
          (p) => !p.startsWith("placeholder:")
        );
        const placeholderPhotos = firearm.photos.filter((p) =>
          p.startsWith("placeholder:")
        );

        if (imageUrisToSave.length > 0) {
          const newImagePaths = await Promise.all(
            imageUrisToSave.map(async (imageUri) => {
              return await saveImageToFileSystem(
                imageUri,
                "firearm",
                firearmId
              );
            })
          );
          savedImagePaths = [...newImagePaths, ...placeholderPhotos];
        } else {
          savedImagePaths = placeholderPhotos;
        }

        // Store image paths in MMKV
        storeImagePaths("firearm", firearmId, savedImagePaths);
      }

      const { initialRoundsFired, ...restOfFirearm } = firearm;

      const storageData: FirearmStorage = {
        ...restOfFirearm,
        id: firearmId,
        createdAt: existingFirearm?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        roundsFired: existingFirearm?.roundsFired || initialRoundsFired || 0,
        // Replace original URIs with saved file paths
        photos:
          savedImagePaths.length > 0
            ? savedImagePaths
            : existingFirearm?.photos || [],
      };

      const validatedFirearm = validateBeforeSave(
        storageData,
        firearmStorageSchema
      );

      const index = firearms.findIndex((f) => f.id === validatedFirearm.id);

      if (index === -1) {
        firearms.push(validatedFirearm);
      } else {
        firearms[index] = validatedFirearm;
      }

      const storage = StorageFactory.getStorage();
      await storage.setItem(STORAGE_KEYS.FIREARMS, JSON.stringify(firearms));
    } catch (error) {
      const appError = handleStorageError(error, "save firearm");
      throw new Error(appError.userMessage);
    }
  },

  async getFirearms(): Promise<FirearmStorage[]> {
    try {
      const storage = StorageFactory.getStorage();
      const data = await storage.getItem(STORAGE_KEYS.FIREARMS);
      if (!data) return [];
      return validateAndParse(data, z.array(firearmStorageSchema));
    } catch (error) {
      const appError = handleStorageError(error, "load firearms");
      throw new Error(appError.userMessage);
    }
  },

  async deleteFirearm(id: string): Promise<void> {
    try {
      // Delete associated images first
      await deleteImages("firearm", id);

      const firearms = await this.getFirearms();
      const filteredFirearms = firearms.filter((firearm) => firearm.id !== id);
      const storage = StorageFactory.getStorage();
      await storage.setItem(
        STORAGE_KEYS.FIREARMS,
        JSON.stringify(filteredFirearms)
      );
    } catch (error) {
      const appError = handleStorageError(error, "delete firearm");
      throw new Error(appError.userMessage);
    }
  },

  // Ammunition
  async saveAmmunition(ammunition: AmmunitionInput): Promise<void> {
    try {
      const ammunitionList = await this.getAmmunition();
      const isUpdate = !!ammunition.id;
      const ammunitionId = ammunition.id || generateId("ammo");

      let existingAmmunition: AmmunitionStorage | undefined;
      if (isUpdate) {
        existingAmmunition = ammunitionList.find((a) => a.id === ammunitionId);
      }
      const storageData: AmmunitionStorage = {
        ...ammunition,
        id: ammunitionId,
        createdAt: existingAmmunition?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const validatedAmmunition = validateBeforeSave(
        storageData,
        ammunitionStorageSchema
      );

      const index = ammunitionList.findIndex(
        (a) => a.id === validatedAmmunition.id
      );

      if (index === -1) {
        ammunitionList.push(validatedAmmunition);
      } else {
        ammunitionList[index] = validatedAmmunition;
      }

      const storage = StorageFactory.getStorage();
      await storage.setItem(
        STORAGE_KEYS.AMMUNITION,
        JSON.stringify(ammunitionList)
      );
    } catch (error) {
      const appError = handleStorageError(error, "save ammunition");
      throw new Error(appError.userMessage);
    }
  },

  async getAmmunition(): Promise<AmmunitionStorage[]> {
    try {
      const storage = StorageFactory.getStorage();
      const data = await storage.getItem(STORAGE_KEYS.AMMUNITION);
      if (!data) return [];
      return validateAndParse(data, z.array(ammunitionStorageSchema));
    } catch (error) {
      const appError = handleStorageError(error, "load ammunition");
      throw new Error(appError.userMessage);
    }
  },

  async deleteAmmunition(id: string): Promise<void> {
    try {
      const ammunition = await this.getAmmunition();
      const filteredAmmunition = ammunition.filter((ammo) => ammo.id !== id);
      const storage = StorageFactory.getStorage();
      await storage.setItem(
        STORAGE_KEYS.AMMUNITION,
        JSON.stringify(filteredAmmunition)
      );
    } catch (error) {
      const appError = handleStorageError(error, "delete ammunition");
      throw new Error(appError.userMessage);
    }
  },

  // Range Visits
  async saveRangeVisit(visit: RangeVisitInput): Promise<void> {
    try {
      const visits = await this.getRangeVisits();
      const isUpdate = !!visit.id;
      const visitId = visit.id || generateId("visit");

      let existingVisit: RangeVisitStorage | undefined;
      if (isUpdate) {
        existingVisit = visits.find((v) => v.id === visitId);
      }

      // Handle image storage if photos are provided
      let savedImagePaths: string[] = [];
      if (visit.photos && visit.photos.length > 0) {
        savedImagePaths = await Promise.all(
          visit.photos.map(async (imageUri) => {
            return await saveImageToFileSystem(
              imageUri,
              "range-visit",
              visitId
            );
          })
        );

        // Store image paths in MMKV
        storeImagePaths("range-visit", visitId, savedImagePaths);
      }

      const storageData: RangeVisitStorage = {
        ...visit,
        ammunitionUsed: visit.ammunitionUsed || {},
        id: visitId,
        createdAt: existingVisit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Replace original URIs with saved file paths
        photos:
          savedImagePaths.length > 0
            ? savedImagePaths
            : existingVisit?.photos || [],
      };

      const validatedVisit = validateBeforeSave(
        storageData,
        rangeVisitStorageSchema
      );

      const index = visits.findIndex((v) => v.id === validatedVisit.id);

      if (index === -1) {
        visits.push(validatedVisit);
      } else {
        visits[index] = validatedVisit;
      }

      const storage = StorageFactory.getStorage();
      await storage.setItem(STORAGE_KEYS.RANGE_VISITS, JSON.stringify(visits));
    } catch (error) {
      console.error("Error saving range visit:", error);
      throw error;
    }
  },

  async getRangeVisits(): Promise<RangeVisitStorage[]> {
    try {
      const storage = StorageFactory.getStorage();
      const data = await storage.getItem(STORAGE_KEYS.RANGE_VISITS);
      if (!data) return [];
      return validateAndParse(data, z.array(rangeVisitStorageSchema));
    } catch (error) {
      console.error("Error getting range visits:", error);
      throw error;
    }
  },

  async deleteRangeVisit(id: string): Promise<void> {
    try {
      // Delete associated images first
      await deleteImages("range-visit", id);

      const visits = await this.getRangeVisits();
      const filteredVisits = visits.filter((visit) => visit.id !== id);
      const storage = StorageFactory.getStorage();
      await storage.setItem(
        STORAGE_KEYS.RANGE_VISITS,
        JSON.stringify(filteredVisits)
      );
    } catch (error) {
      console.error("Error deleting range visit:", error);
      throw error;
    }
  },

  async updateAmmunitionQuantity(
    ammunitionId: string,
    quantityChange: number
  ): Promise<void> {
    try {
      const ammunition = await this.getAmmunition();
      const ammoIndex = ammunition.findIndex((a) => a.id === ammunitionId);
      if (ammoIndex === -1) {
        throw new Error("Ammunition not found");
      }

      const currentQuantity = ammunition[ammoIndex].quantity || 0;
      const newQuantity = Math.max(0, currentQuantity + quantityChange);
      ammunition[ammoIndex].quantity = newQuantity;
      ammunition[ammoIndex].updatedAt = new Date().toISOString();

      const storage = StorageFactory.getStorage();
      await storage.setItem(
        STORAGE_KEYS.AMMUNITION,
        JSON.stringify(ammunition)
      );
    } catch (error) {
      console.error("Error updating ammunition quantity:", error);
      throw error;
    }
  },

  async updateFirearmRoundsFired(
    firearmId: string,
    roundsToAdd: number
  ): Promise<void> {
    try {
      const firearms = await this.getFirearms();
      const firearmIndex = firearms.findIndex((f) => f.id === firearmId);
      if (firearmIndex === -1) {
        throw new Error("Firearm not found");
      }

      const currentRounds = firearms[firearmIndex].roundsFired || 0;
      firearms[firearmIndex].roundsFired = currentRounds + roundsToAdd;
      firearms[firearmIndex].updatedAt = new Date().toISOString();

      const storage = StorageFactory.getStorage();
      await storage.setItem(STORAGE_KEYS.FIREARMS, JSON.stringify(firearms));
    } catch (error) {
      console.error("Error updating firearm rounds fired:", error);
      throw error;
    }
  },

  async saveRangeVisitWithAmmunition(visit: RangeVisitInput): Promise<void> {
    try {
      await this.saveRangeVisit(visit);

      // Update ammunition quantities
      if (visit.ammunitionUsed) {
        for (const ammoData of Object.values(visit.ammunitionUsed)) {
          await this.updateAmmunitionQuantity(
            ammoData.ammunitionId,
            -ammoData.rounds
          );
        }
      }

      // Update firearm rounds fired for each firearm used
      if (visit.ammunitionUsed && visit.firearmsUsed.length > 0) {
        for (const firearmId of visit.firearmsUsed) {
          const ammoData = visit.ammunitionUsed[firearmId];
          if (ammoData) {
            await this.updateFirearmRoundsFired(firearmId, ammoData.rounds);
          }
        }
      }
    } catch (error) {
      console.error("Error saving range visit with ammunition:", error);
      throw error;
    }
  },

  // Image management methods
  async getFirearmImages(firearmId: string): Promise<string[]> {
    try {
      return getImagePaths("firearm", firearmId);
    } catch (error) {
      console.error("Error getting firearm images:", error);
      return [];
    }
  },

  async getRangeVisitImages(visitId: string): Promise<string[]> {
    try {
      return getImagePaths("range-visit", visitId);
    } catch (error) {
      console.error("Error getting range visit images:", error);
      return [];
    }
  },

  async getAmmunitionImages(ammunitionId: string): Promise<string[]> {
    try {
      return getImagePaths("ammunition", ammunitionId);
    } catch (error) {
      console.error("Error getting ammunition images:", error);
      return [];
    }
  },
};
