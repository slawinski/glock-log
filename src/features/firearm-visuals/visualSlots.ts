import { AccessoryCategory } from "../../validation/storageSchemas";
import { FirearmVisualSlot } from "./types";

export const FIREARM_VISUAL_SLOTS = {
  PRIMARY_OPTIC: "primary_optic",
  OPTIC_AUXILIARY: "optic_auxiliary",
  MUZZLE: "muzzle",
  UNDERBARREL: "underbarrel",
  SIDE_RAIL: "side_rail",
  SUPPORT: "support",
  OTHER: "other",
} as const;

/**
 * Default physical slot for each accessory category. Accessories in different
 * slots compose; accessories in the same slot are mutually exclusive visually
 * (the most-recently-mounted one wins).
 */
export const DEFAULT_CATEGORY_VISUAL_SLOT: Record<
  AccessoryCategory,
  FirearmVisualSlot
> = {
  red_dot: "primary_optic",
  scope: "primary_optic",
  magnifier: "optic_auxiliary",
  iron_sights: "primary_optic",
  flashlight: "side_rail",
  laser: "side_rail",
  suppressor: "muzzle",
  bipod: "support",
  grip: "underbarrel",
  stock_brace: "other",
  sling: "other",
  mount_adapter: "other",
  other: "other",
};
