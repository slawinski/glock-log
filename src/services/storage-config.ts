import { StorageConfig } from "./storage-interface";

// Storage configuration
export const STORAGE_CONFIG: StorageConfig = {
  type: "mmkv", // Change to 'asyncstorage' to fallback to AsyncStorage
  // Optional: Add encryption for sensitive data
  // encryptionKey: 'your-secret-key-here',
  id: "glock-log-storage",
};

// Get storage configuration
export const getStorageConfig = (): StorageConfig => {
  return STORAGE_CONFIG;
};
