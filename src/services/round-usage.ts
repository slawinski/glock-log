import { RangeVisitStorage } from "../validation/storageSchemas";

/**
 * Rounds fired by a single firearm during a range visit.
 *
 * This is the canonical round source shared by cleaning tracking, parts life,
 * and accessory exposure. Visit-level total rounds must never be applied
 * blindly to a firearm: only the per-firearm `ammunitionUsed` entry counts.
 */
export const roundsForFirearm = (
  visit: RangeVisitStorage,
  firearmId: string
): number => visit.ammunitionUsed?.[firearmId]?.rounds ?? 0;
