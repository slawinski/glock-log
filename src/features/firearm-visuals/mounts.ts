import {
  AccessoryMountSession,
  AccessoryStorage,
} from "../../validation/storageSchemas";
import { MountedAccessoryVisual } from "./types";

const getTime = (iso: string): number => new Date(iso).getTime();

const covers = (mount: AccessoryMountSession, at: number): boolean => {
  if (getTime(mount.mountedAt) > at) return false;
  if (mount.unmountedAt && at >= getTime(mount.unmountedAt)) return false;
  return true;
};

/**
 * The mount session covering `atDate` for `accessory`, preferring the
 * most-recently-started one when data contains overlapping sessions.
 */
const coveringMount = (
  accessory: AccessoryStorage,
  at: number
): AccessoryMountSession | null => {
  let best: AccessoryMountSession | null = null;
  for (const mount of accessory.mountHistory) {
    if (!covers(mount, at)) continue;
    if (!best || getTime(mount.mountedAt) > getTime(best.mountedAt)) {
      best = mount;
    }
  }
  return best;
};

/**
 * Canonical mount-state selector (spec §23): every accessory whose mount
 * history places it on `firearmId` at `atDate`.
 */
export const getMountedAccessoriesForFirearmAt = (
  accessories: AccessoryStorage[],
  firearmId: string,
  atDate: string
): AccessoryStorage[] => {
  const at = getTime(atDate);
  return accessories.filter((accessory) => {
    const mount = coveringMount(accessory, at);
    return mount !== null && mount.firearmId === firearmId;
  });
};

/**
 * Derives the current mounted accessories grouped by firearm id, in a single
 * pass over the accessory collection (spec §26). Avoids per-row queries on
 * list screens.
 */
export const deriveCurrentMounts = (
  accessories: AccessoryStorage[],
  atDate: string = new Date().toISOString()
): Map<string, AccessoryStorage[]> => {
  const at = getTime(atDate);
  const map = new Map<string, AccessoryStorage[]>();
  for (const accessory of accessories) {
    const mount = coveringMount(accessory, at);
    if (!mount) continue;
    const list = map.get(mount.firearmId) ?? [];
    list.push(accessory);
    map.set(mount.firearmId, list);
  }
  return map;
};

/**
 * Converts mounted accessory records into the minimal visual facts the
 * resolver consumes, carrying the effective `mountedAt` for the interval
 * (used for deterministic slot-conflict resolution).
 */
export const toMountedAccessoryVisuals = (
  accessories: AccessoryStorage[],
  firearmId: string,
  atDate: string
): MountedAccessoryVisual[] => {
  const at = getTime(atDate);
  const result: MountedAccessoryVisual[] = [];
  for (const accessory of accessories) {
    const mount = coveringMount(accessory, at);
    if (!mount || mount.firearmId !== firearmId) continue;
    result.push({
      id: accessory.id,
      category: accessory.category,
      mountedAt: mount.mountedAt,
    });
  }
  return result;
};

/**
 * Converts an already-filtered list of currently-mounted accessories into
 * visual facts, using each accessory's active mount as the `mountedAt` source.
 */
export const toCurrentMountedAccessoryVisuals = (
  accessories: AccessoryStorage[]
): MountedAccessoryVisual[] => {
  const at = Date.now();
  const result: MountedAccessoryVisual[] = [];
  for (const accessory of accessories) {
    const mount = coveringMount(accessory, at);
    if (!mount) continue;
    result.push({
      id: accessory.id,
      category: accessory.category,
      mountedAt: mount.mountedAt,
    });
  }
  return result;
};
