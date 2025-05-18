import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import { ammunitionStorageSchema } from "../../validation/storageSchemas";

const AMMUNITION_STORAGE_KEY = "@glock-log:ammunition";

export async function up(): Promise<void> {
  try {
    // Get the current ammunition data
    const data = await AsyncStorage.getItem(AMMUNITION_STORAGE_KEY);
    if (!data) return;

    // Parse the data
    const ammunitionList = JSON.parse(data);

    // Convert grain values from number to string
    const updatedAmmunitionList = ammunitionList.map((ammo: any) => ({
      ...ammo,
      grain: String(ammo.grain),
    }));

    // Validate the updated data
    const validatedData = z
      .array(ammunitionStorageSchema)
      .parse(updatedAmmunitionList);

    // Save the updated data
    await AsyncStorage.setItem(
      AMMUNITION_STORAGE_KEY,
      JSON.stringify(validatedData)
    );
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

export async function down(): Promise<void> {
  try {
    // Get the current ammunition data
    const data = await AsyncStorage.getItem(AMMUNITION_STORAGE_KEY);
    if (!data) return;

    // Parse the data
    const ammunitionList = JSON.parse(data);

    // Convert grain values from string to number
    const updatedAmmunitionList = ammunitionList.map((ammo: any) => ({
      ...ammo,
      grain: Number(ammo.grain),
    }));

    // Save the updated data
    await AsyncStorage.setItem(
      AMMUNITION_STORAGE_KEY,
      JSON.stringify(updatedAmmunitionList)
    );
  } catch (error) {
    console.error("Migration rollback failed:", error);
    throw error;
  }
}
