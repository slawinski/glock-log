import {
  accessoryUsageSchema,
  AccessoryStorage,
  RangeVisitStorage,
  rangeVisitStorageSchema,
} from "../validation/storageSchemas";
import { handleError } from "./error-handler";
import { accessoryService } from "./accessory-service";
import { rangeVisitService } from "./range-visit-service";
import { roundsForFirearm } from "./round-usage";
import { findReconciliation } from "./accessory-reconciliation";
import {
  ENTITY_KEYS,
  rangeVisitKey,
  writeEntity,
  CollectionConfig,
} from "./storage-helpers";

/**
 * Applies accessory-usage backfill/conflict decisions by mutating the
 * range-visit records that are the source of truth. Never persists a separate
 * accessory counter.
 */

export type BackfillDecision =
  | { visitId: string; firearmId: string; action: "add_full_visit" }
  | { visitId: string; firearmId: string; action: "add_manual"; rounds: number }
  | { visitId: string; firearmId: string; action: "ignore" };

export type UsageConflictDecision =
  | { visitId: string; accessoryId: string; firearmId: string; action: "keep" }
  | { visitId: string; accessoryId: string; firearmId: string; action: "remove" };

const visitConfig: CollectionConfig<RangeVisitStorage> = {
  entityKey: rangeVisitKey,
  indexKey: ENTITY_KEYS.RANGE_VISITS_INDEX,
  legacyKey: ENTITY_KEYS.RANGE_VISIT,
  schema: rangeVisitStorageSchema,
};

const hasUsage = (
  visit: RangeVisitStorage,
  accessoryId: string,
  firearmId: string
): boolean =>
  (visit.accessoryUsage ?? []).some(
    (u) => u.accessoryId === accessoryId && u.firearmId === firearmId
  );

const findReconciliationForAccessory = async (
  accessoryId: string
): Promise<{
  accessory: AccessoryStorage;
  visits: RangeVisitStorage[];
}> => {
  const accessory = await accessoryService.getAccessory(accessoryId);
  if (!accessory) throw new Error("Accessory not found");
  const visits = await rangeVisitService.getRangeVisits();
  return { accessory, visits };
};

/** Build a full AccessoryUsage record for a visit/firearm pair. */
const buildUsage = (
  accessory: AccessoryStorage,
  firearmId: string,
  rounds: number,
  mode: "full_visit" | "manual",
  attribution: "historical_backfill" | "manual_edit"
) =>
  accessoryUsageSchema.parse({
    accessoryId: accessory.id,
    firearmId,
    accessoryNameSnapshot: accessory.modelName,
    categorySnapshot: accessory.category,
    rounds,
    mode,
    attribution,
  });

export const applyBackfill = async (
  accessoryId: string,
  decisions: BackfillDecision[]
): Promise<void> => {
  try {
    const { accessory, visits } = await findReconciliationForAccessory(
      accessoryId
    );
    const visitMap = new Map(visits.map((v) => [v.id, v]));
    const dirty = new Set<string>();

    for (const decision of decisions) {
      if (decision.action === "ignore") continue;
      const visit = visitMap.get(decision.visitId);
      if (!visit) throw new Error(`Visit not found: ${decision.visitId}`);
      if (hasUsage(visit, accessoryId, decision.firearmId)) continue; // idempotent

      const firearmRounds = roundsForFirearm(visit, decision.firearmId);
      let rounds: number;
      let mode: "full_visit" | "manual";
      if (decision.action === "add_full_visit") {
        rounds = firearmRounds;
        mode = "full_visit";
      } else {
        rounds = decision.rounds;
        mode = "manual";
      }
      if (rounds < 1 || rounds > firearmRounds) {
        throw new Error("Invalid accessory round count");
      }

      const usage = buildUsage(
        accessory,
        decision.firearmId,
        rounds,
        mode,
        "historical_backfill"
      );
      visitMap.set(decision.visitId, {
        ...visit,
        accessoryUsage: [...(visit.accessoryUsage ?? []), usage],
        updatedAt: new Date().toISOString(),
      });
      dirty.add(decision.visitId);
    }

    await persistDirtyVisits(visitMap, dirty);
  } catch (error) {
    handleError(error, "AccessoryUsageService.applyBackfill", { userMessage: "Failed to reconcile historical usage." });
    throw error;
  }
};

export const resolveConflicts = async (
  accessoryId: string,
  decisions: UsageConflictDecision[]
): Promise<void> => {
  try {
    const { visits } = await findReconciliationForAccessory(accessoryId);
    const visitMap = new Map(visits.map((v) => [v.id, v]));
    const dirty = new Set<string>();

    for (const decision of decisions) {
      if (decision.action === "keep") continue;
      const visit = visitMap.get(decision.visitId);
      if (!visit) continue;
      const accessoryUsage = (visit.accessoryUsage ?? []).filter(
        (u) =>
          !(u.accessoryId === decision.accessoryId && u.firearmId === decision.firearmId)
      );
      visitMap.set(decision.visitId, {
        ...visit,
        accessoryUsage,
        updatedAt: new Date().toISOString(),
      });
      dirty.add(decision.visitId);
    }

    await persistDirtyVisits(visitMap, dirty);
  } catch (error) {
    handleError(error, "AccessoryUsageService.resolveConflicts", { userMessage: "Failed to resolve usage conflicts." });
    throw error;
  }
};

const persistDirtyVisits = async (
  visitMap: Map<string, RangeVisitStorage>,
  dirty: Set<string>
): Promise<void> => {
  for (const id of dirty) {
    const visit = visitMap.get(id);
    if (visit) await writeEntity(visitConfig, visit);
  }
};

export { findReconciliation };
export type { AccessoryStorage };

export const accessoryUsageService = {
  findReconciliation,
  applyBackfill,
  resolveConflicts,
};
