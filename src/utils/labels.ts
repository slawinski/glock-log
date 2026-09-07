import {
  AccessoryCategory,
  CleaningType,
  PartBaselineType,
  PartReplacementReason,
} from "../validation/storageSchemas";
import { CleaningIntervalStatus } from "../services/cleaning-calculation";
import { PartStatus } from "../services/parts-life-calculation";

export const ACCESSORY_CATEGORY_LABELS: Record<AccessoryCategory, string> = {
  red_dot: "Red dot",
  scope: "Scope",
  magnifier: "Magnifier",
  iron_sights: "Iron sights",
  flashlight: "Flashlight",
  laser: "Laser",
  suppressor: "Suppressor",
  bipod: "Bipod",
  grip: "Grip",
  stock_brace: "Stock / brace",
  sling: "Sling",
  mount_adapter: "Mount / adapter",
  other: "Other",
};

export const CLEANING_TYPE_LABELS: Record<CleaningType, string> = {
  field_strip: "Field strip",
  complete_disassembly: "Complete disassembly",
};

export const CLEANING_STATUS_LABELS: Record<CleaningIntervalStatus, string> = {
  not_configured: "NOT CONFIGURED",
  not_initialized: "NOT INITIALIZED",
  ok: "OK",
  due_soon: "DUE SOON",
  due: "DUE",
};

export const PART_STATUS_LABELS: Record<PartStatus, string> = {
  not_tracked: "NOT TRACKED",
  no_part_installed: "NO PART INSTALLED",
  baseline_unknown: "USAGE UNKNOWN",
  no_interval: "NO INTERVAL",
  ok: "OK",
  due_soon: "DUE SOON",
  due: "DUE",
};

export const PART_BASELINE_LABELS: Record<PartBaselineType, string> = {
  new: "New — 0 rounds",
  original: "Original firearm part",
  known_usage: "Known current usage",
  unknown: "Previous usage unknown",
};

export const REPLACEMENT_REASON_LABELS: Record<PartReplacementReason, string> = {
  scheduled: "Scheduled / preventive",
  failure: "Failure",
  wear: "Wear found during inspection",
  damage: "Damage",
  upgrade: "Upgrade",
  unknown: "Unknown",
  other: "Other",
};
