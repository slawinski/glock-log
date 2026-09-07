import { firearmStorageSchema, FirearmStorage } from "../validation/storageSchemas";
import { FirearmInput } from "../validation/inputSchemas";
import {
  saveImageToFileSystem,
  storeImagePaths,
  deleteImages,
  getImagePaths,
} from "./image-storage";
import { handleStorageError, handleError } from "./error-handler";
import {
  ENTITY_KEYS,
  STORAGE_KEYS,
  firearmKey,
  generateId,
  readEntityCollection,
  validateBeforeSave,
  writeEntity,
  writeEntityAndIndex,
  removeEntityAndIndex,
  CollectionConfig,
} from "./storage-helpers";
import {
  inferLegacyFirearmType,
  isPlaceholderPhoto,
  stripPlaceholderPhotos,
} from "../features/firearm-visuals/legacy";

const firearmConfig: CollectionConfig<FirearmStorage> = {
  entityKey: firearmKey,
  indexKey: ENTITY_KEYS.FIREARMS_INDEX,
  legacyKey: STORAGE_KEYS.FIREARMS,
  schema: firearmStorageSchema,
};

const saveFirearm = async (firearm: FirearmInput): Promise<string> => {
  try {
    const firearms = await getFirearms();
    const isUpdate = !!firearm.id;
    const firearmId = firearm.id || generateId("firearm");

    let existingFirearm: FirearmStorage | undefined;
    if (isUpdate) {
      existingFirearm = firearms.find((f) => f.id === firearmId);
    }

    // Handle image storage if photos are provided
    let savedImagePaths: string[] = [];
    if (firearm.photos && firearm.photos.length > 0) {
      const imageUrisToSave = firearm.photos.filter(
        (p) => !isPlaceholderPhoto(p)
      );

      if (imageUrisToSave.length > 0) {
        savedImagePaths = await Promise.all(
          imageUrisToSave.map(async (imageUri) => {
            return await saveImageToFileSystem(imageUri, "firearm", firearmId);
          })
        );

        // Store image paths in MMKV
        storeImagePaths("firearm", firearmId, savedImagePaths);
      }
    }

    const { initialRoundsFired, ...restOfFirearm } = firearm;

    const storageData: FirearmStorage = {
      ...restOfFirearm,
      id: firearmId,
      createdAt: existingFirearm?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      roundsFired: existingFirearm?.roundsFired || initialRoundsFired || 0,
      // Replace original URIs with saved file paths
      photos:
        savedImagePaths.length > 0
          ? savedImagePaths
          : existingFirearm?.photos || [],
    };

    const validatedFirearm = validateBeforeSave(storageData, firearmStorageSchema);

    const isNew = firearms.findIndex((f) => f.id === validatedFirearm.id) === -1;

    await writeEntityAndIndex(
      firearmConfig,
      validatedFirearm,
      isNew,
      firearms.map((f) => f.id)
    );

    return firearmId;
  } catch (error) {
    const appError = handleStorageError(error, "save firearm");
    throw new Error(appError.userMessage);
  }
};

const getFirearms = async (): Promise<FirearmStorage[]> => {
  try {
    const firearms = await readEntityCollection(firearmConfig);
    return migrateLegacyFirearmVisualState(firearms);
  } catch (error) {
    const appError = handleStorageError(error, "load firearms");
    throw new Error(appError.userMessage);
  }
};

/**
 * One-time migration from the pre-visual-loadout schema: infers a firearm type
 * from legacy placeholder photo entries (falling back to "other") and removes
 * every generated placeholder entry from `photos`, leaving only real user
 * images. Idempotent — records that are already migrated pass through without
 * a write.
 */
const migrateLegacyFirearmVisualState = async (
  firearms: FirearmStorage[]
): Promise<FirearmStorage[]> => {
  return Promise.all(
    firearms.map(async (firearm) => {
      const photos = firearm.photos ?? [];
      const hasPlaceholders = photos.some(isPlaceholderPhoto);
      const needsType = firearm.firearmType === undefined;

      if (!hasPlaceholders && !needsType) return firearm;

      const firearmType =
        firearm.firearmType ?? inferLegacyFirearmType(photos) ?? "other";
      const cleanedPhotos = stripPlaceholderPhotos(photos);
      const changed =
        firearmType !== firearm.firearmType ||
        cleanedPhotos.length !== photos.length;

      if (!changed) return firearm;

      const migrated: FirearmStorage = {
        ...firearm,
        firearmType,
        photos: cleanedPhotos,
      };
      await writeEntity(firearmConfig, migrated);
      return migrated;
    })
  );
};

const deleteFirearm = async (id: string): Promise<void> => {
  try {
    // Delete associated images first
    await deleteImages("firearm", id);

    const firearms = await getFirearms();
    await removeEntityAndIndex(
      firearmConfig,
      id,
      firearms.map((f) => f.id)
    );
  } catch (error) {
    const appError = handleStorageError(error, "delete firearm");
    throw new Error(appError.userMessage);
  }
};

const updateFirearmRoundsFired = async (
  firearmId: string,
  roundsToAdd: number
): Promise<void> => {
  try {
    const firearms = await getFirearms();
    const firearmIndex = firearms.findIndex((f) => f.id === firearmId);
    if (firearmIndex === -1) {
      throw new Error("Firearm not found");
    }

    const updatedFirearm: FirearmStorage = {
      ...firearms[firearmIndex],
      roundsFired: (firearms[firearmIndex].roundsFired || 0) + roundsToAdd,
      updatedAt: new Date().toISOString(),
    };

    await writeEntity(firearmConfig, updatedFirearm);
  } catch (error) {
    handleError(error, "Storage.updateFirearmRoundsFired", { userMessage: "Failed to update firearm rounds fired." });
    throw error;
  }
};

const getFirearmImages = async (firearmId: string): Promise<string[]> => {
  try {
    return getImagePaths("firearm", firearmId);
  } catch (error) {
    handleError(error, "Storage.getFirearmImages", { userMessage: "Failed to get firearm images." });
    return [];
  }
};

export const firearmService = {
  saveFirearm,
  getFirearms,
  deleteFirearm,
  updateFirearmRoundsFired,
  getFirearmImages,
};
