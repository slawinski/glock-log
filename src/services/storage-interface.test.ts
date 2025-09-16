import { StorageInterface, StorageConfig } from "./storage-interface";

describe("storage-interface types", () => {
  describe("StorageInterface", () => {
    it("should define all required methods", () => {
      // This is more of a compilation test, but we can verify the interface structure
      const mockStorage: StorageInterface = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        getAllKeys: jest.fn(),
      };

      expect(typeof mockStorage.getItem).toBe("function");
      expect(typeof mockStorage.setItem).toBe("function");
      expect(typeof mockStorage.removeItem).toBe("function");
      expect(typeof mockStorage.clear).toBe("function");
      expect(typeof mockStorage.getAllKeys).toBe("function");
    });

    it("getItem should return Promise<string | null>", async () => {
      const mockStorage: StorageInterface = {
        getItem: jest.fn().mockResolvedValue("test-value"),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        getAllKeys: jest.fn(),
      };

      const result = await mockStorage.getItem("test-key");
      expect(typeof result).toBe("string");
      expect(result).toBe("test-value");
    });

    it("getItem should handle null return", async () => {
      const mockStorage: StorageInterface = {
        getItem: jest.fn().mockResolvedValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        getAllKeys: jest.fn(),
      };

      const result = await mockStorage.getItem("non-existent");
      expect(result).toBeNull();
    });

    it("setItem should return Promise<void>", async () => {
      const mockSetItem = jest.fn().mockResolvedValue(undefined);
      const mockStorage: StorageInterface = {
        getItem: jest.fn(),
        setItem: mockSetItem,
        removeItem: jest.fn(),
        clear: jest.fn(),
        getAllKeys: jest.fn(),
      };

      const result = await mockStorage.setItem("test-key", "test-value");
      expect(result).toBeUndefined();
      expect(mockSetItem).toHaveBeenCalledWith("test-key", "test-value");
    });

    it("removeItem should return Promise<void>", async () => {
      const mockRemoveItem = jest.fn().mockResolvedValue(undefined);
      const mockStorage: StorageInterface = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: mockRemoveItem,
        clear: jest.fn(),
        getAllKeys: jest.fn(),
      };

      const result = await mockStorage.removeItem("test-key");
      expect(result).toBeUndefined();
      expect(mockRemoveItem).toHaveBeenCalledWith("test-key");
    });

    it("clear should return Promise<void>", async () => {
      const mockClear = jest.fn().mockResolvedValue(undefined);
      const mockStorage: StorageInterface = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: mockClear,
        getAllKeys: jest.fn(),
      };

      const result = await mockStorage.clear();
      expect(result).toBeUndefined();
      expect(mockClear).toHaveBeenCalled();
    });

    it("getAllKeys should return Promise<string[]>", async () => {
      const mockKeys = ["key1", "key2", "key3"];
      const mockStorage: StorageInterface = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        getAllKeys: jest.fn().mockResolvedValue(mockKeys),
      };

      const result = await mockStorage.getAllKeys();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(mockKeys);
      expect(result.every(key => typeof key === "string")).toBe(true);
    });

    it("getAllKeys should handle empty array", async () => {
      const mockStorage: StorageInterface = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        getAllKeys: jest.fn().mockResolvedValue([]),
      };

      const result = await mockStorage.getAllKeys();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe("StorageConfig", () => {
    it("should allow valid mmkv configuration", () => {
      const config: StorageConfig = {
        type: "mmkv",
      };

      expect(config.type).toBe("mmkv");
      expect(config.encryptionKey).toBeUndefined();
      expect(config.id).toBeUndefined();
    });

    it("should allow mmkv configuration with encryption key", () => {
      const config: StorageConfig = {
        type: "mmkv",
        encryptionKey: "my-secret-key",
      };

      expect(config.type).toBe("mmkv");
      expect(config.encryptionKey).toBe("my-secret-key");
      expect(config.id).toBeUndefined();
    });

    it("should allow mmkv configuration with id", () => {
      const config: StorageConfig = {
        type: "mmkv",
        id: "my-storage-id",
      };

      expect(config.type).toBe("mmkv");
      expect(config.encryptionKey).toBeUndefined();
      expect(config.id).toBe("my-storage-id");
    });

    it("should allow full mmkv configuration", () => {
      const config: StorageConfig = {
        type: "mmkv",
        encryptionKey: "my-secret-key",
        id: "my-storage-id",
      };

      expect(config.type).toBe("mmkv");
      expect(config.encryptionKey).toBe("my-secret-key");
      expect(config.id).toBe("my-storage-id");
    });

    it("should validate type is mmkv only", () => {
      // This test ensures the type union is restrictive
      const validConfig: StorageConfig = {
        type: "mmkv",
      };

      expect(validConfig.type).toBe("mmkv");

      // TypeScript should prevent invalid types at compile time
      // The following would cause a compilation error:
      // const invalidConfig: StorageConfig = { type: "invalid" };
    });

    it("should handle optional properties correctly", () => {
      const minimalConfig: StorageConfig = {
        type: "mmkv",
      };

      const fullConfig: StorageConfig = {
        type: "mmkv",
        encryptionKey: "key",
        id: "storage-id",
      };

      expect(minimalConfig.type).toBe("mmkv");
      expect(minimalConfig.encryptionKey).toBeUndefined();
      expect(minimalConfig.id).toBeUndefined();

      expect(fullConfig.type).toBe("mmkv");
      expect(fullConfig.encryptionKey).toBe("key");
      expect(fullConfig.id).toBe("storage-id");
    });

    it("should allow empty strings for optional properties", () => {
      const config: StorageConfig = {
        type: "mmkv",
        encryptionKey: "",
        id: "",
      };

      expect(config.encryptionKey).toBe("");
      expect(config.id).toBe("");
    });

    it("should support different encryption key formats", () => {
      const configs: StorageConfig[] = [
        { type: "mmkv", encryptionKey: "simple-key" },
        { type: "mmkv", encryptionKey: "key-with-special-chars!@#$" },
        { type: "mmkv", encryptionKey: "123456789" },
        { type: "mmkv", encryptionKey: "very-long-encryption-key-that-might-be-used-for-security" },
      ];

      configs.forEach((config, index) => {
        expect(config.type).toBe("mmkv");
        expect(typeof config.encryptionKey).toBe("string");
        expect(config.encryptionKey!.length).toBeGreaterThan(0);
      });
    });

    it("should support different id formats", () => {
      const configs: StorageConfig[] = [
        { type: "mmkv", id: "simple" },
        { type: "mmkv", id: "storage-with-dashes" },
        { type: "mmkv", id: "storage_with_underscores" },
        { type: "mmkv", id: "storageWithCamelCase" },
        { type: "mmkv", id: "123numeric" },
      ];

      configs.forEach((config) => {
        expect(config.type).toBe("mmkv");
        expect(typeof config.id).toBe("string");
        expect(config.id!.length).toBeGreaterThan(0);
      });
    });
  });

  describe("interface compatibility", () => {
    it("should allow implementing StorageInterface", () => {
      class TestStorage implements StorageInterface {
        async getItem(key: string): Promise<string | null> {
          return key === "exists" ? "value" : null;
        }

        async setItem(key: string, value: string): Promise<void> {
          // Implementation would go here
        }

        async removeItem(key: string): Promise<void> {
          // Implementation would go here
        }

        async clear(): Promise<void> {
          // Implementation would go here
        }

        async getAllKeys(): Promise<string[]> {
          return ["key1", "key2"];
        }
      }

      const storage = new TestStorage();
      expect(storage).toBeInstanceOf(TestStorage);
      expect(typeof storage.getItem).toBe("function");
      expect(typeof storage.setItem).toBe("function");
      expect(typeof storage.removeItem).toBe("function");
      expect(typeof storage.clear).toBe("function");
      expect(typeof storage.getAllKeys).toBe("function");
    });

    it("should work with async/await patterns", async () => {
      const mockStorage: StorageInterface = {
        getItem: jest.fn().mockResolvedValue("test"),
        setItem: jest.fn().mockResolvedValue(undefined),
        removeItem: jest.fn().mockResolvedValue(undefined),
        clear: jest.fn().mockResolvedValue(undefined),
        getAllKeys: jest.fn().mockResolvedValue(["test"]),
      };

      await expect(mockStorage.getItem("key")).resolves.toBe("test");
      await expect(mockStorage.setItem("key", "value")).resolves.toBeUndefined();
      await expect(mockStorage.removeItem("key")).resolves.toBeUndefined();
      await expect(mockStorage.clear()).resolves.toBeUndefined();
      await expect(mockStorage.getAllKeys()).resolves.toEqual(["test"]);
    });
  });
});