import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
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

const STORAGE_KEYS = {
  FIREARMS: "@glock-log:firearms",
  AMMUNITION: "@glock-log:ammunition",
  RANGE_VISITS: "@glock-log:range-visits",
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
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const storage = {
  // Firearms
  async saveFirearm(firearm: FirearmInput): Promise<void> {
    try {
      const storageData: FirearmStorage = {
        ...firearm,
        id: generateId("firearm"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        roundsFired: 0,
      };

      const validatedFirearm = validateBeforeSave(
        storageData,
        firearmStorageSchema
      );
      const firearms = await this.getFirearms();
      const index = firearms.findIndex((f) => f.id === validatedFirearm.id);

      if (index === -1) {
        firearms.push(validatedFirearm);
      } else {
        firearms[index] = validatedFirearm;
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.FIREARMS,
        JSON.stringify(firearms)
      );
    } catch (error) {
      console.error("Error saving firearm:", error);
      throw error;
    }
  },

  async getFirearms(): Promise<FirearmStorage[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FIREARMS);
      if (!data) return [];
      return validateAndParse(data, z.array(firearmStorageSchema));
    } catch (error) {
      console.error("Error getting firearms:", error);
      throw error;
    }
  },

  async deleteFirearm(id: string): Promise<void> {
    try {
      const firearms = await this.getFirearms();
      const filteredFirearms = firearms.filter((firearm) => firearm.id !== id);
      await AsyncStorage.setItem(
        STORAGE_KEYS.FIREARMS,
        JSON.stringify(filteredFirearms)
      );
    } catch (error) {
      console.error("Error deleting firearm:", error);
      throw error;
    }
  },

  // Ammunition
  async saveAmmunition(ammunition: AmmunitionInput): Promise<void> {
    try {
      const storageData: AmmunitionStorage = {
        ...ammunition,
        id: generateId("ammo"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const validatedAmmunition = validateBeforeSave(
        storageData,
        ammunitionStorageSchema
      );
      const ammunitionList = await this.getAmmunition();
      const index = ammunitionList.findIndex(
        (a) => a.id === validatedAmmunition.id
      );

      if (index === -1) {
        ammunitionList.push(validatedAmmunition);
      } else {
        ammunitionList[index] = validatedAmmunition;
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.AMMUNITION,
        JSON.stringify(ammunitionList)
      );
    } catch (error) {
      console.error("Error saving ammunition:", error);
      throw error;
    }
  },

  async getAmmunition(): Promise<AmmunitionStorage[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.AMMUNITION);
      if (!data) return [];
      return validateAndParse(data, z.array(ammunitionStorageSchema));
    } catch (error) {
      console.error("Error getting ammunition:", error);
      throw error;
    }
  },

  async deleteAmmunition(id: string): Promise<void> {
    try {
      const ammunition = await this.getAmmunition();
      const filteredAmmunition = ammunition.filter((ammo) => ammo.id !== id);
      await AsyncStorage.setItem(
        STORAGE_KEYS.AMMUNITION,
        JSON.stringify(filteredAmmunition)
      );
    } catch (error) {
      console.error("Error deleting ammunition:", error);
      throw error;
    }
  },

  // Range Visits
  async saveRangeVisit(visit: RangeVisitInput): Promise<void> {
    try {
      const storageData: RangeVisitStorage = {
        ...visit,
        ammunitionUsed: visit.ammunitionUsed || {},
        id: generateId("visit"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const validatedVisit = validateBeforeSave(
        storageData,
        rangeVisitStorageSchema
      );
      const visits = await this.getRangeVisits();
      const index = visits.findIndex((v) => v.id === validatedVisit.id);

      if (index === -1) {
        visits.push(validatedVisit);
      } else {
        visits[index] = validatedVisit;
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.RANGE_VISITS,
        JSON.stringify(visits)
      );
    } catch (error) {
      console.error("Error saving range visit:", error);
      throw error;
    }
  },

  async getRangeVisits(): Promise<RangeVisitStorage[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RANGE_VISITS);
      if (!data) return [];
      return validateAndParse(data, z.array(rangeVisitStorageSchema));
    } catch (error) {
      console.error("Error getting range visits:", error);
      throw error;
    }
  },

  async deleteRangeVisit(id: string): Promise<void> {
    try {
      const visits = await this.getRangeVisits();
      const filteredVisits = visits.filter((visit) => visit.id !== id);
      await AsyncStorage.setItem(
        STORAGE_KEYS.RANGE_VISITS,
        JSON.stringify(filteredVisits)
      );
    } catch (error) {
      console.error("Error deleting range visit:", error);
      throw error;
    }
  },

  // New methods for handling ammunition and range visits
  async updateAmmunitionQuantity(
    ammunitionId: string,
    quantityChange: number
  ): Promise<void> {
    try {
      const ammunitionList = await this.getAmmunition();
      const ammunition = ammunitionList.find((a) => a.id === ammunitionId);

      if (!ammunition) {
        throw new Error("Ammunition not found");
      }

      const newQuantity = ammunition.quantity + quantityChange;
      if (newQuantity < 0) {
        throw new Error("Insufficient ammunition quantity");
      }

      ammunition.quantity = newQuantity;
      ammunition.updatedAt = new Date().toISOString();

      await AsyncStorage.setItem(
        STORAGE_KEYS.AMMUNITION,
        JSON.stringify(ammunitionList)
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
      const firearm = firearms.find((f) => f.id === firearmId);

      if (!firearm) {
        throw new Error("Firearm not found");
      }

      firearm.roundsFired += roundsToAdd;
      firearm.updatedAt = new Date().toISOString();

      await AsyncStorage.setItem(
        STORAGE_KEYS.FIREARMS,
        JSON.stringify(firearms)
      );
    } catch (error) {
      console.error("Error updating firearm rounds fired:", error);
      throw error;
    }
  },

  async saveRangeVisitWithAmmunition(visit: RangeVisitInput): Promise<void> {
    try {
      // First save the range visit
      await this.saveRangeVisit(visit);

      // Then update ammunition quantities and firearm rounds fired
      if (visit.ammunitionUsed) {
        for (const [firearmId, usage] of Object.entries(visit.ammunitionUsed)) {
          // Update ammunition quantity
          await this.updateAmmunitionQuantity(
            usage.ammunitionId,
            -usage.rounds
          );

          // Update firearm rounds fired
          await this.updateFirearmRoundsFired(firearmId, usage.rounds);
        }
      }
    } catch (error) {
      console.error("Error saving range visit with ammunition:", error);
      throw error;
    }
  },
};
