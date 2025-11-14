import { StorageInterface, StorageConfig } from "./storage-interface";
import { MMKVAdapter } from "./storage-adapters/mmkv-adapter";

export class StorageFactory {
  private static instance: StorageInterface | null = null;
  private static config: StorageConfig = { type: "mmkv" };

  static configure(config: StorageConfig): void {
    this.config = config;
    // Reset instance to force recreation with new config
    this.instance = null;
  }

  static getStorage(): StorageInterface {
    if (!this.config) {
      throw new Error("Storage not configured. Call configure() first.");
    }
    if (!this.instance) {
      if (this.config.type === "mmkv") {
        this.instance = new MMKVAdapter(this.config);
      } else {
        throw new Error(`Unsupported storage type: ${this.config.type}`);
      }
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }
}
