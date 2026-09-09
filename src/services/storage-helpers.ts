import { z } from "zod";
import * as Crypto from "expo-crypto";
import { StorageFactory } from "./storage-factory";
import { handleError } from "./error-handler";

/**
 * Storage key layout.
 *
 * LEGACY layout (pre per-entity refactor) — kept ONLY as migration sources:
 *   @storage:firearms      -> JSON array of firearms
 *   @storage:ammunition    -> JSON array of ammunition
 *   @storage:range-visits  -> JSON array of range visits
 *
 * CURRENT layout (one key per entity + an ordered index per collection):
 *   @storage:firearm:{id}         -> JSON object (single firearm)
 *   @storage:ammunition:{id}      -> JSON object (single ammunition)
 *   @storage:range-visit:{id}     -> JSON object (single range visit)
 *   @storage:firearms-index       -> JSON array of firearm ids (insertion order)
 *   @storage:ammunition-index     -> JSON array of ammunition ids
 *   @storage:range-visits-index   -> JSON array of range visit ids
 *   @storage:settings             -> JSON settings object (unchanged)
 *
 * Rationale: the legacy layout rewrote the entire collection blob (read ->
 * parse -> stringify -> write) on every mutation, which is O(n) per write.
 * Per-entity keys make mutations O(1) with parallel batched writes.
 */

export const STORAGE_KEYS = {
  FIREARMS: "@storage:firearms",
  AMMUNITION: "@storage:ammunition",
  RANGE_VISITS: "@storage:range-visits",
  SETTINGS: "@storage:settings",
  STATS_PERIOD: "@storage:stats-period",
} as const;

export const ENTITY_KEYS = {
  FIREARM: "@storage:firearm",
  AMMUNITION: "@storage:ammunition",
  RANGE_VISIT: "@storage:range-visit",
  FIREARMS_INDEX: "@storage:firearms-index",
  AMMUNITION_INDEX: "@storage:ammunition-index",
  RANGE_VISITS_INDEX: "@storage:range-visits-index",
  ACCESSORY: "@storage:accessory",
  ACCESSORIES_INDEX: "@storage:accessories-index",
  PART_SLOT: "@storage:part-slot",
  PART_SLOTS_INDEX: "@storage:part-slots-index",
  PART_INSTANCE: "@storage:part-instance",
  PART_INSTANCES_INDEX: "@storage:part-instances-index",
  PART_PERIOD: "@storage:part-period",
  PART_PERIODS_INDEX: "@storage:part-periods-index",
  CLEANING_EVENT: "@storage:cleaning-event",
  CLEANING_EVENTS_INDEX: "@storage:cleaning-events-index",
  CLEANING_SETTINGS: "@storage:cleaning-settings",
  CLEANING_SETTINGS_INDEX: "@storage:cleaning-settings-index",
} as const;

export const firearmKey = (id: string): string => `${ENTITY_KEYS.FIREARM}:${id}`;
export const ammunitionKey = (id: string): string =>
  `${ENTITY_KEYS.AMMUNITION}:${id}`;
export const rangeVisitKey = (id: string): string =>
  `${ENTITY_KEYS.RANGE_VISIT}:${id}`;
export const accessoryKey = (id: string): string =>
  `${ENTITY_KEYS.ACCESSORY}:${id}`;
export const partSlotKey = (id: string): string =>
  `${ENTITY_KEYS.PART_SLOT}:${id}`;
export const partInstanceKey = (id: string): string =>
  `${ENTITY_KEYS.PART_INSTANCE}:${id}`;
export const partPeriodKey = (id: string): string =>
  `${ENTITY_KEYS.PART_PERIOD}:${id}`;
export const cleaningEventKey = (id: string): string =>
  `${ENTITY_KEYS.CLEANING_EVENT}:${id}`;
export const cleaningSettingsKey = (firearmId: string): string =>
  `${ENTITY_KEYS.CLEANING_SETTINGS}:${firearmId}`;

export type CollectionConfig<T extends { id: string }> = {
  /** Builds the per-entity storage key for a given id. */
  entityKey: (id: string) => string;
  /** Key of the JSON array holding the collection's ordered ids. */
  indexKey: string;
  /** Legacy blob key used as the one-time migration source. */
  legacyKey: string;
  /** Zod schema used to validate a single entity. */
  schema: z.ZodSchema<T>;
};

// Helper function to validate and parse data
export async function validateAndParse<T>(
  data: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const parsed = JSON.parse(data);
    return schema.parse(parsed);
  } catch (error) {
    handleError(error, "Storage.validateAndParse", { userMessage: "Data validation failed." });
    throw new Error("Data validation failed");
  }
}

// Helper function to validate data before saving
export function validateBeforeSave<T>(data: T, schema: z.ZodSchema<T>): T {
  try {
    return schema.parse(data);
  } catch (error) {
    handleError(error, "Storage.validateBeforeSave", { userMessage: "Data validation failed." });
    throw new Error("Data validation failed");
  }
}

// Helper function to generate a unique ID
export function generateId(prefix: string): string {
  // Cryptographically secure random IDs via expo-crypto (never Math.random()).
  const timestamp = Date.now();
  const randomPart = Array.from(Crypto.getRandomBytes(6))
    .map((b) => b.toString(36))
    .join("");

  return `${prefix}-${timestamp}-${randomPart}`;
}

/**
 * One-time migration from a legacy collection blob to per-entity keys.
 *
 * Writes all entity keys first, then the index, then deletes the legacy blob.
 * If the app crashes before the index is written, the legacy blob still exists
 * on the next launch and the migration simply runs again (idempotent). If it
 * crashes between the index write and the legacy delete, the index wins on the
 * next read and the stale legacy blob is only ever cleaned up by
 * clearAllData() — a harmless orphan.
 */
async function migrateLegacyCollection<T extends { id: string }>(
  config: CollectionConfig<T>,
  entities: T[]
): Promise<void> {
  const storage = StorageFactory.getStorage();
  const ids = entities.map((entity) => entity.id);

  await Promise.all(
    entities.map((entity) =>
      storage.setItem(config.entityKey(entity.id), JSON.stringify(entity))
    )
  );
  await storage.setItem(config.indexKey, JSON.stringify(ids));
  await storage.removeItem(config.legacyKey);
}

/**
 * Read an entity collection.
 * - If the index exists, entities are read individually (in parallel) in index
 *   order. Ids whose entity key is missing (crash between a removeItem and the
 *   index write) are skipped.
 * - If only the legacy blob exists, run the one-time migration first.
 * - Otherwise return an empty array.
 */
export async function readEntityCollection<T extends { id: string }>(
  config: CollectionConfig<T>
): Promise<T[]> {
  const storage = StorageFactory.getStorage();

  const indexRaw = await storage.getItem(config.indexKey);
  if (indexRaw) {
    const ids = await validateAndParse(indexRaw, z.array(z.string()));

    const entries = await Promise.all(
      ids.map((id) => storage.getItem(config.entityKey(id)))
    );

    const entities: T[] = [];
    for (const entry of entries) {
      if (!entry) continue; // ghost id — entity deleted but index write failed
      entities.push(await validateAndParse(entry, config.schema));
    }
    return entities;
  }

  const legacyRaw = await storage.getItem(config.legacyKey);
  if (legacyRaw) {
    const entities = await validateAndParse(legacyRaw, z.array(config.schema));
    await migrateLegacyCollection(config, entities);
    return entities;
  }

  return [];
}

/** Persist a single entity (index unchanged). */
export async function writeEntity<T extends { id: string }>(
  config: CollectionConfig<T>,
  entity: T
): Promise<void> {
  const storage = StorageFactory.getStorage();
  const validated = validateBeforeSave(entity, config.schema);
  await storage.setItem(config.entityKey(validated.id), JSON.stringify(validated));
}

/**
 * Persist a single entity plus the collection index.
 * `isNew` appends the id to the index; updates keep the existing order.
 * The two writes are batched with Promise.all; a crash in between leaves
 * either a ghost id in the index (skipped on read) or an orphaned entity key
 * (invisible until an index update), never corrupt data.
 */
export async function writeEntityAndIndex<T extends { id: string }>(
  config: CollectionConfig<T>,
  entity: T,
  isNew: boolean,
  existingIds: string[]
): Promise<void> {
  const storage = StorageFactory.getStorage();
  const validated = validateBeforeSave(entity, config.schema);
  const ids = isNew ? [...existingIds, validated.id] : existingIds;
  await Promise.all([
    storage.setItem(config.entityKey(validated.id), JSON.stringify(validated)),
    storage.setItem(config.indexKey, JSON.stringify(ids)),
  ]);
}

/** Remove a single entity and update the collection index. */
export async function removeEntityAndIndex<T extends { id: string }>(
  config: CollectionConfig<T>,
  id: string,
  existingIds: string[]
): Promise<void> {
  const storage = StorageFactory.getStorage();
  const ids = existingIds.filter((existingId) => existingId !== id);
  await Promise.all([
    storage.removeItem(config.entityKey(id)),
    storage.setItem(config.indexKey, JSON.stringify(ids)),
  ]);
}

/** Persist a full collection (all entity keys + index). Used by importData. */
export async function writeEntityCollection<T extends { id: string }>(
  config: CollectionConfig<T>,
  entities: T[]
): Promise<void> {
  const storage = StorageFactory.getStorage();
  const ids = entities.map((entity) => entity.id);
  await Promise.all([
    ...entities.map((entity) =>
      storage.setItem(config.entityKey(entity.id), JSON.stringify(entity))
    ),
    storage.setItem(config.indexKey, JSON.stringify(ids)),
  ]);
}
