import { StorageConfig } from "./storage-interface";

// Storage configuration
export const STORAGE_CONFIG: StorageConfig = {
  type: "mmkv",
  id: "storage",
  encryptionKey: "your-encryption-key-here", // Optional: Add encryption key for sensitive data
};

// Get storage configuration
export const getStorageConfig = (): StorageConfig => {
  return STORAGE_CONFIG;
};
