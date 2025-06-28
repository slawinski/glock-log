import { MMKV } from "react-native-mmkv";
import { StorageInterface, StorageConfig } from "../storage-interface";
import { AsyncStorageAdapter } from "./asyncstorage-adapter";

export class MMKVAdapter implements StorageInterface {
  private mmkv: MMKV | null = null;
  private fallbackStorage: AsyncStorageAdapter | null = null;

  constructor(config?: StorageConfig) {
    try {
      this.mmkv = new MMKV({
        id: config?.id || "glock-log-storage",
        encryptionKey: config?.encryptionKey,
      });
    } catch (error) {
      console.warn(
        "MMKV initialization failed, falling back to AsyncStorage:",
        error
      );
      this.fallbackStorage = new AsyncStorageAdapter();
    }
  }

  private getStorage(): StorageInterface {
    if (this.mmkv) {
      return {
        getItem: async (key: string) => {
          try {
            const value = this.mmkv!.getString(key);
            return value || null;
          } catch (error) {
            console.error("MMKV getItem error:", error);
            return null;
          }
        },
        setItem: async (key: string, value: string) => {
          try {
            this.mmkv!.set(key, value);
          } catch (error) {
            console.error("MMKV setItem error:", error);
            throw error;
          }
        },
        removeItem: async (key: string) => {
          try {
            this.mmkv!.delete(key);
          } catch (error) {
            console.error("MMKV removeItem error:", error);
            throw error;
          }
        },
        clear: async () => {
          try {
            this.mmkv!.clearAll();
          } catch (error) {
            console.error("MMKV clear error:", error);
            throw error;
          }
        },
        getAllKeys: async () => {
          try {
            return this.mmkv!.getAllKeys();
          } catch (error) {
            console.error("MMKV getAllKeys error:", error);
            return [];
          }
        },
      };
    } else if (this.fallbackStorage) {
      return this.fallbackStorage;
    } else {
      throw new Error("No storage available");
    }
  }

  async getItem(key: string): Promise<string | null> {
    return this.getStorage().getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    return this.getStorage().setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    return this.getStorage().removeItem(key);
  }

  async clear(): Promise<void> {
    return this.getStorage().clear();
  }

  async getAllKeys(): Promise<string[]> {
    return this.getStorage().getAllKeys();
  }
}
