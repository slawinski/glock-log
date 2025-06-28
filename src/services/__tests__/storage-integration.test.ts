import { storage } from "../storage-new";
import { FirearmInput } from "../../validation/inputSchemas";
import { deleteImages } from "../image-storage";
import { StorageFactory } from "../storage-factory";

// Mock the image storage functions
jest.mock("../image-storage", () => ({
  saveImageToFileSystem: jest.fn().mockResolvedValue("/mock/path/to/image.jpg"),
  storeImagePaths: jest.fn(),
  deleteImages: jest.fn().mockResolvedValue(undefined),
  getImagePaths: jest.fn().mockReturnValue([]),
}));

// Mock the storage factory
jest.mock("../storage-factory", () => ({
  StorageFactory: {
    getStorage: jest.fn().mockReturnValue({
      setItem: jest.fn().mockResolvedValue(undefined),
      getItem: jest.fn().mockResolvedValue("[]"),
      removeItem: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
      getAllKeys: jest.fn().mockResolvedValue([]),
    }),
  },
}));

describe("Storage Integration with Images", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should save firearm with images", async () => {
    const firearmInput: FirearmInput = {
      modelName: "Test Glock",
      caliber: "9mm",
      datePurchased: new Date().toISOString(),
      amountPaid: 500,
      photos: ["file://mock/image1.jpg", "file://mock/image2.jpg"],
      notes: "Test firearm",
    };

    await storage.saveFirearm(firearmInput);

    // Verify that the storage was called
    const mockStorage = StorageFactory.getStorage();
    expect(mockStorage.setItem).toHaveBeenCalled();
  });

  it("should get firearms", async () => {
    const firearms = await storage.getFirearms();
    expect(Array.isArray(firearms)).toBe(true);
  });

  it("should delete firearm", async () => {
    await storage.deleteFirearm("test-id");

    // Verify that deleteImages was called
    expect(deleteImages).toHaveBeenCalledWith("firearm", "test-id");
  });
});
