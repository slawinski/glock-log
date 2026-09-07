import {
  cleaningEventSchema,
  cleaningSettingsSchema,
  CleaningEvent,
  CleaningSettings,
} from "../validation/storageSchemas";
import { CleaningEventInput } from "../validation/inputSchemas";
import { handleError } from "./error-handler";
import { StorageFactory } from "./storage-factory";
import {
  ENTITY_KEYS,
  cleaningEventKey,
  cleaningSettingsKey,
  generateId,
  readEntityCollection,
  validateBeforeSave,
  writeEntityAndIndex,
  removeEntityAndIndex,
  CollectionConfig,
} from "./storage-helpers";

const eventConfig: CollectionConfig<CleaningEvent> = {
  entityKey: cleaningEventKey,
  indexKey: ENTITY_KEYS.CLEANING_EVENTS_INDEX,
  legacyKey: ENTITY_KEYS.CLEANING_EVENT, // no legacy layout; never present
  schema: cleaningEventSchema,
};

const readSettingsIndex = async (): Promise<string[]> => {
  const storage = StorageFactory.getStorage();
  const raw = await storage.getItem(ENTITY_KEYS.CLEANING_SETTINGS_INDEX);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
};

const getCleaningSettings = async (
  firearmId: string
): Promise<CleaningSettings | undefined> => {
  try {
    const storage = StorageFactory.getStorage();
    const raw = await storage.getItem(cleaningSettingsKey(firearmId));
    if (!raw) return undefined;
    return cleaningSettingsSchema.parse(JSON.parse(raw));
  } catch (error) {
    handleError(error, "CleaningService.getCleaningSettings", { userMessage: "Failed to load cleaning settings." });
    return undefined;
  }
};

const saveCleaningSettings = async (
  settings: CleaningSettings
): Promise<void> => {
  try {
    const validated = validateBeforeSave(settings, cleaningSettingsSchema);
    const storage = StorageFactory.getStorage();
    const index = await readSettingsIndex();
    const isNew = !index.includes(validated.firearmId);
    const nextIndex = isNew ? [...index, validated.firearmId] : index;
    await Promise.all([
      storage.setItem(
        cleaningSettingsKey(validated.firearmId),
        JSON.stringify(validated)
      ),
      storage.setItem(ENTITY_KEYS.CLEANING_SETTINGS_INDEX, JSON.stringify(nextIndex)),
    ]);
  } catch (error) {
    handleError(error, "CleaningService.saveCleaningSettings", { userMessage: "Failed to save cleaning settings." });
    throw error;
  }
};

const getAllCleaningSettings = async (): Promise<CleaningSettings[]> => {
  try {
    const storage = StorageFactory.getStorage();
    const index = await readSettingsIndex();
    const entries = await Promise.all(
      index.map((id) => storage.getItem(cleaningSettingsKey(id)))
    );
    const result: CleaningSettings[] = [];
    for (const entry of entries) {
      if (!entry) continue;
      try {
        result.push(cleaningSettingsSchema.parse(JSON.parse(entry)));
      } catch {
        // skip corrupt entries
      }
    }
    return result;
  } catch (error) {
    handleError(error, "CleaningService.getAllCleaningSettings", { userMessage: "Failed to load cleaning settings." });
    return [];
  }
};

const deleteCleaningForFirearm = async (firearmId: string): Promise<void> => {
  try {
    const storage = StorageFactory.getStorage();
    const events = await getCleaningEvents(firearmId);
    await Promise.all(
      events.map((e) => storage.removeItem(cleaningEventKey(e.id)))
    );
    const indexRaw = await storage.getItem(ENTITY_KEYS.CLEANING_EVENTS_INDEX);
    const index: string[] = indexRaw ? JSON.parse(indexRaw) : [];
    await storage.setItem(
      ENTITY_KEYS.CLEANING_EVENTS_INDEX,
      JSON.stringify(index.filter((id) => !events.some((e) => e.id === id)))
    );
    await storage.removeItem(cleaningSettingsKey(firearmId));
    const settingsIndex = await readSettingsIndex();
    await storage.setItem(
      ENTITY_KEYS.CLEANING_SETTINGS_INDEX,
      JSON.stringify(settingsIndex.filter((id) => id !== firearmId))
    );
  } catch (error) {
    handleError(error, "CleaningService.deleteCleaningForFirearm", { userMessage: "Failed to delete cleaning data." });
    throw error;
  }
};

const getCleaningEvents = async (
  firearmId: string
): Promise<CleaningEvent[]> => {
  try {
    const all = await readEntityCollection(eventConfig);
    return all.filter((e) => e.firearmId === firearmId);
  } catch (error) {
    handleError(error, "CleaningService.getCleaningEvents", { userMessage: "Failed to load cleaning history." });
    return [];
  }
};

const getAllCleaningEvents = async (): Promise<CleaningEvent[]> => {
  try {
    return readEntityCollection(eventConfig);
  } catch (error) {
    handleError(error, "CleaningService.getAllCleaningEvents", { userMessage: "Failed to load cleaning history." });
    return [];
  }
};

const saveCleaningEvent = async (
  input: CleaningEventInput
): Promise<string> => {
  try {
    const events = await readEntityCollection(eventConfig);
    const isUpdate = !!input.id;
    const id = input.id || generateId("cleaning");
    const existing = isUpdate ? events.find((e) => e.id === id) : undefined;

    const event: CleaningEvent = {
      firearmId: input.firearmId,
      type: input.type,
      performedAt: input.performedAt,
      notes: input.notes,
      id,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const validated = validateBeforeSave(event, cleaningEventSchema);
    const isNew = events.findIndex((e) => e.id === validated.id) === -1;
    await writeEntityAndIndex(
      eventConfig,
      validated,
      isNew,
      events.map((e) => e.id)
    );
    return id;
  } catch (error) {
    handleError(error, "CleaningService.saveCleaningEvent", { userMessage: "Failed to save cleaning event." });
    throw error;
  }
};

const deleteCleaningEvent = async (id: string): Promise<void> => {
  try {
    const events = await readEntityCollection(eventConfig);
    await removeEntityAndIndex(
      eventConfig,
      id,
      events.map((e) => e.id)
    );
  } catch (error) {
    handleError(error, "CleaningService.deleteCleaningEvent", { userMessage: "Failed to delete cleaning event." });
    throw error;
  }
};

export const cleaningService = {
  getCleaningSettings,
  saveCleaningSettings,
  getAllCleaningSettings,
  deleteCleaningForFirearm,
  getCleaningEvents,
  getAllCleaningEvents,
  saveCleaningEvent,
  deleteCleaningEvent,
};
