import { StorageInterface, StorageConfig } from "./storage-interface";
import { MMKVAdapter } from "./storage-adapters/mmkv-adapter";
import { AsyncStorageAdapter } from "./storage-adapters/asyncstorage-adapter";

export class StorageFactory {
  private static instance: StorageInterface | null = null;
  private static config: StorageConfig = { type: "mmkv" };

  static configure(config: StorageConfig): void {
    this.config = config;
    // Reset instance to force recreation with new config
    this.instance = null;
  }

  static getStorage(): StorageInterface {
    if (!this.instance) {
      switch (this.config.type) {
        case "mmkv":
          this.instance = new MMKVAdapter(this.config);
          break;
        case "asyncstorage":
          this.instance = new AsyncStorageAdapter();
          break;
        default:
          throw new Error(`Unsupported storage type: ${this.config.type}`);
      }
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }
}
