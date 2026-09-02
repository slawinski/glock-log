import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { StorageConfig } from "./storage-interface";

const ENCRYPTION_KEY_STORAGE_KEY = "triggernote_encryption_key";

/**
 * Converts a byte array into a lowercase hex string.
 */
const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

/**
 * Generates a random 32-character hex key (128-bit) for encryption using a
 * cryptographically secure random number generator (expo-crypto).
 */
const generateSecureKey = (): string => {
  const bytes = Crypto.getRandomBytes(16);
  return bytesToHex(bytes);
};

/**
 * Retrieves the encryption key from SecureStore, or generates a new one if it doesn't exist.
 */
export const getSecureEncryptionKey = async (): Promise<string> => {
  try {
    let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORAGE_KEY);
    
    if (!key) {
      key = generateSecureKey();
      await SecureStore.setItemAsync(ENCRYPTION_KEY_STORAGE_KEY, key);
    }
    
    return key;
  } catch (error) {
    console.error("Failed to retrieve or generate encryption key from SecureStore:", error);
    // Fallback is dangerous, but we need the app to initialize. 
    // However, for critical security, we should probably throw and let StorageInit handle it.
    throw new Error("Secure encryption key access failed.");
  }
};

/**
 * Get storage configuration with dynamically retrieved encryption key
 */
export const getSecureStorageConfig = async (): Promise<StorageConfig> => {
  const encryptionKey = await getSecureEncryptionKey();
  
  return {
    type: "mmkv",
    id: "storage",
    encryptionKey,
  };
};

// Kept for backward compatibility if needed during migration, but should be avoided
export const STORAGE_CONFIG: StorageConfig = {
  type: "mmkv",
  id: "storage",
};

// Deprecated: use getSecureStorageConfig instead
export const getStorageConfig = (): StorageConfig => {
  return STORAGE_CONFIG;
};
