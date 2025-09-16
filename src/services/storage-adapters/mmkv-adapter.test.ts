import { MMKVAdapter } from "./mmkv-adapter";
import { StorageConfig } from "../storage-interface";

// Mock react-native-mmkv
const mockMMKV = {
  getString: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clearAll: jest.fn(),
  getAllKeys: jest.fn(),
};

jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => mockMMKV),
}));

const mockConsoleError = jest.spyOn(console, "error").mockImplementation(() => {});

describe("MMKVAdapter", () => {
  let adapter: MMKVAdapter;
  const mockConfig: StorageConfig = {
    type: "mmkv",
    id: "test-storage",
    encryptionKey: "test-key",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockClear();
    // Reset mock implementations
    mockMMKV.getString.mockReset();
    mockMMKV.set.mockReset();
    mockMMKV.delete.mockReset();
    mockMMKV.clearAll.mockReset();
    mockMMKV.getAllKeys.mockReset();
    
    adapter = new MMKVAdapter(mockConfig);
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe("constructor", () => {
    it("creates MMKV instance with provided config", () => {
      const { MMKV } = require("react-native-mmkv");
      
      new MMKVAdapter(mockConfig);
      
      expect(MMKV).toHaveBeenCalledWith({
        id: "test-storage",
        encryptionKey: "test-key",
      });
    });

    it("uses default id when not provided", () => {
      const { MMKV } = require("react-native-mmkv");
      const configWithoutId: StorageConfig = {
        type: "mmkv",
        encryptionKey: "test-key",
      };
      
      new MMKVAdapter(configWithoutId);
      
      expect(MMKV).toHaveBeenCalledWith({
        id: "storage",
        encryptionKey: "test-key",
      });
    });

    it("handles MMKV initialization errors", () => {
      const { MMKV } = require("react-native-mmkv");
      const initError = new Error("MMKV init failed");
      MMKV.mockImplementationOnce(() => {
        throw initError;
      });

      expect(() => new MMKVAdapter(mockConfig)).toThrow("MMKV init failed");
      expect(mockConsoleError).toHaveBeenCalledWith("MMKV initialization failed:", initError);
    });
  });

  describe("getItem", () => {
    it("returns value when key exists", async () => {
      mockMMKV.getString.mockReturnValue("test-value");

      const result = await adapter.getItem("test-key");

      expect(mockMMKV.getString).toHaveBeenCalledWith("test-key");
      expect(result).toBe("test-value");
    });

    it("returns null when key does not exist", async () => {
      mockMMKV.getString.mockReturnValue(undefined);

      const result = await adapter.getItem("nonexistent-key");

      expect(mockMMKV.getString).toHaveBeenCalledWith("nonexistent-key");
      expect(result).toBeNull();
    });

    it("returns null when MMKV getString returns empty string", async () => {
      mockMMKV.getString.mockReturnValue("");

      const result = await adapter.getItem("empty-key");

      expect(mockMMKV.getString).toHaveBeenCalledWith("empty-key");
      expect(result).toBeNull();
    });

    it("handles MMKV getString errors gracefully", async () => {
      const getError = new Error("MMKV get error");
      mockMMKV.getString.mockImplementation(() => {
        throw getError;
      });

      const result = await adapter.getItem("error-key");

      expect(mockConsoleError).toHaveBeenCalledWith("MMKV getItem error:", getError);
      expect(result).toBeNull();
    });

    it("returns value when MMKV getString returns falsy but non-empty string", async () => {
      mockMMKV.getString.mockReturnValue("0");

      const result = await adapter.getItem("falsy-key");

      expect(result).toBe("0");
    });
  });

  describe("setItem", () => {
    it("sets item successfully", async () => {
      await adapter.setItem("test-key", "test-value");

      expect(mockMMKV.set).toHaveBeenCalledWith("test-key", "test-value");
    });

    it("handles MMKV set errors", async () => {
      const setError = new Error("MMKV set error");
      mockMMKV.set.mockImplementation(() => {
        throw setError;
      });

      await expect(adapter.setItem("error-key", "value")).rejects.toThrow("MMKV set error");
      expect(mockConsoleError).toHaveBeenCalledWith("MMKV setItem error:", setError);
    });

    it("handles empty string values", async () => {
      await adapter.setItem("empty-key", "");

      expect(mockMMKV.set).toHaveBeenCalledWith("empty-key", "");
    });

    it("handles special characters in keys and values", async () => {
      const specialKey = "key-with-special_chars.123";
      const specialValue = '{"json": "value", "special": "chars!@#$%"}';

      await adapter.setItem(specialKey, specialValue);

      expect(mockMMKV.set).toHaveBeenCalledWith(specialKey, specialValue);
    });
  });

  describe("removeItem", () => {
    it("removes item successfully", async () => {
      await adapter.removeItem("test-key");

      expect(mockMMKV.delete).toHaveBeenCalledWith("test-key");
    });

    it("handles MMKV delete errors", async () => {
      const deleteError = new Error("MMKV delete error");
      mockMMKV.delete.mockImplementation(() => {
        throw deleteError;
      });

      await expect(adapter.removeItem("error-key")).rejects.toThrow("MMKV delete error");
      expect(mockConsoleError).toHaveBeenCalledWith("MMKV removeItem error:", deleteError);
    });

    it("handles removal of non-existent keys", async () => {
      // MMKV.delete() typically doesn't throw for non-existent keys
      await adapter.removeItem("nonexistent-key");

      expect(mockMMKV.delete).toHaveBeenCalledWith("nonexistent-key");
    });
  });

  describe("clear", () => {
    it("clears all items successfully", async () => {
      await adapter.clear();

      expect(mockMMKV.clearAll).toHaveBeenCalled();
    });

    it("handles MMKV clearAll errors", async () => {
      const clearError = new Error("MMKV clear error");
      mockMMKV.clearAll.mockImplementation(() => {
        throw clearError;
      });

      await expect(adapter.clear()).rejects.toThrow("MMKV clear error");
      expect(mockConsoleError).toHaveBeenCalledWith("MMKV clear error:", clearError);
    });
  });

  describe("getAllKeys", () => {
    it("returns all keys successfully", async () => {
      const mockKeys = ["key1", "key2", "key3"];
      mockMMKV.getAllKeys.mockReturnValue(mockKeys);

      const result = await adapter.getAllKeys();

      expect(mockMMKV.getAllKeys).toHaveBeenCalled();
      expect(result).toEqual(mockKeys);
    });

    it("returns empty array when no keys exist", async () => {
      mockMMKV.getAllKeys.mockReturnValue([]);

      const result = await adapter.getAllKeys();

      expect(mockMMKV.getAllKeys).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("handles MMKV getAllKeys errors gracefully", async () => {
      const getAllKeysError = new Error("MMKV getAllKeys error");
      mockMMKV.getAllKeys.mockImplementation(() => {
        throw getAllKeysError;
      });

      const result = await adapter.getAllKeys();

      expect(mockConsoleError).toHaveBeenCalledWith("MMKV getAllKeys error:", getAllKeysError);
      expect(result).toEqual([]);
    });

    it("handles complex key names", async () => {
      const complexKeys = [
        "simple",
        "key-with-dashes",
        "key_with_underscores",
        "key.with.dots",
        "keyWithCamelCase",
        "key with spaces",
        "123numeric-key",
        "key!@#$%^&*()",
      ];
      mockMMKV.getAllKeys.mockReturnValue(complexKeys);

      const result = await adapter.getAllKeys();

      expect(result).toEqual(complexKeys);
    });
  });

  describe("integration scenarios", () => {
    it("performs complete set/get/remove cycle", async () => {
      const key = "integration-key";
      const value = "integration-value";

      // Set
      mockMMKV.getString.mockReturnValue(undefined);
      await adapter.setItem(key, value);
      expect(mockMMKV.set).toHaveBeenCalledWith(key, value);

      // Get
      mockMMKV.getString.mockReturnValue(value);
      const retrievedValue = await adapter.getItem(key);
      expect(retrievedValue).toBe(value);

      // Remove
      await adapter.removeItem(key);
      expect(mockMMKV.delete).toHaveBeenCalledWith(key);

      // Verify removal
      mockMMKV.getString.mockReturnValue(undefined);
      const removedValue = await adapter.getItem(key);
      expect(removedValue).toBeNull();
    });

    it("handles multiple operations in sequence", async () => {
      const operations = [
        { key: "key1", value: "value1" },
        { key: "key2", value: "value2" },
        { key: "key3", value: "value3" },
      ];

      // Set all items
      for (const { key, value } of operations) {
        await adapter.setItem(key, value);
        expect(mockMMKV.set).toHaveBeenCalledWith(key, value);
      }

      // Get all keys
      mockMMKV.getAllKeys.mockReturnValue(operations.map(op => op.key));
      const keys = await adapter.getAllKeys();
      expect(keys).toEqual(["key1", "key2", "key3"]);

      // Clear all
      await adapter.clear();
      expect(mockMMKV.clearAll).toHaveBeenCalled();
    });
  });
});