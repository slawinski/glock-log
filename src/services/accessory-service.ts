import {
  accessoryStorageSchema,
  AccessoryCategory,
  AccessoryMountSession,
  AccessoryStorage,
  AccessoryUsage,
  RangeVisitStorage,
} from "../validation/storageSchemas";
import { AccessoryInput } from "../validation/inputSchemas";
import { handleError } from "./error-handler";
import {
  ENTITY_KEYS,
  accessoryKey,
  generateId,
  readEntityCollection,
  validateBeforeSave,
  writeEntity,
  writeEntityAndIndex,
  removeEntityAndIndex,
  CollectionConfig,
} from "./storage-helpers";
import { firearmService } from "./firearm-service";
import { rangeVisitService } from "./range-visit-service";
import { effectivePlaceholderKey, basePlaceholderKeyFor } from "./firearm-placeholder";
import {
  saveImageToFileSystem,
  storeImagePaths,
  deleteImages,
} from "./image-storage";

const accessoryConfig: CollectionConfig<AccessoryStorage> = {
  entityKey: accessoryKey,
  indexKey: ENTITY_KEYS.ACCESSORIES_INDEX,
  legacyKey: ENTITY_KEYS.ACCESSORY,
  schema: accessoryStorageSchema,
};

export const getCurrentMount = (
  accessory: AccessoryStorage
): AccessoryMountSession | null =>
  accessory.mountHistory.find((m) => m.unmountedAt === undefined) ?? null;

const isVariantKey = (key: string): boolean =>
  basePlaceholderKeyFor(key) !== key;

/**
 * Re-syncs a firearm's placeholder thumbnail against the accessory categories
 * currently mounted on it (e.g. swaps a pistol placeholder for the red-dot
 * variant while a red dot is mounted, and back when it is removed).
 *
 * Best-effort: a placeholder-sync failure never fails the mount operation that
 * triggered it.
 */
const syncFirearmPlaceholder = async (firearmId: string): Promise<void> => {
  try {
    const accessories = await getAccessories();
    const mountedCategories = Array.from(
      new Set(
        accessories
          .filter(
            (a) => a.status === "active" && getCurrentMount(a)?.firearmId === firearmId
          )
          .map((a) => a.category)
      )
    );

    const firearms = await firearmService.getFirearms();
    const firearm = firearms.find((f) => f.id === firearmId);
    if (!firearm) return;

    const current = firearm.photos?.[0];
    const effective = effectivePlaceholderKey(current, mountedCategories);
    if (effective === null) return;

    const target = `placeholder:${effective}`;
    if (current === target) return;
    // Don't materialize a plain base placeholder onto a photo-less firearm
    // unless we're actually applying a variant.
    if (!isVariantKey(effective) && current === undefined) return;

    const photos = firearm.photos ? [...firearm.photos] : [];
    if (photos.length === 0) {
      photos.push(target);
    } else {
      photos[0] = target;
    }
    await firearmService.setFirearmPhotos(firearmId, photos);
  } catch (error) {
    handleError(error, "AccessoryService.syncFirearmPlaceholder", { userMessage: "Failed to sync firearm placeholder." });
  }
};

const getAccessories = async (): Promise<AccessoryStorage[]> => {
  try {
    return readEntityCollection(accessoryConfig);
  } catch (error) {
    handleError(error, "AccessoryService.getAccessories", { userMessage: "Failed to load accessories." });
    return [];
  }
};

const getAccessory = async (id: string): Promise<AccessoryStorage | null> => {
  try {
    const all = await readEntityCollection(accessoryConfig);
    return all.find((a) => a.id === id) ?? null;
  } catch (error) {
    handleError(error, "AccessoryService.getAccessory", { userMessage: "Failed to load accessory." });
    return null;
  }
};

const saveAccessory = async (
  input: AccessoryInput,
  mount?: { firearmId: string; mountedAt: string }
): Promise<string> => {
  try {
    const accessories = await getAccessories();
    const isUpdate = !!input.id;
    const id = input.id || generateId("accessory");
    const existing = isUpdate ? accessories.find((a) => a.id === id) : undefined;

    let savedImagePaths: string[] = [];
    if (input.photos && input.photos.length > 0) {
      const realUris = input.photos.filter((p) => !p.startsWith("placeholder:"));
      const placeholders = input.photos.filter((p) => p.startsWith("placeholder:"));
      const newPaths = await Promise.all(
        realUris.map((uri) => saveImageToFileSystem(uri, "accessory", id))
      );
      savedImagePaths = [...newPaths, ...placeholders];
      await storeImagePaths("accessory", id, savedImagePaths);
    }

    const now = new Date().toISOString();
    let mountHistory = existing?.mountHistory ?? [];

    if (mount && mount.firearmId) {
      const firearmNameSnapshot = await resolveFirearmName(mount.firearmId);
      const session: AccessoryMountSession = {
        id: generateId("mount"),
        firearmId: mount.firearmId,
        firearmNameSnapshot,
        mountedAt: mount.mountedAt,
        createdAt: now,
        updatedAt: now,
      };
      mountHistory = [...mountHistory, session];
    }

    const accessory: AccessoryStorage = {
      id,
      category: input.category,
      manufacturer: input.manufacturer,
      modelName: input.modelName,
      serialNumber: input.serialNumber,
      datePurchased: input.datePurchased ?? existing?.datePurchased,
      amountPaid: input.amountPaid ?? existing?.amountPaid,
      initialRounds: input.initialRounds,
      photos:
        savedImagePaths.length > 0 ? savedImagePaths : existing?.photos ?? [],
      notes: input.notes,
      status: existing?.status ?? "active",
      mountHistory,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    const validated = validateBeforeSave(accessory, accessoryStorageSchema);
    const isNew = accessories.findIndex((a) => a.id === validated.id) === -1;
    await writeEntityAndIndex(
      accessoryConfig,
      validated,
      isNew,
      accessories.map((a) => a.id)
    );
    return id;
  } catch (error) {
    handleError(error, "AccessoryService.saveAccessory", { userMessage: "Failed to save accessory." });
    throw error;
  }
};

const resolveFirearmName = async (firearmId: string): Promise<string> => {
  const firearms = await firearmService.getFirearms();
  return firearms.find((f) => f.id === firearmId)?.modelName ?? firearmId;
};

const archiveAccessory = async (id: string): Promise<void> => {
  try {
    const accessory = await getAccessory(id);
    if (!accessory) throw new Error("Accessory not found");
    const now = new Date().toISOString();
    const activeFirearmId = getCurrentMount(accessory)?.firearmId;
    const mountHistory = accessory.mountHistory.map((m) =>
      m.unmountedAt === undefined
        ? { ...m, unmountedAt: now, reasonEnded: "accessory_archived" as const }
        : m
    );
    await writeEntity(accessoryConfig, {
      ...accessory,
      status: "archived",
      mountHistory,
      updatedAt: now,
    });
    if (activeFirearmId) await syncFirearmPlaceholder(activeFirearmId);
  } catch (error) {
    handleError(error, "AccessoryService.archiveAccessory", { userMessage: "Failed to archive accessory." });
    throw error;
  }
};

const restoreAccessory = async (id: string): Promise<void> => {
  try {
    const accessory = await getAccessory(id);
    if (!accessory) throw new Error("Accessory not found");
    await writeEntity(accessoryConfig, {
      ...accessory,
      status: "active",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleError(error, "AccessoryService.restoreAccessory", { userMessage: "Failed to restore accessory." });
    throw error;
  }
};

const deleteAccessory = async (id: string): Promise<void> => {
  try {
    const [accessory, visits] = await Promise.all([
      getAccessory(id),
      rangeVisitService.getRangeVisits(),
    ]);
    if (!accessory) throw new Error("Accessory not found");

    const hasUsage = visits.some((v) =>
      (v.accessoryUsage ?? []).some((u) => u.accessoryId === id)
    );
    if (hasUsage || accessory.mountHistory.length > 0) {
      throw new Error("ACCESSORY_HAS_HISTORY");
    }

    await deleteImages("accessory", id);
    const accessories = await getAccessories();
    await removeEntityAndIndex(
      accessoryConfig,
      id,
      accessories.map((a) => a.id)
    );
  } catch (error) {
    if (error instanceof Error && error.message === "ACCESSORY_HAS_HISTORY") {
      throw error;
    }
    handleError(error, "AccessoryService.deleteAccessory", { userMessage: "Failed to delete accessory." });
    throw error;
  }
};

const mountAccessory = async (
  accessoryId: string,
  firearmId: string,
  mountedAt: string
): Promise<void> => {
  try {
    const accessory = await getAccessory(accessoryId);
    if (!accessory) throw new Error("Accessory not found");
    if (getCurrentMount(accessory)) {
      throw new Error("ACCESSORY_ALREADY_MOUNTED");
    }
    const now = new Date().toISOString();
    const session: AccessoryMountSession = {
      id: generateId("mount"),
      firearmId,
      firearmNameSnapshot: await resolveFirearmName(firearmId),
      mountedAt,
      createdAt: now,
      updatedAt: now,
    };
    await writeEntity(accessoryConfig, {
      ...accessory,
      mountHistory: [...accessory.mountHistory, session],
      updatedAt: now,
    });
    await syncFirearmPlaceholder(firearmId);
  } catch (error) {
    if (error instanceof Error && error.message === "ACCESSORY_ALREADY_MOUNTED") {
      throw error;
    }
    handleError(error, "AccessoryService.mountAccessory", { userMessage: "Failed to mount accessory." });
    throw error;
  }
};

const unmountAccessory = async (
  accessoryId: string,
  unmountedAt: string
): Promise<void> => {
  try {
    const accessory = await getAccessory(accessoryId);
    if (!accessory) throw new Error("Accessory not found");
    const active = getCurrentMount(accessory);
    if (!active) return;
    const firearmId = active.firearmId;
    const mountHistory = accessory.mountHistory.map((m) =>
      m.id === active.id
        ? { ...m, unmountedAt, reasonEnded: "unmounted" as const }
        : m
    );
    await writeEntity(accessoryConfig, {
      ...accessory,
      mountHistory,
      updatedAt: new Date().toISOString(),
    });
    await syncFirearmPlaceholder(firearmId);
  } catch (error) {
    handleError(error, "AccessoryService.unmountAccessory", { userMessage: "Failed to unmount accessory." });
    throw error;
  }
};

const moveAccessory = async (
  accessoryId: string,
  newFirearmId: string,
  movedAt: string
): Promise<void> => {
  try {
    const accessory = await getAccessory(accessoryId);
    if (!accessory) throw new Error("Accessory not found");
    const active = getCurrentMount(accessory);
    const sourceFirearmId = active?.firearmId;
    const now = new Date().toISOString();
    const mountHistory = active
      ? accessory.mountHistory.map((m) =>
          m.id === active.id
            ? { ...m, unmountedAt: movedAt, reasonEnded: "moved" as const }
            : m
        )
      : accessory.mountHistory;

    const session: AccessoryMountSession = {
      id: generateId("mount"),
      firearmId: newFirearmId,
      firearmNameSnapshot: await resolveFirearmName(newFirearmId),
      mountedAt: movedAt,
      createdAt: now,
      updatedAt: now,
    };

    await writeEntity(accessoryConfig, {
      ...accessory,
      mountHistory: [...mountHistory, session],
      updatedAt: now,
    });
    if (sourceFirearmId) await syncFirearmPlaceholder(sourceFirearmId);
    await syncFirearmPlaceholder(newFirearmId);
  } catch (error) {
    handleError(error, "AccessoryService.moveAccessory", { userMessage: "Failed to move accessory." });
    throw error;
  }
};

const getAccessoriesMountedOnFirearm = async (
  firearmId: string,
  atDate?: string
): Promise<AccessoryStorage[]> => {
  const accessories = await getAccessories();
  return accessories.filter((a) => {
    const mount = getCurrentMount(a);
    if (!mount || mount.firearmId !== firearmId) return false;
    if (!atDate) return true;
    return new Date(mount.mountedAt).getTime() <= new Date(atDate).getTime();
  });
};

const handleFirearmDeletion = async (firearmId: string): Promise<void> => {
  try {
    const accessories = await getAccessories();
    const now = new Date().toISOString();
    for (const accessory of accessories) {
      const active = getCurrentMount(accessory);
      if (active && active.firearmId === firearmId) {
        const mountHistory = accessory.mountHistory.map((m) =>
          m.id === active.id
            ? { ...m, unmountedAt: now, reasonEnded: "firearm_deleted" as const }
            : m
        );
        await writeEntity(accessoryConfig, {
          ...accessory,
          mountHistory,
          updatedAt: now,
        });
      }
    }
  } catch (error) {
    handleError(error, "AccessoryService.handleFirearmDeletion", { userMessage: "Failed to update mounted accessories." });
    throw error;
  }
};

export type AccessoryUsageStats = {
  totalExposure: number;
  trackedExposure: number;
  usageByFirearm: { firearmId: string; rounds: number }[];
  recentActivity: {
    visitId: string;
    visitDate: string;
    firearmId: string;
    rounds: number;
  }[];
};

/** Pure derived stats — never a persisted counter. */
export const computeAccessoryStats = (
  accessory: AccessoryStorage,
  rangeVisits: RangeVisitStorage[]
): AccessoryUsageStats => {
  const byFirearm = new Map<string, number>();
  const recent: AccessoryUsageStats["recentActivity"] = [];

  for (const visit of rangeVisits) {
    const usages = (visit.accessoryUsage ?? []).filter(
      (u) => u.accessoryId === accessory.id
    );
    for (const usage of usages) {
      byFirearm.set(
        usage.firearmId,
        (byFirearm.get(usage.firearmId) ?? 0) + usage.rounds
      );
      recent.push({
        visitId: visit.id,
        visitDate: visit.date,
        firearmId: usage.firearmId,
        rounds: usage.rounds,
      });
    }
  }

  recent.sort(
    (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
  );

  const trackedExposure = [...byFirearm.values()].reduce(
    (sum, rounds) => sum + rounds,
    0
  );

  return {
    totalExposure: accessory.initialRounds + trackedExposure,
    trackedExposure,
    usageByFirearm: [...byFirearm.entries()].map(([firearmId, rounds]) => ({
      firearmId,
      rounds,
    })),
    recentActivity: recent,
  };
};

/**
 * Build the full-visit accessory usage that should be auto-included for a new
 * range visit: every currently-mounted accessory for each used firearm gains
 * the firearm's visit rounds. The user does not need to configure normal
 * full-visit usage manually (custom/partial usage is handled in review).
 */
export const buildAutoAccessoryUsage = (
  accessories: AccessoryStorage[],
  firearmsUsed: string[],
  roundsByFirearm: Record<string, number>
): AccessoryUsage[] => {
  const result: AccessoryUsage[] = [];
  for (const firearmId of firearmsUsed) {
    const rounds = roundsByFirearm[firearmId] ?? 0;
    if (rounds <= 0) continue;
    for (const accessory of accessories) {
      const mount = getCurrentMount(accessory);
      if (mount && mount.firearmId === firearmId) {
        result.push({
          accessoryId: accessory.id,
          firearmId,
          accessoryNameSnapshot: accessory.modelName,
          categorySnapshot: accessory.category,
          rounds,
          mode: "full_visit",
          attribution: "visit_entry",
        });
      }
    }
  }
  return result;
};

export const accessoryService = {
  getAccessories,
  getAccessory,
  saveAccessory,
  archiveAccessory,
  restoreAccessory,
  deleteAccessory,
  mountAccessory,
  unmountAccessory,
  moveAccessory,
  getAccessoriesMountedOnFirearm,
  handleFirearmDeletion,
  getCurrentMount,
};

export type { AccessoryCategory, AccessoryUsage };
