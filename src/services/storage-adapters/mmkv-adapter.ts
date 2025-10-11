import { logAndReportError } from "../error-handler";
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
      logAndReportError(error, "MMKVAdapter.constructor", "MMKV initialization failed.");
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const value = this.mmkv.getString(key);
      return value || null;
    } catch (error) {
      logAndReportError(error, "MMKVAdapter.getItem", "Failed to get item from MMKV.");
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      this.mmkv.set(key, value);
    } catch (error) {
      logAndReportError(error, "MMKVAdapter.setItem", "Failed to set item in MMKV.");
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      this.mmkv.delete(key);
    } catch (error) {
      logAndReportError(error, "MMKVAdapter.removeItem", "Failed to remove item from MMKV.");
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      this.mmkv.clearAll();
    } catch (error) {
      logAndReportError(error, "MMKVAdapter.clear", "Failed to clear MMKV storage.");
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return this.mmkv.getAllKeys();
    } catch (error) {
      logAndReportError(error, "MMKVAdapter.getAllKeys", "Failed to get all keys from MMKV.");
      return [];
    }
  }
}
