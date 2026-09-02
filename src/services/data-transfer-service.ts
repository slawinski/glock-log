import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { zipWithPassword } from "react-native-zip-archive";
import {
  firearmStorageSchema,
  ammunitionStorageSchema,
  rangeVisitStorageSchema,
  FirearmStorage,
  AmmunitionStorage,
  RangeVisitStorage,
} from "../validation/storageSchemas";
import { handleError } from "./error-handler";
import { cleanupOrphanedImages } from "./image-storage";
import {
  ENTITY_KEYS,
  STORAGE_KEYS,
  firearmKey,
  ammunitionKey,
  rangeVisitKey,
  validateBeforeSave,
  writeEntityCollection,
  CollectionConfig,
} from "./storage-helpers";
import { firearmService } from "./firearm-service";
import { ammunitionService } from "./ammunition-service";
import { rangeVisitService } from "./range-visit-service";
import { settingsService } from "./settings-service";

/**
 * The storage-shaped bundle carried inside a data-transfer archive.
 * Exported so screens can type the payload read from data.json.
 */
export type ImportData = {
  firearms: FirearmStorage[];
  ammunition: AmmunitionStorage[];
  rangeVisits: RangeVisitStorage[];
};

/**
 * Maximum accepted import archive size (100 MB). Rejecting oversized
 * archives up front protects cache storage from ZIP bombs (C19).
 */
export const MAX_IMPORT_FILE_SIZE_BYTES = 100 * 1024 * 1024;

/**
 * Thrown when an import archive exceeds {@link MAX_IMPORT_FILE_SIZE_BYTES}.
 * The message is safe to show directly to the user.
 */
export class ImportFileTooLargeError extends Error {
  constructor() {
    super(
      `Import file exceeds the ${
        MAX_IMPORT_FILE_SIZE_BYTES / (1024 * 1024)
      } MB size limit.`
    );
    this.name = "ImportFileTooLargeError";
  }
}

const firearmConfig: CollectionConfig<FirearmStorage> = {
  entityKey: firearmKey,
  indexKey: ENTITY_KEYS.FIREARMS_INDEX,
  legacyKey: STORAGE_KEYS.FIREARMS,
  schema: firearmStorageSchema,
};

const ammunitionConfig: CollectionConfig<AmmunitionStorage> = {
  entityKey: ammunitionKey,
  indexKey: ENTITY_KEYS.AMMUNITION_INDEX,
  legacyKey: STORAGE_KEYS.AMMUNITION,
  schema: ammunitionStorageSchema,
};

const visitConfig: CollectionConfig<RangeVisitStorage> = {
  entityKey: rangeVisitKey,
  indexKey: ENTITY_KEYS.RANGE_VISITS_INDEX,
  legacyKey: STORAGE_KEYS.RANGE_VISITS,
  schema: rangeVisitStorageSchema,
};

/**
 * react-native-zip-archive expects a plain filesystem path (no file://
 * scheme) on Android. Other platforms pass the URI through unchanged.
 */
export const cleanPath = (path: string): string => {
  if (Platform.OS === "android" && path.startsWith("file://")) {
    return path.substring(7);
  }
  return path;
};

/**
 * Resolves "." and ".." segments in a filesystem URI string. React Native
 * has no Node `path` module, so this implements the small resolution step
 * needed for zip-slip containment checks (C18).
 *
 * The resolver is deliberately conservative: a ".." that would climb above
 * the URI root (its scheme or leading slashes) is preserved as-is, so a path
 * that escapes one directory can never be resolved back inside a checked
 * root by later segments.
 */
export const resolveArchivePath = (input: string): string => {
  const segments = input.split("/");
  const resolved: string[] = [];

  for (const segment of segments) {
    if (segment === ".") {
      // Drop "." segments entirely.
      continue;
    }
    if (segment === "..") {
      const last = resolved[resolved.length - 1];
      // Never pop the URI scheme ("file:"), root markers (empty segments),
      // or an earlier unresolvable ".." segment.
      if (
        last !== undefined &&
        last !== "" &&
        last !== ".." &&
        last !== "file:"
      ) {
        resolved.pop();
      } else {
        resolved.push("..");
      }
      continue;
    }
    resolved.push(segment);
  }

  return resolved.join("/");
};

/**
 * Returns true when `candidate` is the `root` itself or a descendant of it,
 * after both are normalized with {@link resolveArchivePath}. Uses a
 * trailing-slash prefix comparison so `/a/bc` is never treated as being
 * inside `/a/b`.
 */
export const isPathInside = (root: string, candidate: string): boolean => {
  const resolvedRoot = resolveArchivePath(root);
  const rootWithSlash = resolvedRoot.endsWith("/")
    ? resolvedRoot
    : `${resolvedRoot}/`;
  const resolvedCandidate = resolveArchivePath(candidate);

  return (
    resolvedCandidate === resolvedRoot ||
    resolvedCandidate.startsWith(rootWithSlash)
  );
};

/**
 * Type guard for the data.json payload of a transfer archive. The per-record
 * validation happens later in importData (each record is zod-validated and
 * invalid ones are skipped); this only confirms the bundle has the expected
 * top-level shape.
 */
export const isImportData = (value: unknown): value is ImportData => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.firearms) &&
    Array.isArray(candidate.ammunition) &&
    Array.isArray(candidate.rangeVisits)
  );
};

/**
 * Rejects import archives larger than {@link MAX_IMPORT_FILE_SIZE_BYTES}
 * before any extraction work starts (C19).
 */
export const checkImportFileSize = async (fileUri: string): Promise<void> => {
  const info = await FileSystem.getInfoAsync(fileUri, { size: true });
  if (
    info.exists &&
    typeof info.size === "number" &&
    info.size > MAX_IMPORT_FILE_SIZE_BYTES
  ) {
    throw new ImportFileTooLargeError();
  }
};

/**
 * Import a data bundle exported by DataTransfer.tsx.
 *
 * SEAM (do not change without coordinating with the DataTransfer owner):
 * the exported bundle shape is { firearms, ammunition, rangeVisits } of
 * storage-shaped records. Export archives are now AES-256 encrypted at the
 * ZIP level, but this method only ever sees the decrypted payload and must
 * keep accepting plain JSON objects (backward compat with legacy exports).
 *
 * Strategy semantics (preserved, locked by tests in storage-import.test.ts):
 * - "restore": wipe everything (clearAllData), then write the bundle verbatim
 *   (no ammunition/round side effects are applied).
 * - "merge" (default): keep existing records; imported records with matching
 *   ids overwrite existing ones. New visits apply their usage against
 *   existing ammunition (deducted) and existing firearms (rounds added),
 *   unless the firearm was itself part of the import bundle (assumed to
 *   already include those rounds).
 */
export const importData = async (
  data: ImportData,
  strategy: "merge" | "restore" = "merge"
): Promise<void> => {
  try {
    if (strategy === "restore") {
      await settingsService.clearAllData();
    }

    // Initialize local copies for manipulation
    let finalFirearms: FirearmStorage[] = [];
    let finalAmmo: AmmunitionStorage[] = [];
    let finalVisits: RangeVisitStorage[] = [];

    // 1. Load baseline
    if (strategy === "merge") {
      finalFirearms = await firearmService.getFirearms();
      finalAmmo = await ammunitionService.getAmmunition();
      finalVisits = await rangeVisitService.getRangeVisits();
    }

    // 2. Prepare Maps for efficient lookup/update
    const firearmMap = new Map(finalFirearms.map((f) => [f.id, f]));
    const ammoMap = new Map(finalAmmo.map((a) => [a.id, a]));
    const visitMap = new Map(finalVisits.map((v) => [v.id, v]));

    // 3. Integrate new Firearms
    if (data.firearms && Array.isArray(data.firearms)) {
      for (const firearm of data.firearms) {
        try {
          const validated = validateBeforeSave(firearm, firearmStorageSchema);
          firearmMap.set(validated.id, validated);
        } catch (e) {
          console.warn("Skipping invalid firearm import", e);
        }
      }
    }

    // 4. Integrate new Ammunition
    if (data.ammunition && Array.isArray(data.ammunition)) {
      for (const ammo of data.ammunition) {
        try {
          const validated = validateBeforeSave(ammo, ammunitionStorageSchema);
          ammoMap.set(validated.id, validated);
        } catch (e) {
          console.warn("Skipping invalid ammunition import", e);
        }
      }
    }

    // 5. Process new Range Visits and Apply Usage
    if (data.rangeVisits && Array.isArray(data.rangeVisits)) {
      for (const visit of data.rangeVisits) {
        try {
          const validated = validateBeforeSave(visit, rangeVisitStorageSchema);

          // Only apply usage if this is a NEW visit or if we are in restore mode
          // AND the firearm wasn't already imported with these rounds included.
          // Actually, if we are importing a bundle (firearms + visits), the firearms
          // already have the rounds from these visits.
          // We only need to apply usage if we are merging and the visit is NEW
          // to the system, but the firearm already existed.

          const isNewVisit = !visitMap.has(validated.id);

          if (isNewVisit || strategy === "restore") {
            if (validated.ammunitionUsed) {
              for (const [firearmId, usage] of Object.entries(validated.ammunitionUsed)) {
                // Update Ammunition Stock
                const ammo = ammoMap.get(usage.ammunitionId);
                if (ammo) {
                  // Only subtract if it's a new visit being merged into existing data
                  if (isNewVisit && strategy === "merge") {
                    ammo.quantity = Math.max(0, (ammo.quantity || 0) - (usage.rounds || 0));
                    ammo.updatedAt = new Date().toISOString();
                  }
                }

                // Update Firearm Rounds
                // We ONLY update the firearm rounds if this is a NEW visit being merged
                // into an EXISTING firearm that WAS NOT part of this import's firearm list.
                // If the firearm IS in the import list, it already has the rounds.

                const isFirearmInImport = data.firearms?.some(f => f.id === firearmId);

                if (isNewVisit && strategy === "merge" && !isFirearmInImport) {
                  let firearm = firearmMap.get(firearmId);

                  if (!firearm) {
                    if (validated.firearmsUsed.length === 1) {
                      firearm = firearmMap.get(validated.firearmsUsed[0]);
                    } else {
                      // Try to find a firearm in the visit that matches the ammo's caliber
                      for (const fId of validated.firearmsUsed) {
                        const f = firearmMap.get(fId);
                        if (f && ammo && f.caliber === ammo.caliber) {
                          firearm = f;
                          break;
                        }
                      }
                    }
                  }

                  if (firearm) {
                    firearm.roundsFired = (firearm.roundsFired || 0) + (usage.rounds || 0);
                    firearm.updatedAt = new Date().toISOString();
                  }
                }
              }
            }
          }

          visitMap.set(validated.id, validated);
        } catch (e) {
          console.warn("Skipping invalid range visit import", e);
        }
      }
    }

    // 6. Save integrated data (all entity keys + index keys, batched)
    await Promise.all([
      writeEntityCollection(firearmConfig, Array.from(firearmMap.values())),
      writeEntityCollection(ammunitionConfig, Array.from(ammoMap.values())),
      writeEntityCollection(visitConfig, Array.from(visitMap.values())),
    ]);

    if (strategy === "restore") {
      await cleanupOrphanedImages();
    }

  } catch (error) {
    handleError(error, "Storage.importData", { userMessage: "Failed to import data." });
    throw error;
  }
};

/**
 * Export the full database (firearms, ammunition, range visits + images) to
 * an AES-256 encrypted ZIP archive (B7).
 *
 * The passphrase is used only to encrypt the archive in memory; it is never
 * written to disk or persisted anywhere. The created archive path is returned
 * so the caller can share it.
 */
export const exportData = async (password: string): Promise<string> => {
  let tempDir = "";
  try {
    // 1. Fetch all data
    const [firearms, ammunition, rangeVisits] = await Promise.all([
      firearmService.getFirearms(),
      ammunitionService.getAmmunition(),
      rangeVisitService.getRangeVisits(),
    ]);

    const exportBundle = {
      version: "1.1.0", // Bumped version for image support
      timestamp: new Date().toISOString(),
      data: {
        firearms,
        ammunition,
        rangeVisits,
      },
    };

    // 2. Prepare temporary directory
    tempDir = `${FileSystem.cacheDirectory}triggernote_export_${Date.now()}`;
    await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    await FileSystem.makeDirectoryAsync(`${tempDir}/images`, { intermediates: true });

    // 3. Write JSON data
    const jsonData = JSON.stringify(exportBundle, null, 2);
    await FileSystem.writeAsStringAsync(`${tempDir}/data.json`, jsonData);

    // 4. Copy images
    // Collect all unique image paths referenced in the database
    const imageSet = new Set<string>();
    firearms.forEach(f => f.photos?.forEach(p => !p.startsWith('placeholder:') && imageSet.add(p)));
    rangeVisits.forEach(v => v.photos?.forEach(p => !p.startsWith('placeholder:') && imageSet.add(p)));
    // Ammunition doesn't have photos in current schema but good to be ready

    for (const imgPath of imageSet) {
      try {
        // Extract filename from path
        const fileName = imgPath.split('/').pop();
        if (fileName) {
          const destPath = `${tempDir}/images/${fileName}`;
          await FileSystem.copyAsync({ from: imgPath, to: destPath });
        }
      } catch (e) {
        console.warn(`Could not bundle image: ${imgPath}`, e);
      }
    }

    // 5. Create the AES-256 encrypted ZIP archive
    const zipFileName = `triggernote_backup_${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.zip`;
    const zipPath = `${FileSystem.cacheDirectory}${zipFileName}`;

    await zipWithPassword(cleanPath(tempDir), cleanPath(zipPath), password, "AES-256");

    return zipPath;
  } catch (error) {
    handleError(error, "Storage.exportData", { userMessage: "Failed to export data." });
    throw error;
  } finally {
    // Cleanup
    try {
      if (tempDir) await FileSystem.deleteAsync(tempDir, { idempotent: true });
      // We don't delete zipPath immediately as Sharing might still need it on some platforms
      // but we can schedule it or just let it sit in cache.
    } catch { /* ignore cleanup errors */ }
  }
};

export const dataTransferService = {
  importData,
  exportData,
};
