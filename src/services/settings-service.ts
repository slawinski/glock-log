import * as FileSystem from "expo-file-system";
import { StorageFactory } from "./storage-factory";
import { handleError } from "./error-handler";
import { setNoBackupFlag } from "./image-storage";
import { STORAGE_KEYS } from "./storage-helpers";
import { SettingsData } from "./storage-service-interface";

const getSettings = async (): Promise<SettingsData> => {
  try {
    const storage = StorageFactory.getStorage();
    const settingsData = await storage.getItem(STORAGE_KEYS.SETTINGS);
    if (!settingsData) {
      return { currency: "USD", biometricLockEnabled: true, crtEffectEnabled: true }; // Defaults
    }
    const settings = JSON.parse(settingsData);
    return {
      currency: settings.currency || "USD",
      // Backward compatible default: lock is enabled unless explicitly disabled.
      biometricLockEnabled: settings.biometricLockEnabled !== false,
      // Backward compatible default: CRT effect is enabled unless explicitly disabled.
      crtEffectEnabled: settings.crtEffectEnabled !== false,
    };
  } catch (error) {
    handleError(error, "Storage.getSettings", { userMessage: "Failed to get settings." });
    return { currency: "USD", biometricLockEnabled: true, crtEffectEnabled: true };
  }
};

const setCurrency = async (currency: string): Promise<void> => {
  try {
    const currentSettings = await getSettings();
    const updatedSettings = { ...currentSettings, currency };
    const storage = StorageFactory.getStorage();
    await storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
  } catch (error) {
    handleError(error, "Storage.setCurrency", { userMessage: "Failed to set currency." });
    throw error;
  }
};

const setBiometricLockEnabled = async (enabled: boolean): Promise<void> => {
  try {
    const currentSettings = await getSettings();
    const updatedSettings = { ...currentSettings, biometricLockEnabled: enabled };
    const storage = StorageFactory.getStorage();
    await storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
  } catch (error) {
    handleError(error, "Storage.setBiometricLockEnabled", { userMessage: "Failed to update biometric lock setting." });
    throw error;
  }
};

const setCrtEffectEnabled = async (enabled: boolean): Promise<void> => {
  try {
    const currentSettings = await getSettings();
    const updatedSettings = { ...currentSettings, crtEffectEnabled: enabled };
    const storage = StorageFactory.getStorage();
    await storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
  } catch (error) {
    handleError(error, "Storage.setCrtEffectEnabled", { userMessage: "Failed to update CRT effect setting." });
    throw error;
  }
};

const getCurrency = async (): Promise<string> => {
  try {
    const settings = await getSettings();
    return settings.currency;
  } catch (error) {
    handleError(error, "Storage.getCurrency", { userMessage: "Failed to get currency." });
    return "USD";
  }
};

const clearAllData = async (): Promise<void> => {
  try {
    const storageInstance = StorageFactory.getStorage();
    const allKeys = await storageInstance.getAllKeys();

    // Clear everything except settings
    const keysToClear = allKeys.filter(key => 
      (key.startsWith("@storage:") && key !== STORAGE_KEYS.SETTINGS) || 
      key.startsWith("image_paths")
    );

    for (const key of keysToClear) {
      await storageInstance.removeItem(key);
    }

    // Also delete all image files for a clean start
    const imagesDir = `${FileSystem.documentDirectory}images/`;
    const dirInfo = await FileSystem.getInfoAsync(imagesDir);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(imagesDir, { idempotent: true });
    }

    // Re-create directory and set no-backup flag
    await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true });
    await setNoBackupFlag(imagesDir);

  } catch (error) {
    handleError(error, "Storage.clearAllData", { userMessage: "Failed to clear existing data." });
    throw error;
  }
};

export const settingsService = {
  getSettings,
  setCurrency,
  setBiometricLockEnabled,
  setCrtEffectEnabled,
  getCurrency,
  clearAllData,
};
