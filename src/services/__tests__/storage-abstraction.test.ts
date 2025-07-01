import { StorageFactory } from "../storage-factory";
import { MMKVAdapter } from "../storage-adapters/mmkv-adapter";
import { StorageConfig } from "../storage-interface";

// Mock MMKV
jest.mock("react-native-mmkv", () => {
  const mockMMKV = {
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
    getAllKeys: jest.fn(),
  };

  return {
    MMKV: jest.fn().mockImplementation(() => mockMMKV),
  };
});

describe("Storage Abstraction", () => {
  beforeEach(() => {
    StorageFactory.reset();
  });

  describe("StorageFactory", () => {
    it("should create MMKV adapter when type is mmkv", () => {
      const config: StorageConfig = { type: "mmkv" };
      StorageFactory.configure(config);
      const storage = StorageFactory.getStorage();

      expect(storage).toBeInstanceOf(MMKVAdapter);
    });

    it("should throw error for unsupported storage type", () => {
      const config = { type: "invalid" as any };
      StorageFactory.configure(config);

      expect(() => StorageFactory.getStorage()).toThrow(
        "Unsupported storage type: invalid"
      );
    });

    it("should reuse the same instance for multiple calls", () => {
      const config: StorageConfig = { type: "mmkv" };
      StorageFactory.configure(config);

      const storage1 = StorageFactory.getStorage();
      const storage2 = StorageFactory.getStorage();

      expect(storage1).toBe(storage2);
    });

    it("should create new instance after configuration change", () => {
      const config1: StorageConfig = { type: "mmkv" };
      StorageFactory.configure(config1);
      const storage1 = StorageFactory.getStorage();

      const config2: StorageConfig = { type: "mmkv" };
      StorageFactory.configure(config2);
      const storage2 = StorageFactory.getStorage();

      expect(storage1).not.toBe(storage2);
      expect(storage1).toBeInstanceOf(MMKVAdapter);
      expect(storage2).toBeInstanceOf(MMKVAdapter);
    });
  });

  describe("MMKVAdapter", () => {
    let mmkvAdapter: MMKVAdapter;
    let mockMMKV: any;

    beforeEach(() => {
      const { MMKV } = jest.requireMock("react-native-mmkv");
      mockMMKV = new MMKV();
      mmkvAdapter = new MMKVAdapter({ type: "mmkv" });
    });

    it("should get item successfully", async () => {
      const mockValue = "test-value";
      mockMMKV.getString.mockReturnValue(mockValue);

      const result = await mmkvAdapter.getItem("test-key");

      expect(result).toBe(mockValue);
      expect(mockMMKV.getString).toHaveBeenCalledWith("test-key");
    });

    it("should return null when item not found", async () => {
      mockMMKV.getString.mockReturnValue(null);

      const result = await mmkvAdapter.getItem("test-key");

      expect(result).toBeNull();
    });

    it("should set item successfully", async () => {
      mockMMKV.set.mockReturnValue(undefined);

      await mmkvAdapter.setItem("test-key", "test-value");

      expect(mockMMKV.set).toHaveBeenCalledWith("test-key", "test-value");
    });

    it("should remove item successfully", async () => {
      mockMMKV.delete.mockReturnValue(undefined);

      await mmkvAdapter.removeItem("test-key");

      expect(mockMMKV.delete).toHaveBeenCalledWith("test-key");
    });

    it("should clear all items successfully", async () => {
      mockMMKV.clearAll.mockReturnValue(undefined);

      await mmkvAdapter.clear();

      expect(mockMMKV.clearAll).toHaveBeenCalled();
    });

    it("should get all keys successfully", async () => {
      const mockKeys = ["key1", "key2", "key3"];
      mockMMKV.getAllKeys.mockReturnValue(mockKeys);

      const result = await mmkvAdapter.getAllKeys();

      expect(result).toEqual(mockKeys);
      expect(mockMMKV.getAllKeys).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("MMKV error");
      mockMMKV.set.mockImplementation(() => {
        throw error;
      });

      await expect(
        mmkvAdapter.setItem("test-key", "test-value")
      ).rejects.toThrow("MMKV error");
    });
  });
});
