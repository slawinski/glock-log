import { STORAGE_CONFIG, getStorageConfig, getSecureStorageConfig, getSecureEncryptionKey } from "./storage-config";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

// Mock SecureStore
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

// Mock expo-crypto so key generation is deterministic in tests
jest.mock("expo-crypto", () => ({
  getRandomBytes: jest.fn(),
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
      expect(Crypto.getRandomBytes).not.toHaveBeenCalled();
    });

    it("generates and stores a new key if none exists", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      const mockBytes = new Uint8Array([
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
        0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
      ]);
      (Crypto.getRandomBytes as jest.Mock).mockReturnValue(mockBytes);
      
      const key = await getSecureEncryptionKey();
      
      expect(key).toBeDefined();
      expect(key.length).toBe(32);
      expect(key).toBe("000102030405060708090a0b0c0d0e0f");
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith("triggernote_encryption_key", key);
    });

    it("generates the key from 16 CSPRNG bytes as lowercase hex", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      const mockBytes = new Uint8Array([
        0xde, 0xad, 0xbe, 0xef, 0xca, 0xfe, 0xba, 0xbe,
        0x10, 0x32, 0x54, 0x76, 0x98, 0xba, 0xdc, 0xfe,
      ]);
      (Crypto.getRandomBytes as jest.Mock).mockReturnValue(mockBytes);
      
      const key = await getSecureEncryptionKey();
      
      expect(Crypto.getRandomBytes).toHaveBeenCalledWith(16);
      expect(key).toMatch(/^[0-9a-f]{32}$/);
      expect(key).toBe("deadbeefcafebabe1032547698badcfe");
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
