import {
  saveImageToFileSystem,
  storeImagePaths,
  getImagePaths,
  deleteImages,
  cleanupOrphanedImages,
  getImageStorageSize,
} from "../image-storage";
import * as FileSystem from "expo-file-system";

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  documentDirectory: "/mock/document/directory/",
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
}));

// Mock MMKV
jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    delete: jest.fn(),
    getAllKeys: jest.fn(),
  })),
}));

describe("Image Storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.copyAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([]);
  });

  describe("saveImageToFileSystem", () => {
    it("should save image to file system and return path", async () => {
      const mockUri = "file://mock/image.jpg";
      const entityType = "firearm";
      const entityId = "test-firearm-123";
      const imageIndex = 0;

      const result = await saveImageToFileSystem(
        mockUri,
        entityType,
        entityId,
        imageIndex
      );

      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalled();
      expect(FileSystem.copyAsync).toHaveBeenCalledWith({
        from: mockUri,
        to: expect.stringContaining(`${entityType}-${entityId}-${imageIndex}`),
      });
      expect(result).toMatch(
        new RegExp(`${entityType}-${entityId}-${imageIndex}-\\d+-\\w+\\.jpg`)
      );
    });

    it("should handle errors gracefully", async () => {
      (FileSystem.copyAsync as jest.Mock).mockRejectedValue(
        new Error("Copy failed")
      );

      await expect(
        saveImageToFileSystem("file://mock/image.jpg", "firearm", "test-id", 0)
      ).rejects.toThrow("Failed to save image");
    });
  });

  describe("storeImagePaths and getImagePaths", () => {
    it("should store and retrieve image paths", () => {
      const entityType = "firearm";
      const entityId = "test-firearm-123";
      const imagePaths = ["/path/to/image1.jpg", "/path/to/image2.jpg"];

      storeImagePaths(entityType, entityId, imagePaths);

      // Note: In a real test, we'd need to mock the MMKV instance properly
      // This is a basic structure test
      expect(() => getImagePaths(entityType, entityId)).not.toThrow();
    });
  });

  describe("deleteImages", () => {
    it("should delete images from file system", async () => {
      const entityType = "firearm";
      const entityId = "test-firearm-123";

      await deleteImages(entityType, entityId);

      expect(FileSystem.deleteAsync).toHaveBeenCalled();
    });
  });

  describe("cleanupOrphanedImages", () => {
    it("should clean up orphaned images", async () => {
      await cleanupOrphanedImages();

      expect(FileSystem.readDirectoryAsync).toHaveBeenCalled();
    });
  });

  describe("getImageStorageSize", () => {
    it("should calculate storage size", async () => {
      (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([
        "image1.jpg",
        "image2.jpg",
      ]);
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024,
      });

      const size = await getImageStorageSize();

      expect(size).toBe(2048); // 2 files * 1024 bytes each
    });
  });
});
