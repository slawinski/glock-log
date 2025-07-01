import * as FileSystem from "expo-file-system";
import { StorageFactory } from "./storage-factory";

const IMAGE_PATHS_KEY = "image_paths";

/**
 * Save image to file system and return the file path
 * @param uri - The image URI to save
 * @param entityType - The type of entity (firearm, ammunition, range-visit)
 * @param entityId - The ID of the entity
 * @returns Promise<string> - The saved file path
 */
export const saveImageToFileSystem = async (
  uri: string,
  entityType: string,
  entityId: string
): Promise<string> => {
  try {
    const fileName = `${entityType}_${entityId}_${Date.now()}.jpg`;
    const filePath = `${FileSystem.documentDirectory}images/${fileName}`;

    // Ensure images directory exists
    const imagesDir = `${FileSystem.documentDirectory}images/`;
    const dirInfo = await FileSystem.getInfoAsync(imagesDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true });
    }

    // Copy image to file system
    await FileSystem.copyAsync({
      from: uri,
      to: filePath,
    });

    return filePath;
  } catch (error) {
    console.error("Error saving image to file system:", error);
    throw error;
  }
};

/**
 * Store image paths for an entity
 * @param entityType - The type of entity
 * @param entityId - The ID of the entity
 * @param imagePaths - Array of image paths
 */
export const storeImagePaths = async (
  entityType: string,
  entityId: string,
  imagePaths: string[]
): Promise<void> => {
  try {
    const storage = StorageFactory.getStorage();
    const key = `${IMAGE_PATHS_KEY}_${entityType}_${entityId}`;
    await storage.setItem(key, JSON.stringify(imagePaths));
  } catch (error) {
    console.error("Error storing image paths:", error);
    throw error;
  }
};

/**
 * Get image paths for an entity
 * @param entityType - The type of entity
 * @param entityId - The ID of the entity
 * @returns Promise<string[]> - Array of image paths
 */
export const getImagePaths = async (
  entityType: string,
  entityId: string
): Promise<string[]> => {
  try {
    const storage = StorageFactory.getStorage();
    const key = `${IMAGE_PATHS_KEY}_${entityType}_${entityId}`;
    const data = await storage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting image paths:", error);
    return [];
  }
};

/**
 * Delete images for an entity
 * @param entityType - The type of entity
 * @param entityId - The ID of the entity
 */
export const deleteImages = async (
  entityType: string,
  entityId: string
): Promise<void> => {
  try {
    const imagePaths = await getImagePaths(entityType, entityId);

    // Delete image files
    for (const imagePath of imagePaths) {
      try {
        await FileSystem.deleteAsync(imagePath);
      } catch (error) {
        console.warn(`Failed to delete image: ${imagePath}`, error);
      }
    }

    // Remove image paths from storage
    const storage = StorageFactory.getStorage();
    const key = `${IMAGE_PATHS_KEY}_${entityType}_${entityId}`;
    await storage.removeItem(key);
  } catch (error) {
    console.error("Error deleting images:", error);
    throw error;
  }
};

/**
 * Clean up orphaned images
 * This function removes image files that are no longer referenced in storage
 */
export const cleanupOrphanedImages = async (): Promise<void> => {
  try {
    const storage = StorageFactory.getStorage();
    const allKeys = await storage.getAllKeys();
    const imagePathKeys = allKeys.filter((key) =>
      key.startsWith(IMAGE_PATHS_KEY)
    );

    // Get all referenced image paths
    const referencedPaths = new Set<string>();
    for (const key of imagePathKeys) {
      const data = await storage.getItem(key);
      if (data) {
        const paths = JSON.parse(data);
        paths.forEach((path: string) => referencedPaths.add(path));
      }
    }

    // Get all image files in the images directory
    const imagesDir = `${FileSystem.documentDirectory}images/`;
    const dirInfo = await FileSystem.getInfoAsync(imagesDir);
    if (!dirInfo.exists) return;

    const files = await FileSystem.readDirectoryAsync(imagesDir);

    // Delete orphaned files
    for (const file of files) {
      const filePath = `${imagesDir}${file}`;
      if (!referencedPaths.has(filePath)) {
        try {
          await FileSystem.deleteAsync(filePath);
          console.log(`Deleted orphaned image: ${filePath}`);
        } catch (error) {
          console.warn(`Failed to delete orphaned image: ${filePath}`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error cleaning up orphaned images:", error);
  }
};

/**
 * Get total storage size used by images
 * @returns Promise<number> - Total size in bytes
 */
export const getImageStorageSize = async (): Promise<number> => {
  try {
    const imagesDir = `${FileSystem.documentDirectory}images/`;
    const dirInfo = await FileSystem.getInfoAsync(imagesDir);
    if (!dirInfo.exists) return 0;

    const files = await FileSystem.readDirectoryAsync(imagesDir);
    let totalSize = 0;

    for (const file of files) {
      const filePath = `${imagesDir}${file}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists && fileInfo.size) {
        totalSize += fileInfo.size;
      }
    }

    return totalSize;
  } catch (error) {
    console.error("Error calculating image storage size:", error);
    return 0;
  }
};
