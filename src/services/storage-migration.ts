import AsyncStorage from "@react-native-async-storage/async-storage";
import { StorageFactory } from "./storage-factory";
import { getStorageConfig } from "./storage-config";

const STORAGE_KEYS = {
  FIREARMS: "@glock-log:firearms",
  AMMUNITION: "@glock-log:ammunition",
  RANGE_VISITS: "@glock-log:range-visits",
};

export class StorageMigration {
  /**
   * Migrate data from AsyncStorage to MMKV
   * This should be called once when switching from AsyncStorage to MMKV
   */
  static async migrateFromAsyncStorageToMMKV(): Promise<void> {
    try {
      console.log("Starting migration from AsyncStorage to MMKV...");

      // Configure storage factory to use MMKV
      StorageFactory.configure(getStorageConfig());
      const mmkvStorage = StorageFactory.getStorage();

      // Migrate each data type
      await this.migrateKey(STORAGE_KEYS.FIREARMS, mmkvStorage);
      await this.migrateKey(STORAGE_KEYS.AMMUNITION, mmkvStorage);
      await this.migrateKey(STORAGE_KEYS.RANGE_VISITS, mmkvStorage);

      console.log("Migration completed successfully!");
    } catch (error) {
      console.error("Migration failed:", error);
      throw error;
    }
  }

  /**
   * Migrate a single key from AsyncStorage to MMKV
   */
  private static async migrateKey(
    key: string,
    mmkvStorage: any
  ): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        await mmkvStorage.setItem(key, data);
        console.log(`Migrated key: ${key}`);
      } else {
        console.log(`No data found for key: ${key}`);
      }
    } catch (error) {
      console.error(`Failed to migrate key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if migration is needed by comparing data between storage backends
   */
  static async checkMigrationNeeded(): Promise<boolean> {
    try {
      const asyncData = await AsyncStorage.getItem(STORAGE_KEYS.FIREARMS);
      if (!asyncData) {
        console.log("No data in AsyncStorage, migration not needed");
        return false;
      }

      // Configure storage factory to use MMKV
      StorageFactory.configure(getStorageConfig());
      const mmkvStorage = StorageFactory.getStorage();
      const mmkvData = await mmkvStorage.getItem(STORAGE_KEYS.FIREARMS);

      if (!mmkvData) {
        console.log(
          "Data exists in AsyncStorage but not in MMKV, migration needed"
        );
        return true;
      }

      console.log("Data exists in both storage backends, migration not needed");
      return false;
    } catch (error) {
      console.error("Error checking migration status:", error);
      return false;
    }
  }

  /**
   * Clear all data from AsyncStorage after successful migration
   */
  static async clearAsyncStorage(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log("AsyncStorage cleared successfully");
    } catch (error) {
      console.error("Failed to clear AsyncStorage:", error);
      throw error;
    }
  }
}
