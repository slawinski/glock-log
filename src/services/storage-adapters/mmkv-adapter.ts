import { handleError } from "../error-handler";
import { MMKV } from "react-native-mmkv";
import { StorageInterface, StorageConfig } from "../storage-interface";

export class MMKVAdapter implements StorageInterface {
  private mmkv: MMKV;

  constructor(config: StorageConfig) {
    try {
      this.mmkv = new MMKV({
        id: config.id || "storage",
        encryptionKey: config.encryptionKey,
      });
    } catch (error) {
      handleError(error, "MMKVAdapter.constructor", { userMessage: "MMKV initialization failed." });
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const value = this.mmkv.getString(key);
      return value || null;
    } catch (error) {
      handleError(error, "MMKVAdapter.getItem", { userMessage: "Failed to get item from MMKV." });
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      this.mmkv.set(key, value);
    } catch (error) {
      handleError(error, "MMKVAdapter.setItem", { userMessage: "Failed to set item in MMKV." });
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      this.mmkv.delete(key);
    } catch (error) {
      handleError(error, "MMKVAdapter.removeItem", { userMessage: "Failed to remove item from MMKV." });
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      this.mmkv.clearAll();
    } catch (error) {
      handleError(error, "MMKVAdapter.clear", { userMessage: "Failed to clear MMKV storage." });
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return this.mmkv.getAllKeys();
    } catch (error) {
      handleError(error, "MMKVAdapter.getAllKeys", { userMessage: "Failed to get all keys from MMKV." });
      return [];
    }
  }
}
