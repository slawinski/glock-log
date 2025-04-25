import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Firearm {
  id: string;
  modelName: string;
  caliber: string;
  datePurchased: string;
  amountPaid: number;
  photos: string[];
  roundsFired: number;
}

export interface RangeVisit {
  id: string;
  date: string;
  location: string;
  roundsPerFirearm: { [key: string]: number };
  ammunitionUsed: { [key: string]: number }; // caliber -> quantity used
  notes: string;
}

export interface Ammunition {
  id: string;
  caliber: string;
  brand: string;
  grain: number;
  quantity: number;
  amountPaid: number;
  datePurchased: string;
  notes?: string;
}

class StorageService {
  private static instance: StorageService;
  private firearmsKey = "@firearms";
  private rangeVisitsKey = "@rangeVisits";
  private ammunitionKey = "@ammunition";

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Firearms
  async getFirearms(): Promise<Firearm[]> {
    try {
      const data = await AsyncStorage.getItem(this.firearmsKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting firearms:", error);
      return [];
    }
  }

  async saveFirearm(firearm: Firearm): Promise<void> {
    try {
      const firearms = await this.getFirearms();
      const index = firearms.findIndex((f) => f.id === firearm.id);

      if (index >= 0) {
        firearms[index] = firearm;
      } else {
        firearms.push(firearm);
      }

      await AsyncStorage.setItem(this.firearmsKey, JSON.stringify(firearms));
    } catch (error) {
      console.error("Error saving firearm:", error);
    }
  }

  async deleteFirearm(id: string): Promise<void> {
    try {
      const firearms = await this.getFirearms();
      const filteredFirearms = firearms.filter((f) => f.id !== id);
      await AsyncStorage.setItem(
        this.firearmsKey,
        JSON.stringify(filteredFirearms)
      );
    } catch (error) {
      console.error("Error deleting firearm:", error);
    }
  }

  // Range Visits
  async getRangeVisits(): Promise<RangeVisit[]> {
    try {
      const data = await AsyncStorage.getItem(this.rangeVisitsKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting range visits:", error);
      return [];
    }
  }

  async saveRangeVisit(visit: RangeVisit): Promise<void> {
    try {
      const visits = await this.getRangeVisits();
      const index = visits.findIndex((v) => v.id === visit.id);

      if (index >= 0) {
        visits[index] = visit;
      } else {
        visits.push(visit);
      }

      // Update ammunition inventory and firearm rounds
      for (const [firearmId, rounds] of Object.entries(
        visit.roundsPerFirearm
      )) {
        // Get the firearm to find its caliber
        const firearms = await this.getFirearms();
        const firearm = firearms.find((f) => f.id === firearmId);

        if (firearm) {
          // Update firearm rounds
          await this.updateFirearmRounds(firearmId, rounds);

          // Get ammunition of matching caliber
          const matchingAmmo = await this.getAmmunitionByCaliber(
            firearm.caliber
          );

          // Update ammunition inventory
          let roundsToDeduct = rounds;
          for (const ammo of matchingAmmo) {
            if (roundsToDeduct <= 0) break;

            const roundsToUse = Math.min(roundsToDeduct, ammo.quantity);
            await this.updateAmmunitionQuantity(
              ammo.id,
              ammo.quantity - roundsToUse
            );
            roundsToDeduct -= roundsToUse;

            // Track ammunition usage
            if (!visit.ammunitionUsed[ammo.id]) {
              visit.ammunitionUsed[ammo.id] = 0;
            }
            visit.ammunitionUsed[ammo.id] += roundsToUse;
          }
        }
      }

      await AsyncStorage.setItem(this.rangeVisitsKey, JSON.stringify(visits));
    } catch (error) {
      console.error("Error saving range visit:", error);
    }
  }

  async deleteRangeVisit(id: string): Promise<void> {
    try {
      const visits = await this.getRangeVisits();
      const filteredVisits = visits.filter((v) => v.id !== id);
      await AsyncStorage.setItem(
        this.rangeVisitsKey,
        JSON.stringify(filteredVisits)
      );
    } catch (error) {
      console.error("Error deleting range visit:", error);
    }
  }

  // Ammunition
  async getAmmunition(): Promise<Ammunition[]> {
    try {
      const data = await AsyncStorage.getItem(this.ammunitionKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting ammunition:", error);
      return [];
    }
  }

  async saveAmmunition(ammo: Ammunition): Promise<void> {
    try {
      const ammunition = await this.getAmmunition();
      const index = ammunition.findIndex((a) => a.id === ammo.id);

      if (index >= 0) {
        ammunition[index] = ammo;
      } else {
        ammunition.push(ammo);
      }

      await AsyncStorage.setItem(
        this.ammunitionKey,
        JSON.stringify(ammunition)
      );
    } catch (error) {
      console.error("Error saving ammunition:", error);
    }
  }

  async deleteAmmunition(id: string): Promise<void> {
    try {
      const ammunition = await this.getAmmunition();
      const filteredAmmunition = ammunition.filter((a) => a.id !== id);
      await AsyncStorage.setItem(
        this.ammunitionKey,
        JSON.stringify(filteredAmmunition)
      );
    } catch (error) {
      console.error("Error deleting ammunition:", error);
    }
  }

  // Helper function to get ammunition by caliber
  async getAmmunitionByCaliber(caliber: string): Promise<Ammunition[]> {
    try {
      const ammunition = await this.getAmmunition();
      return ammunition.filter((a) => a.caliber === caliber);
    } catch (error) {
      console.error("Error getting ammunition by caliber:", error);
      return [];
    }
  }

  // Helper function to update ammunition quantity
  async updateAmmunitionQuantity(id: string, quantity: number): Promise<void> {
    try {
      const ammunition = await this.getAmmunition();
      const index = ammunition.findIndex((a) => a.id === id);

      if (index >= 0) {
        ammunition[index].quantity = Math.max(0, quantity); // Prevent negative quantities
        await AsyncStorage.setItem(
          this.ammunitionKey,
          JSON.stringify(ammunition)
        );
      }
    } catch (error) {
      console.error("Error updating ammunition quantity:", error);
    }
  }

  // Helper function to update firearm rounds fired
  async updateFirearmRounds(id: string, rounds: number): Promise<void> {
    try {
      const firearms = await this.getFirearms();
      const index = firearms.findIndex((f) => f.id === id);

      if (index >= 0) {
        firearms[index].roundsFired += rounds;
        await AsyncStorage.setItem(this.firearmsKey, JSON.stringify(firearms));
      }
    } catch (error) {
      console.error("Error updating firearm rounds:", error);
    }
  }
}

export const storage = StorageService.getInstance();
