import {
  rangeVisitStorageSchema,
  RangeVisitStorage,
} from "../validation/storageSchemas";
import { RangeVisitInput } from "../validation/inputSchemas";
import {
  saveImageToFileSystem,
  storeImagePaths,
  deleteImages,
  getImagePaths,
} from "./image-storage";
import { handleError } from "./error-handler";
import {
  ENTITY_KEYS,
  STORAGE_KEYS,
  rangeVisitKey,
  generateId,
  readEntityCollection,
  validateBeforeSave,
  writeEntityAndIndex,
  removeEntityAndIndex,
  CollectionConfig,
} from "./storage-helpers";
import { ammunitionService } from "./ammunition-service";
import { firearmService } from "./firearm-service";

const visitConfig: CollectionConfig<RangeVisitStorage> = {
  entityKey: rangeVisitKey,
  indexKey: ENTITY_KEYS.RANGE_VISITS_INDEX,
  legacyKey: STORAGE_KEYS.RANGE_VISITS,
  schema: rangeVisitStorageSchema,
};

const saveRangeVisit = async (visit: RangeVisitInput): Promise<void> => {
  try {
    const visits = await getRangeVisits();
    const isUpdate = !!visit.id;
    const visitId = visit.id || generateId("visit");

    let existingVisit: RangeVisitStorage | undefined;
    if (isUpdate) {
      existingVisit = visits.find((v) => v.id === visitId);
    }

    // Handle image storage if photos are provided
    let savedImagePaths: string[] = [];
    if (visit.photos && visit.photos.length > 0) {
      savedImagePaths = await Promise.all(
        visit.photos.map(async (imageUri) => {
          return await saveImageToFileSystem(imageUri, "range-visit", visitId);
        })
      );

      // Store image paths in MMKV
      storeImagePaths("range-visit", visitId, savedImagePaths);
    }

    const ammunitionById = new Map(
      (await ammunitionService.getAmmunition()).map((a) => [a.id, a])
    );
    const firearmsById = new Map(
      (await firearmService.getFirearms()).map((f) => [f.id, f])
    );

    const ammunitionUsed = Object.fromEntries(
      Object.entries(visit.ammunitionUsed || {}).map(([firearmId, entry]) => [
        firearmId,
        {
          ...entry,
          pricePerRoundSnapshot: ammunitionById.get(entry.ammunitionId)
            ?.pricePerRound,
          caliberSnapshot: ammunitionById.get(entry.ammunitionId)?.caliber,
          brandSnapshot: ammunitionById.get(entry.ammunitionId)?.brand,
          grainSnapshot: ammunitionById.get(entry.ammunitionId)?.grain,
          firearmNameSnapshot: firearmsById.get(firearmId)?.modelName,
        },
      ])
    );

    const storageData: RangeVisitStorage = {
      ...visit,
      ammunitionUsed,
      // Preserve saved accessory usage when an edit doesn't provide it, so
      // backfilled/manual records are not wiped by an unrelated visit edit.
      accessoryUsage: visit.accessoryUsage ?? existingVisit?.accessoryUsage,
      id: visitId,
      createdAt: existingVisit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Replace original URIs with saved file paths
      photos:
        savedImagePaths.length > 0 ? savedImagePaths : existingVisit?.photos || [],
    };

    const validatedVisit = validateBeforeSave(storageData, rangeVisitStorageSchema);

    const isNew = visits.findIndex((v) => v.id === validatedVisit.id) === -1;

    await writeEntityAndIndex(
      visitConfig,
      validatedVisit,
      isNew,
      visits.map((v) => v.id)
    );
  } catch (error) {
    handleError(error, "Storage.saveRangeVisit", { userMessage: "Failed to save range visit." });
    throw error;
  }
};

const getRangeVisits = async (): Promise<RangeVisitStorage[]> => {
  try {
    return readEntityCollection(visitConfig);
  } catch (error) {
    handleError(error, "Storage.getRangeVisits", { userMessage: "Failed to get range visits." });
    throw error;
  }
};

const deleteRangeVisit = async (id: string): Promise<void> => {
  try {
    // Delete associated images first
    await deleteImages("range-visit", id);

    const visits = await getRangeVisits();
    await removeEntityAndIndex(
      visitConfig,
      id,
      visits.map((v) => v.id)
    );
  } catch (error) {
    handleError(error, "Storage.deleteRangeVisit", { userMessage: "Failed to delete range visit." });
    throw error;
  }
};

/**
 * Saves a range visit and applies its ammunition/firearm side effects.
 *
 * IMPORTANT — write-order and partial-write risk (preserved behavior):
 * 1. The visit is validated and persisted first (saveRangeVisit).
 * 2. Ammunition quantity deltas are applied sequentially.
 * 3. Firearm round deltas are applied sequentially.
 *
 * This sequence is deliberately NOT wrapped in a transaction: a failure in
 * step 2 or 3 (e.g. a referenced id no longer exists) leaves the visit
 * saved while some deltas were already applied. Callers (AddRangeVisit /
 * EditRangeVisit) pre-validate ammunition availability before calling this
 * method, and partial writes are recoverable by re-saving the visit, whose
 * deltas are computed as the difference against the previously stored
 * rounds. Behavior is locked by tests in storage-new.test.ts.
 */
const saveRangeVisitWithAmmunition = async (
  visit: RangeVisitInput
): Promise<void> => {
  try {
    const isUpdate = !!visit.id;
    let originalVisit: RangeVisitStorage | undefined;

    // Get original visit data if this is an update
    if (isUpdate) {
      const visits = await getRangeVisits();
      originalVisit = visits.find((v) => v.id === visit.id);
    }

    await saveRangeVisit(visit);

    // Update ammunition quantities
    if (visit.ammunitionUsed) {
      for (const [firearmId, ammoData] of Object.entries(visit.ammunitionUsed)) {
        const originalAmmoData = originalVisit?.ammunitionUsed?.[firearmId];
        const originalRounds = originalAmmoData?.rounds || 0;
        const newRounds = ammoData.rounds;
        const roundsDifference = newRounds - originalRounds;

        // Only update if there's a difference
        if (roundsDifference !== 0) {
          await ammunitionService.updateAmmunitionQuantity(
            ammoData.ammunitionId,
            -roundsDifference
          );
        }
      }
    }

    // Handle ammunition that was removed from the visit (restore to inventory)
    if (isUpdate && originalVisit?.ammunitionUsed) {
      for (const [firearmId, originalAmmoData] of Object.entries(
        originalVisit.ammunitionUsed
      )) {
        // If this firearm/ammunition is no longer used in the updated visit
        if (!visit.ammunitionUsed?.[firearmId]) {
          await ammunitionService.updateAmmunitionQuantity(
            originalAmmoData.ammunitionId,
            originalAmmoData.rounds // Add back to inventory
          );
        }
      }
    }

    // Update firearm rounds fired
    if (visit.ammunitionUsed && visit.firearmsUsed.length > 0) {
      for (const firearmId of visit.firearmsUsed) {
        const ammoData = visit.ammunitionUsed[firearmId];
        if (ammoData) {
          const originalAmmoData = originalVisit?.ammunitionUsed?.[firearmId];
          const originalRounds = originalAmmoData?.rounds || 0;
          const newRounds = ammoData.rounds;
          const roundsDifference = newRounds - originalRounds;

          // Only update if there's a difference
          if (roundsDifference !== 0) {
            await firearmService.updateFirearmRoundsFired(
              firearmId,
              roundsDifference
            );
          }
        }
      }
    }

    // Handle firearms that were removed from the visit (subtract rounds fired)
    if (isUpdate && originalVisit?.ammunitionUsed) {
      for (const [firearmId, originalAmmoData] of Object.entries(
        originalVisit.ammunitionUsed
      )) {
        // If this firearm is no longer used in the updated visit
        if (!visit.ammunitionUsed?.[firearmId]) {
          await firearmService.updateFirearmRoundsFired(
            firearmId,
            -originalAmmoData.rounds
          );
        }
      }
    }
  } catch (error) {
    handleError(error, "Storage.saveRangeVisitWithAmmunition", { userMessage: "Failed to save range visit with ammunition." });
    throw error;
  }
};

const getRangeVisitImages = async (visitId: string): Promise<string[]> => {
  try {
    return getImagePaths("range-visit", visitId);
  } catch (error) {
    handleError(error, "Storage.getRangeVisitImages", { userMessage: "Failed to get range visit images." });
    return [];
  }
};

export const rangeVisitService = {
  saveRangeVisit,
  getRangeVisits,
  deleteRangeVisit,
  saveRangeVisitWithAmmunition,
  getRangeVisitImages,
};
