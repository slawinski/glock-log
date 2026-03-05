import { handleError } from "./error-handler";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { StorageFactory } from "./storage-factory";

const IMAGE_PATHS_KEY = "image_paths";

/**
 * Set the iCloud No Backup flag for a file or directory on iOS.
 * This prevents sensitive data from being uploaded to unencrypted cloud backups.
 */
export const setNoBackupFlag = async (uri: string): Promise<void> => {
  if (Platform.OS === "ios") {
    try {
      // Check if setInfoAsync exists in this version of expo-file-system
      if (typeof (FileSystem as any).setInfoAsync === 'function') {
        await (FileSystem as any).setInfoAsync(uri, { iCloudNoBackup: true });
      } else {
        // Log once that it's unavailable, but don't fail
        // In newer Expo versions, documentDirectory might be backed up by default
        // while cacheDirectory is not.
      }
    } catch (error) {
      console.warn(`Failed to set no-backup flag for ${uri}:`, error);
    }
  }
};

/**
 * Initialize image storage by creating the directory and setting the no-backup flag.
 */
export const initializeImageStorage = async (): Promise<void> => {
  try {
    const imagesDir = `${FileSystem.documentDirectory}images/`;
    const dirInfo = await FileSystem.getInfoAsync(imagesDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true });
    }
    // Always set/re-set the flag to be safe
    await setNoBackupFlag(imagesDir);
  } catch (error) {
    console.error("Failed to initialize image storage:", error);
  }
};

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
    const imagesDir = `${FileSystem.documentDirectory}images/`;
    
    // If the URI is already in our images directory, don't re-save it
    if (uri.startsWith(imagesDir)) {
      return uri;
    }

    const timestamp = Date.now();
    const randomSuffix = typeof crypto !== 'undefined' && crypto.getRandomValues
      ? Array.from(crypto.getRandomValues(new Uint8Array(3)))
          .map(b => b.toString(36))
          .join('')
      : Math.random().toString(36).slice(2, 5);
    const fileName = `${entityType}_${entityId}_${timestamp}_${randomSuffix}.jpg`;
    const filePath = `${imagesDir}${fileName}`;

    // Ensure images directory exists and is excluded from backup
    await initializeImageStorage();

    // Copy image to file system
    await FileSystem.copyAsync({
      from: uri,
      to: filePath,
    });

    // Mark specific image as no-backup as well
    await setNoBackupFlag(filePath);

    return filePath;
  } catch (error) {
    handleError(error, "ImageStorage.saveImageToFileSystem", { userMessage: "Failed to save image." });
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
    handleError(error, "ImageStorage.storeImagePaths", { userMessage: "Failed to store image paths." });
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
    handleError(error, "ImageStorage.getImagePaths", { userMessage: "Failed to get image paths." });
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
    handleError(error, "ImageStorage.deleteImages", { userMessage: "Failed to delete images." });
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
          // Image cleanup - keep logging for maintenance purposes
        } catch (error) {
          console.warn(`Failed to delete orphaned image: ${filePath}`, error);
        }
      }
    }
  } catch (error) {
    handleError(error, "ImageStorage.cleanupOrphanedImages", { userMessage: "Failed to clean up orphaned images." });
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
    handleError(error, "ImageStorage.getImageStorageSize", { userMessage: "Failed to calculate image storage size." });
    return 0;
  }
};
