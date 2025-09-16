import { STORAGE_CONFIG, getStorageConfig } from "./storage-config";
import { StorageConfig } from "./storage-interface";

describe("storage-config", () => {
  describe("STORAGE_CONFIG", () => {
    it("has correct configuration structure", () => {
      expect(STORAGE_CONFIG).toBeDefined();
      expect(typeof STORAGE_CONFIG).toBe("object");
    });

    it("contains required properties", () => {
      expect(STORAGE_CONFIG).toHaveProperty("type");
      expect(STORAGE_CONFIG).toHaveProperty("id");
      expect(STORAGE_CONFIG).toHaveProperty("encryptionKey");
    });

    it("has correct default values", () => {
      expect(STORAGE_CONFIG.type).toBe("mmkv");
      expect(STORAGE_CONFIG.id).toBe("storage");
      expect(typeof STORAGE_CONFIG.encryptionKey).toBe("string");
      expect(STORAGE_CONFIG.encryptionKey).toBe("your-encryption-key-here");
    });

    it("conforms to StorageConfig interface", () => {
      // This test verifies type compatibility at runtime
      const config: StorageConfig = STORAGE_CONFIG;
      expect(config.type).toBe("mmkv");
      expect(config.id).toBe("storage");
      expect(config.encryptionKey).toBeDefined();
    });
  });

  describe("getStorageConfig", () => {
    it("returns the storage configuration", () => {
      const config = getStorageConfig();
      
      expect(config).toBeDefined();
      expect(config).toBe(STORAGE_CONFIG);
    });

    it("returns consistent configuration on multiple calls", () => {
      const config1 = getStorageConfig();
      const config2 = getStorageConfig();
      
      expect(config1).toEqual(config2);
      expect(config1).toBe(config2); // Should be the same reference
    });

    it("returns configuration with all required properties", () => {
      const config = getStorageConfig();
      
      expect(config.type).toBe("mmkv");
      expect(config.id).toBe("storage");
      expect(config.encryptionKey).toBeDefined();
      expect(typeof config.encryptionKey).toBe("string");
    });

    it("returns immutable configuration reference", () => {
      const config1 = getStorageConfig();
      const config2 = getStorageConfig();
      
      // Both calls should return the same object reference
      expect(config1).toBe(config2);
      expect(config1 === config2).toBe(true);
    });

    it("configuration properties are accessible", () => {
      const config = getStorageConfig();
      
      // Test that all properties can be accessed without errors
      expect(() => {
        const type = config.type;
        const id = config.id;
        const key = config.encryptionKey;
      }).not.toThrow();
    });

    it("configuration values are correct types", () => {
      const config = getStorageConfig();
      
      expect(typeof config.type).toBe("string");
      expect(typeof config.id).toBe("string");
      expect(typeof config.encryptionKey).toBe("string");
    });

    it("configuration is not null or undefined", () => {
      const config = getStorageConfig();
      
      expect(config).not.toBeNull();
      expect(config).not.toBeUndefined();
      expect(config.type).not.toBeNull();
      expect(config.type).not.toBeUndefined();
      expect(config.id).not.toBeNull();
      expect(config.id).not.toBeUndefined();
    });

    it("encryption key is a non-empty string", () => {
      const config = getStorageConfig();
      
      expect(config.encryptionKey).toBeDefined();
      if (config.encryptionKey) {
        expect(typeof config.encryptionKey).toBe("string");
        expect(config.encryptionKey.length).toBeGreaterThan(0);
      }
    });

    it("configuration matches expected schema", () => {
      const config = getStorageConfig();
      
      // Validate the structure matches what we expect
      const expectedProperties = ["type", "id", "encryptionKey"];
      const actualProperties = Object.keys(config);
      
      expectedProperties.forEach(prop => {
        expect(actualProperties).toContain(prop);
      });
    });

    it("handles multiple concurrent calls", () => {
      // Test that the function is thread-safe (as much as we can in JS)
      const configs = Array.from({ length: 10 }, () => getStorageConfig());
      
      // All should be the same reference
      configs.forEach(config => {
        expect(config).toBe(STORAGE_CONFIG);
        expect(config.type).toBe("mmkv");
      });
    });
  });

  describe("configuration security", () => {
    it("encryption key is present for security", () => {
      const config = getStorageConfig();
      
      expect(config.encryptionKey).toBeDefined();
      expect(config.encryptionKey).not.toBe("");
      expect(typeof config.encryptionKey).toBe("string");
    });

    it("uses secure storage type", () => {
      const config = getStorageConfig();
      
      // MMKV is considered a secure storage option
      expect(config.type).toBe("mmkv");
    });

    it("has reasonable storage id", () => {
      const config = getStorageConfig();
      
      expect(config.id).toBeDefined();
      if (config.id) {
        expect(config.id).not.toBe("");
        expect(typeof config.id).toBe("string");
        expect(config.id.length).toBeGreaterThan(0);
      }
    });
  });

  describe("configuration consistency", () => {
    it("STORAGE_CONFIG and getStorageConfig return same values", () => {
      const directConfig = STORAGE_CONFIG;
      const functionConfig = getStorageConfig();
      
      expect(functionConfig.type).toBe(directConfig.type);
      expect(functionConfig.id).toBe(directConfig.id);
      expect(functionConfig.encryptionKey).toBe(directConfig.encryptionKey);
    });

    it("configuration is read-only in practice", () => {
      const config1 = getStorageConfig();
      const config2 = getStorageConfig();
      
      // Attempting to modify shouldn't affect other references
      // (Note: This doesn't make the object truly immutable, just tests consistency)
      expect(config1).toBe(config2);
    });
  });
});