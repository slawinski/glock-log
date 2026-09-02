import {
  ammunitionStorageSchema,
  AmmunitionStorage,
} from "../validation/storageSchemas";
import { AmmunitionInput } from "../validation/inputSchemas";
import { handleStorageError, handleError } from "./error-handler";
import {
  ENTITY_KEYS,
  STORAGE_KEYS,
  ammunitionKey,
  generateId,
  readEntityCollection,
  validateBeforeSave,
  writeEntity,
  writeEntityAndIndex,
  removeEntityAndIndex,
  CollectionConfig,
} from "./storage-helpers";
import { getImagePaths } from "./image-storage";

const ammunitionConfig: CollectionConfig<AmmunitionStorage> = {
  entityKey: ammunitionKey,
  indexKey: ENTITY_KEYS.AMMUNITION_INDEX,
  legacyKey: STORAGE_KEYS.AMMUNITION,
  schema: ammunitionStorageSchema,
};

const saveAmmunition = async (ammunition: AmmunitionInput): Promise<void> => {
  try {
    const ammunitionList = await getAmmunition();
    const isUpdate = !!ammunition.id;
    const ammunitionId = ammunition.id || generateId("ammo");

    let existingAmmunition: AmmunitionStorage | undefined;
    if (isUpdate) {
      existingAmmunition = ammunitionList.find((a) => a.id === ammunitionId);
    }
    const storageData: AmmunitionStorage = {
      ...ammunition,
      id: ammunitionId,
      createdAt: existingAmmunition?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const validatedAmmunition = validateBeforeSave(
      storageData,
      ammunitionStorageSchema
    );

    const isNew =
      ammunitionList.findIndex((a) => a.id === validatedAmmunition.id) === -1;

    await writeEntityAndIndex(
      ammunitionConfig,
      validatedAmmunition,
      isNew,
      ammunitionList.map((a) => a.id)
    );
  } catch (error) {
    const appError = handleStorageError(error, "save ammunition");
    throw new Error(appError.userMessage);
  }
};

const getAmmunition = async (): Promise<AmmunitionStorage[]> => {
  try {
    return readEntityCollection(ammunitionConfig);
  } catch (error) {
    const appError = handleStorageError(error, "load ammunition");
    throw new Error(appError.userMessage);
  }
};

const deleteAmmunition = async (id: string): Promise<void> => {
  try {
    const ammunition = await getAmmunition();
    await removeEntityAndIndex(
      ammunitionConfig,
      id,
      ammunition.map((a) => a.id)
    );
  } catch (error) {
    const appError = handleStorageError(error, "delete ammunition");
    throw new Error(appError.userMessage);
  }
};

const updateAmmunitionQuantity = async (
  ammunitionId: string,
  quantityChange: number
): Promise<void> => {
  try {
    const ammunition = await getAmmunition();
    const ammoIndex = ammunition.findIndex((a) => a.id === ammunitionId);
    if (ammoIndex === -1) {
      throw new Error("Ammunition not found");
    }

    const updatedAmmunition: AmmunitionStorage = {
      ...ammunition[ammoIndex],
      quantity: Math.max(
        0,
        (ammunition[ammoIndex].quantity || 0) + quantityChange
      ),
      updatedAt: new Date().toISOString(),
    };

    await writeEntity(ammunitionConfig, updatedAmmunition);
  } catch (error) {
    handleError(error, "Storage.updateAmmunitionQuantity", { userMessage: "Failed to update ammunition quantity." });
    throw error;
  }
};

const getAmmunitionImages = async (ammunitionId: string): Promise<string[]> => {
  try {
    return getImagePaths("ammunition", ammunitionId);
  } catch (error) {
    handleError(error, "Storage.getAmmunitionImages", { userMessage: "Failed to get ammunition images." });
    return [];
  }
};

export const ammunitionService = {
  saveAmmunition,
  getAmmunition,
  deleteAmmunition,
  updateAmmunitionQuantity,
  getAmmunitionImages,
};
