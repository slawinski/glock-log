import * as FileSystem from "expo-file-system";
import { MMKV } from "react-native-mmkv";

// Create MMKV instance for storing image paths with error handling
let imageStorage: MMKV | null = null;

try {
  imageStorage = new MMKV({
    id: "glock-log-images",
  });
} catch (error) {
  console.warn("MMKV initialization failed for image storage:", error);
  // Fallback to using AsyncStorage or other storage method
}

// Constants
const IMAGE_DIRECTORY = `${FileSystem.documentDirectory}images/`;

// Ensure image directory exists
const ensureImageDirectory = async (): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIRECTORY);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_DIRECTORY, {
      intermediates: true,
    });
  }
};

// Generate unique filename for image
const generateImageFilename = (
  entityType: string,
  entityId: string,
  index: number
): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${entityType}-${entityId}-${index}-${timestamp}-${randomSuffix}.jpg`;
};

// Save image to file system and return the file path
export const saveImageToFileSystem = async (
  imageUri: string,
  entityType: "firearm" | "range-visit" | "ammunition",
  entityId: string,
  imageIndex: number
): Promise<string> => {
  try {
    await ensureImageDirectory();

    const filename = generateImageFilename(entityType, entityId, imageIndex);
    const destinationUri = `${IMAGE_DIRECTORY}${filename}`;

    // Copy image to app's document directory
    await FileSystem.copyAsync({
      from: imageUri,
      to: destinationUri,
    });

    return destinationUri;
  } catch (error) {
    console.error("Error saving image to file system:", error);
    throw new Error("Failed to save image");
  }
};

// Store image paths in MMKV
export const storeImagePaths = (
  entityType: "firearm" | "range-visit" | "ammunition",
  entityId: string,
  imagePaths: string[]
): void => {
  if (!imageStorage) {
    console.warn("Image storage not available, skipping path storage");
    return;
  }

  try {
    const key = `${entityType}-${entityId}`;
    imageStorage.set(key, JSON.stringify(imagePaths));
  } catch (error) {
    console.error("Error storing image paths:", error);
  }
};

// Get image paths from MMKV
export const getImagePaths = (
  entityType: "firearm" | "range-visit" | "ammunition",
  entityId: string
): string[] => {
  if (!imageStorage) {
    console.warn("Image storage not available, returning empty paths");
    return [];
  }

  try {
    const key = `${entityType}-${entityId}`;
    const pathsJson = imageStorage.getString(key);
    return pathsJson ? JSON.parse(pathsJson) : [];
  } catch (error) {
    console.error("Error getting image paths:", error);
    return [];
  }
};

// Delete images from file system
export const deleteImages = async (
  entityType: "firearm" | "range-visit" | "ammunition",
  entityId: string
): Promise<void> => {
  try {
    const imagePaths = getImagePaths(entityType, entityId);

    // Filter out placeholder images and delete only actual files
    const filePathsToDelete = imagePaths.filter(
      (path) => !path.startsWith("placeholder:")
    );

    // Delete each image file
    for (const path of filePathsToDelete) {
      const fileInfo = await FileSystem.getInfoAsync(path);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(path);
      }
    }

    // Remove from MMKV storage
    if (imageStorage) {
      const key = `${entityType}-${entityId}`;
      imageStorage.delete(key);
    }
  } catch (error) {
    console.error("Error deleting images:", error);
    throw new Error("Failed to delete images");
  }
};

// Get image info (size, exists, etc.)
export const getImageInfo = async (imagePath: string) => {
  try {
    return await FileSystem.getInfoAsync(imagePath);
  } catch (error) {
    console.error("Error getting image info:", error);
    return null;
  }
};

// Clean up orphaned images (images that exist in file system but not in MMKV)
export const cleanupOrphanedImages = async (): Promise<void> => {
  try {
    await ensureImageDirectory();

    const allFiles = await FileSystem.readDirectoryAsync(IMAGE_DIRECTORY);

    if (!imageStorage) {
      console.warn("Image storage not available, skipping cleanup");
      return;
    }

    const allKeys = imageStorage.getAllKeys();

    // Get all stored image paths from MMKV
    const storedPaths = new Set<string>();
    for (const key of allKeys) {
      const pathsJson = imageStorage.getString(key);
      if (pathsJson) {
        const paths = JSON.parse(pathsJson);
        paths.forEach((path: string) => storedPaths.add(path));
      }
    }

    // Delete files that don't have corresponding MMKV entries
    for (const file of allFiles) {
      const filePath = `${IMAGE_DIRECTORY}${file}`;
      if (!storedPaths.has(filePath)) {
        await FileSystem.deleteAsync(filePath);
      }
    }
  } catch (error) {
    console.error("Error cleaning up orphaned images:", error);
  }
};

// Get total storage size
export const getImageStorageSize = async (): Promise<number> => {
  try {
    await ensureImageDirectory();

    const allFiles = await FileSystem.readDirectoryAsync(IMAGE_DIRECTORY);
    let totalSize = 0;

    for (const file of allFiles) {
      const filePath = `${IMAGE_DIRECTORY}${file}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists && fileInfo.size) {
        totalSize += fileInfo.size;
      }
    }

    return totalSize;
  } catch (error) {
    console.error("Error calculating storage size:", error);
    return 0;
  }
};
