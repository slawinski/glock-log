import { StorageFactory } from "../storage-factory";
import { MMKVAdapter } from "../storage-adapters/mmkv-adapter";
import { AsyncStorageAdapter } from "../storage-adapters/asyncstorage-adapter";
import { StorageConfig } from "../storage-interface";

// Mock MMKV
jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
    getAllKeys: jest.fn(),
  })),
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
}));

describe("Storage Abstraction", () => {
  beforeEach(() => {
    StorageFactory.reset();
    jest.clearAllMocks();
  });

  describe("StorageFactory", () => {
    it("should create MMKV adapter when type is mmkv", () => {
      const config: StorageConfig = { type: "mmkv" };
      StorageFactory.configure(config);
      const storage = StorageFactory.getStorage();

      expect(storage).toBeInstanceOf(MMKVAdapter);
    });

    it("should create AsyncStorage adapter when type is asyncstorage", () => {
      const config: StorageConfig = { type: "asyncstorage" };
      StorageFactory.configure(config);
      const storage = StorageFactory.getStorage();

      expect(storage).toBeInstanceOf(AsyncStorageAdapter);
    });

    it("should throw error for unsupported storage type", () => {
      const config = { type: "unsupported" as any };
      StorageFactory.configure(config);

      expect(() => StorageFactory.getStorage()).toThrow(
        "Unsupported storage type: unsupported"
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
      const config2: StorageConfig = { type: "asyncstorage" };

      StorageFactory.configure(config1);
      const storage1 = StorageFactory.getStorage();

      StorageFactory.configure(config2);
      const storage2 = StorageFactory.getStorage();

      expect(storage1).not.toBe(storage2);
      expect(storage1).toBeInstanceOf(MMKVAdapter);
      expect(storage2).toBeInstanceOf(AsyncStorageAdapter);
    });
  });

  describe("MMKVAdapter", () => {
    let mmkvAdapter: MMKVAdapter;
    let mockMMKV: any;

    beforeEach(() => {
      const { MMKV } = jest.requireMock("react-native-mmkv");
      mockMMKV = {
        getString: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        clearAll: jest.fn(),
        getAllKeys: jest.fn(),
      };
      MMKV.mockImplementation(() => mockMMKV);

      mmkvAdapter = new MMKVAdapter();
    });

    it("should get item successfully", async () => {
      const mockValue = "test-value";
      mockMMKV.getString.mockReturnValue(mockValue);

      const result = await mmkvAdapter.getItem("test-key");

      expect(result).toBe(mockValue);
      expect(mockMMKV.getString).toHaveBeenCalledWith("test-key");
    });

    it("should return null when item not found", async () => {
      mockMMKV.getString.mockReturnValue(undefined);

      const result = await mmkvAdapter.getItem("test-key");

      expect(result).toBeNull();
    });

    it("should set item successfully", async () => {
      await mmkvAdapter.setItem("test-key", "test-value");

      expect(mockMMKV.set).toHaveBeenCalledWith("test-key", "test-value");
    });

    it("should remove item successfully", async () => {
      await mmkvAdapter.removeItem("test-key");

      expect(mockMMKV.delete).toHaveBeenCalledWith("test-key");
    });

    it("should clear all items successfully", async () => {
      await mmkvAdapter.clear();

      expect(mockMMKV.clearAll).toHaveBeenCalled();
    });

    it("should get all keys successfully", async () => {
      const mockKeys = ["key1", "key2"];
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

  describe("AsyncStorageAdapter", () => {
    let asyncStorageAdapter: AsyncStorageAdapter;
    let mockAsyncStorage: any;

    beforeEach(() => {
      mockAsyncStorage = jest.requireMock(
        "@react-native-async-storage/async-storage"
      );
      asyncStorageAdapter = new AsyncStorageAdapter();
    });

    it("should get item successfully", async () => {
      const mockValue = "test-value";
      mockAsyncStorage.getItem.mockResolvedValue(mockValue);

      const result = await asyncStorageAdapter.getItem("test-key");

      expect(result).toBe(mockValue);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith("test-key");
    });

    it("should return null when item not found", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await asyncStorageAdapter.getItem("test-key");

      expect(result).toBeNull();
    });

    it("should set item successfully", async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      await asyncStorageAdapter.setItem("test-key", "test-value");

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        "test-key",
        "test-value"
      );
    });

    it("should remove item successfully", async () => {
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      await asyncStorageAdapter.removeItem("test-key");

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith("test-key");
    });

    it("should clear all items successfully", async () => {
      mockAsyncStorage.clear.mockResolvedValue(undefined);

      await asyncStorageAdapter.clear();

      expect(mockAsyncStorage.clear).toHaveBeenCalled();
    });

    it("should get all keys successfully", async () => {
      const mockKeys = ["key1", "key2"];
      mockAsyncStorage.getAllKeys.mockResolvedValue(mockKeys);

      const result = await asyncStorageAdapter.getAllKeys();

      expect(result).toEqual(mockKeys);
      expect(mockAsyncStorage.getAllKeys).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("AsyncStorage error");
      mockAsyncStorage.setItem.mockRejectedValue(error);

      await expect(
        asyncStorageAdapter.setItem("test-key", "test-value")
      ).rejects.toThrow("AsyncStorage error");
    });
  });
});
