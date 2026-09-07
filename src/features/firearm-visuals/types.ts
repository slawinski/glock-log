import {
  AccessoryCategory,
  FirearmType,
} from "../../validation/storageSchemas";

/**
 * Physical mounting position of an accessory on a firearm. Used to decide
 * which mounted accessories can compose visually: accessories on different
 * slots render together, while two accessories on the same slot resolve to a
 * single (most-recently-mounted) winner.
 */
export type FirearmVisualSlot =
  | "primary_optic"
  | "optic_auxiliary"
  | "muzzle"
  | "underbarrel"
  | "side_rail"
  | "support"
  | "other";

/**
 * A single layer of generated artwork: the static asset plus where it sits
 * physically (slot) and how it stacks (zIndex). `source` is the result of a
 * static `require()`, never a dynamically-constructed path.
 */
export type FirearmVisualLayerAsset = {
  source: number;
  visualSlot: FirearmVisualSlot;
  zIndex: number;
};

/**
 * Per-firearm-type visual profile: the base silhouette and the supported
 * accessory layers. A missing category simply means "no artwork yet" — it
 * never affects domain behavior.
 */
export type FirearmVisualProfile = {
  base: number;
  layers: Partial<Record<AccessoryCategory, FirearmVisualLayerAsset>>;
};

export type FirearmVisualAssetManifest = Record<
  FirearmType,
  FirearmVisualProfile
>;

/**
 * The minimal accessory facts the resolver needs. Derived from mount history;
 * never persisted.
 */
export type MountedAccessoryVisual = {
  id: string;
  category: AccessoryCategory;
  mountedAt: string;
};

/**
 * Pure input to the visual resolver: the firearm type plus the accessories
 * currently (or historically) mounted on it.
 */
export type FirearmVisualState = {
  firearmType: FirearmType;
  accessories: MountedAccessoryVisual[];
};

export type ResolvedFirearmVisualLayer = {
  key: string;
  source: number;
  visualSlot: FirearmVisualSlot;
  zIndex: number;
  accessoryId: string;
};

export type ResolvedFirearmVisual = {
  firearmType: FirearmType;
  base: number;
  layers: ResolvedFirearmVisualLayer[];
};
