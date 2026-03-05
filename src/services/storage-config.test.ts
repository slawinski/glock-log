import { STORAGE_CONFIG, getStorageConfig, getSecureStorageConfig, getSecureEncryptionKey } from "./storage-config";
import * as SecureStore from "expo-secure-store";

// Mock SecureStore
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

describe("storage-config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getSecureEncryptionKey", () => {
    it("retrieves existing key from SecureStore", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("existing-key");
      
      const key = await getSecureEncryptionKey();
      
      expect(key).toBe("existing-key");
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith("triggernote_encryption_key");
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it("generates and stores a new key if none exists", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      
      const key = await getSecureEncryptionKey();
      
      expect(key).toBeDefined();
      expect(key.length).toBe(32);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith("triggernote_encryption_key", key);
    });

    it("throws error if SecureStore fails", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error("SecureStore error"));
      
      await expect(getSecureEncryptionKey()).rejects.toThrow("Secure encryption key access failed.");
    });
  });

  describe("getSecureStorageConfig", () => {
    it("returns a complete StorageConfig object", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("test-key");
      
      const config = await getSecureStorageConfig();
      
      expect(config).toEqual({
        type: "mmkv",
        id: "storage",
        encryptionKey: "test-key",
      });
    });
  });

  describe("STORAGE_CONFIG (deprecated)", () => {
    it("has basic properties but no hardcoded encryption key", () => {
      expect(STORAGE_CONFIG.type).toBe("mmkv");
      expect(STORAGE_CONFIG.id).toBe("storage");
      expect(STORAGE_CONFIG.encryptionKey).toBeUndefined();
    });
  });

  describe("getStorageConfig (deprecated)", () => {
    it("returns the deprecated STORAGE_CONFIG", () => {
      const config = getStorageConfig();
      expect(config).toBe(STORAGE_CONFIG);
    });
  });
});
