import {
  partInstallationPeriodSchema,
  partInstanceSchema,
  partSlotSchema,
  PartInstallationPeriod,
  PartInstance,
  PartSlot,
  RangeVisitStorage,
} from "../validation/storageSchemas";
import { AddPartInput, ReplacePartInput } from "../validation/inputSchemas";
import { handleError } from "./error-handler";
import { StorageFactory } from "./storage-factory";
import {
  ENTITY_KEYS,
  partSlotKey,
  partInstanceKey,
  partPeriodKey,
  generateId,
  readEntityCollection,
  validateBeforeSave,
  writeEntity,
  writeEntityAndIndex,
  removeEntityAndIndex,
  CollectionConfig,
} from "./storage-helpers";
import { firearmService } from "./firearm-service";
import { calculatePartStatus, PartLifeResult } from "./parts-life-calculation";

const slotConfig: CollectionConfig<PartSlot> = {
  entityKey: partSlotKey,
  indexKey: ENTITY_KEYS.PART_SLOTS_INDEX,
  legacyKey: ENTITY_KEYS.PART_SLOT,
  schema: partSlotSchema,
};

const instanceConfig: CollectionConfig<PartInstance> = {
  entityKey: partInstanceKey,
  indexKey: ENTITY_KEYS.PART_INSTANCES_INDEX,
  legacyKey: ENTITY_KEYS.PART_INSTANCE,
  schema: partInstanceSchema,
};

const periodConfig: CollectionConfig<PartInstallationPeriod> = {
  entityKey: partPeriodKey,
  indexKey: ENTITY_KEYS.PART_PERIODS_INDEX,
  legacyKey: ENTITY_KEYS.PART_PERIOD,
  schema: partInstallationPeriodSchema,
};

const getPartSlots = async (firearmId: string): Promise<PartSlot[]> => {
  try {
    const all = await readEntityCollection(slotConfig);
    return all.filter((s) => s.firearmId === firearmId);
  } catch (error) {
    handleError(error, "PartsLifeService.getPartSlots", { userMessage: "Failed to load parts." });
    return [];
  }
};

const getAllPartSlots = async (): Promise<PartSlot[]> => {
  try {
    return readEntityCollection(slotConfig);
  } catch (error) {
    handleError(error, "PartsLifeService.getAllPartSlots", { userMessage: "Failed to load parts." });
    return [];
  }
};

const getPartInstances = async (slotId: string): Promise<PartInstance[]> => {
  try {
    const all = await readEntityCollection(instanceConfig);
    return all.filter((i) => i.partSlotId === slotId);
  } catch (error) {
    handleError(error, "PartsLifeService.getPartInstances", { userMessage: "Failed to load part history." });
    return [];
  }
};

const getAllPartInstances = async (): Promise<PartInstance[]> => {
  try {
    return readEntityCollection(instanceConfig);
  } catch (error) {
    handleError(error, "PartsLifeService.getAllPartInstances", { userMessage: "Failed to load part history." });
    return [];
  }
};

const getAllPartPeriods = async (): Promise<PartInstallationPeriod[]> => {
  try {
    return readEntityCollection(periodConfig);
  } catch (error) {
    handleError(error, "PartsLifeService.getAllPartPeriods", { userMessage: "Failed to load installation history." });
    return [];
  }
};

const resolveStartingUsage = async (
  firearmId: string,
  baselineType: PartInstance["baselineType"],
  startingUsageRounds: string
): Promise<number> => {
  if (baselineType === "new" || baselineType === "unknown") return 0;
  if (baselineType === "known_usage") {
    const parsed = Number(startingUsageRounds.trim());
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
  }
  // "original" — same known lifetime as the firearm.
  const firearms = await firearmService.getFirearms();
  return firearms.find((f) => f.id === firearmId)?.roundsFired ?? 0;
};

const addPart = async (input: AddPartInput): Promise<string> => {
  try {
    const now = new Date().toISOString();
    const slotId = generateId("part-slot");
    const instanceId = generateId("part-instance");
    const periodId = generateId("part-period");

    const trackInterval = input.trackInterval;
    const interval = Number(input.serviceIntervalRounds.trim());
    const notify = input.notifyBeforeRounds.trim();

    const slot: PartSlot = {
      id: slotId,
      firearmId: input.firearmId,
      name: input.name,
      serviceIntervalRounds:
        trackInterval && Number.isInteger(interval) && interval >= 1
          ? interval
          : undefined,
      notifyBeforeRounds:
        trackInterval && notify !== ""
          ? Number(notify)
          : undefined,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    const startingUsageRounds = await resolveStartingUsage(
      input.firearmId,
      input.baselineType,
      input.startingUsageRounds
    );

    const instance: PartInstance = {
      id: instanceId,
      partSlotId: slotId,
      startingUsageRounds,
      baselineType: input.baselineType,
      manufacturer: input.manufacturer,
      model: input.model,
      partNumber: input.partNumber,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    const period: PartInstallationPeriod = {
      id: periodId,
      partInstanceId: instanceId,
      firearmId: input.firearmId,
      installedAt: now,
    };

    const validatedSlot = validateBeforeSave(slot, partSlotSchema);
    const validatedInstance = validateBeforeSave(instance, partInstanceSchema);
    const validatedPeriod = validateBeforeSave(period, partInstallationPeriodSchema);

    const slots = await getAllPartSlots();
    const instances = await getAllPartInstances();
    const periods = await getAllPartPeriods();

    await writeEntityAndIndex(slotConfig, validatedSlot, true, slots.map((s) => s.id));
    await writeEntityAndIndex(
      instanceConfig,
      validatedInstance,
      true,
      instances.map((i) => i.id)
    );
    await writeEntityAndIndex(
      periodConfig,
      validatedPeriod,
      true,
      periods.map((p) => p.id)
    );

    return slotId;
  } catch (error) {
    handleError(error, "PartsLifeService.addPart", { userMessage: "Failed to add tracked part." });
    throw error;
  }
};

const getCurrentInstance = async (
  slotId: string
): Promise<PartInstance | null> => {
  const [instances, periods] = await Promise.all([
    getPartInstances(slotId),
    getAllPartPeriods(),
  ]);
  const active = periods.find(
    (p) => p.removedAt === undefined && instances.some((i) => i.id === p.partInstanceId)
  );
  if (!active) return null;
  return instances.find((i) => i.id === active.partInstanceId) ?? null;
};

const replacePart = async (
  slotId: string,
  input: ReplacePartInput
): Promise<void> => {
  try {
    const [instances, allInstances, periods, slots] = await Promise.all([
      getPartInstances(slotId),
      getAllPartInstances(),
      getAllPartPeriods(),
      getAllPartSlots(),
    ]);
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) throw new Error("Part not found");

    const now = new Date().toISOString();
    const replacementAt = input.replacementDate;

    // 1. End the current instance/period.
    const activePeriod = periods.find(
      (p) => p.removedAt === undefined && instances.some((i) => i.id === p.partInstanceId)
    );
    const activeInstance = activePeriod
      ? instances.find((i) => i.id === activePeriod.partInstanceId)
      : undefined;

    if (activePeriod) {
      await writeEntity(periodConfig, {
        ...activePeriod,
        removedAt: replacementAt,
      });
    }
    if (activeInstance) {
      await writeEntity(instanceConfig, {
        ...activeInstance,
        replacementReason: input.reason,
        updatedAt: now,
      });
    }

    // 2. Create a new instance + period.
    const newInstanceId = generateId("part-instance");
    const startingUsageRounds = await resolveStartingUsage(
      slot.firearmId,
      input.baselineType,
      input.startingUsageRounds
    );

    const newInstance: PartInstance = {
      id: newInstanceId,
      partSlotId: slotId,
      startingUsageRounds,
      baselineType: input.baselineType,
      manufacturer: input.manufacturer,
      model: input.model,
      partNumber: input.partNumber,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    const newPeriod: PartInstallationPeriod = {
      id: generateId("part-period"),
      partInstanceId: newInstanceId,
      firearmId: slot.firearmId,
      installedAt: replacementAt,
    };

    await writeEntityAndIndex(instanceConfig, validateBeforeSave(newInstance, partInstanceSchema), true, allInstances.map((i) => i.id));
    await writeEntityAndIndex(periodConfig, validateBeforeSave(newPeriod, partInstallationPeriodSchema), true, periods.map((p) => p.id));
  } catch (error) {
    handleError(error, "PartsLifeService.replacePart", { userMessage: "Failed to replace part." });
    throw error;
  }
};

const removeInstalledPart = async (slotId: string): Promise<void> => {
  try {
    const [instances, periods] = await Promise.all([
      getPartInstances(slotId),
      getAllPartPeriods(),
    ]);
    const activePeriod = periods.find(
      (p) => p.removedAt === undefined && instances.some((i) => i.id === p.partInstanceId)
    );
    if (!activePeriod) return;
    await writeEntity(periodConfig, {
      ...activePeriod,
      removedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleError(error, "PartsLifeService.removeInstalledPart", { userMessage: "Failed to remove part." });
    throw error;
  }
};

const reinstallPart = async (
  slotId: string,
  instanceId: string,
  installedAt: string
): Promise<void> => {
  try {
    const [instances, periods, slots] = await Promise.all([
      getPartInstances(slotId),
      getAllPartPeriods(),
      getAllPartSlots(),
    ]);
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) throw new Error("Part not found");
    if (!instances.some((i) => i.id === instanceId)) {
      throw new Error("Part instance not found");
    }

    // End any current active period for this slot.
    const activePeriod = periods.find(
      (p) => p.removedAt === undefined && instances.some((i) => i.id === p.partInstanceId)
    );
    if (activePeriod) {
      await writeEntity(periodConfig, {
        ...activePeriod,
        removedAt: installedAt,
      });
    }

    const newPeriod: PartInstallationPeriod = {
      id: generateId("part-period"),
      partInstanceId: instanceId,
      firearmId: slot.firearmId,
      installedAt,
    };
    await writeEntityAndIndex(
      periodConfig,
      validateBeforeSave(newPeriod, partInstallationPeriodSchema),
      true,
      periods.map((p) => p.id)
    );
  } catch (error) {
    handleError(error, "PartsLifeService.reinstallPart", { userMessage: "Failed to reinstall part." });
    throw error;
  }
};

const removePartSlot = async (slotId: string): Promise<void> => {
  try {
    const [slots, instances, periods] = await Promise.all([
      getAllPartSlots(),
      getAllPartInstances(),
      getAllPartPeriods(),
    ]);
    const slotInstances = instances.filter((i) => i.partSlotId === slotId);
    const instanceIds = new Set(slotInstances.map((i) => i.id));
    const slotPeriods = periods.filter((p) => instanceIds.has(p.partInstanceId));

    const nextSlots = slots.filter((s) => s.id !== slotId);
    const nextInstances = instances.filter((i) => i.partSlotId !== slotId);
    const nextPeriods = periods.filter((p) => !instanceIds.has(p.partInstanceId));

    const storage = StorageFactory.getStorage();
    await Promise.all([
      ...nextSlots.map((s) => storage.setItem(partSlotKey(s.id), JSON.stringify(s))),
      ...slotInstances.map((i) => storage.removeItem(partInstanceKey(i.id))),
      ...slotPeriods.map((p) => storage.removeItem(partPeriodKey(p.id))),
    ]);
    await storage.setItem(
      ENTITY_KEYS.PART_SLOTS_INDEX,
      JSON.stringify(nextSlots.map((s) => s.id))
    );
    await storage.setItem(
      ENTITY_KEYS.PART_INSTANCES_INDEX,
      JSON.stringify(nextInstances.map((i) => i.id))
    );
    await storage.setItem(
      ENTITY_KEYS.PART_PERIODS_INDEX,
      JSON.stringify(nextPeriods.map((p) => p.id))
    );
  } catch (error) {
    handleError(error, "PartsLifeService.removePartSlot", { userMessage: "Failed to delete tracked part." });
    throw error;
  }
};

const deletePartsForFirearm = async (firearmId: string): Promise<void> => {
  try {
    const slots = await getPartSlots(firearmId);
    for (const slot of slots) {
      await removePartSlot(slot.id);
    }
  } catch (error) {
    handleError(error, "PartsLifeService.deletePartsForFirearm", { userMessage: "Failed to delete parts." });
    throw error;
  }
};

const getPartStatus = async (
  slot: PartSlot,
  rangeVisits: RangeVisitStorage[]
): Promise<PartLifeResult> => {
  const currentInstance = await getCurrentInstance(slot.id);
  const periods = await getAllPartPeriods();
  return calculatePartStatus(slot, currentInstance, periods, rangeVisits);
};

const getFirearmPartsStatus = async (
  firearmId: string,
  rangeVisits: RangeVisitStorage[]
): Promise<PartLifeResult[]> => {
  const slots = await getPartSlots(firearmId);
  const periods = await getAllPartPeriods();
  const results: PartLifeResult[] = [];
  for (const slot of slots) {
    const currentInstance = await getCurrentInstance(slot.id);
    results.push(calculatePartStatus(slot, currentInstance, periods, rangeVisits));
  }
  return results;
};

export const partsLifeService = {
  getPartSlots,
  getAllPartSlots,
  getPartInstances,
  getAllPartInstances,
  getAllPartPeriods,
  addPart,
  getCurrentInstance,
  replacePart,
  removeInstalledPart,
  reinstallPart,
  removePartSlot,
  deletePartsForFirearm,
  getPartStatus,
  getFirearmPartsStatus,
};
