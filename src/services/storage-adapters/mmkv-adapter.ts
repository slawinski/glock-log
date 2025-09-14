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
      console.error("MMKV initialization failed:", error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const value = this.mmkv.getString(key);
      return value || null;
    } catch (error) {
      console.error("MMKV getItem error:", error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      this.mmkv.set(key, value);
    } catch (error) {
      console.error("MMKV setItem error:", error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      this.mmkv.delete(key);
    } catch (error) {
      console.error("MMKV removeItem error:", error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      this.mmkv.clearAll();
    } catch (error) {
      console.error("MMKV clear error:", error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return this.mmkv.getAllKeys();
    } catch (error) {
      console.error("MMKV getAllKeys error:", error);
      return [];
    }
  }
}
