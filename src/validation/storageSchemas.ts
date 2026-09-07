import { z } from "zod";

/**
 * Whether a firearm belongs to the user ("mine") or was used without owning it
 * ("borrowed"). Borrowed firearms track guns the user has shot but doesn't own.
 */
export const firearmOwnershipSchema = z.enum(["mine", "borrowed"]);
export type FirearmOwnership = z.infer<typeof firearmOwnershipSchema>;

/**
 * Physical archetype of a firearm. Distinct from accessory "category": this
 * describes what the gun itself is, and drives the generated loadout artwork
 * (the base silhouette plus any mounted-accessory layers).
 */
export const firearmTypeSchema = z.enum([
  "pistol",
  "revolver",
  "pcc",
  "rifle",
  "bolt_action_rifle",
  "shotgun",
  "other",
]);
export type FirearmType = z.infer<typeof firearmTypeSchema>;

export const firearmStorageSchema = z.object({
  id: z.string(),
  modelName: z.string(),
  caliber: z.string(),
  datePurchased: z.string().datetime(),
  amountPaid: z.number(),
  // Optional for backward compatibility: records saved before the ownership
  // field existed omit it, and an absent value is treated as "mine".
  ownership: firearmOwnershipSchema.optional(),
  // Optional for backward compatibility: records saved before the visual
  // loadout system existed omit it. Reads normalize an absent value via
  // legacy placeholder inference, falling back to "other".
  firearmType: firearmTypeSchema.optional(),
  photos: z.array(z.string()).optional(),
  roundsFired: z.number(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ammunitionStorageSchema = z.object({
  id: z.string(),
  caliber: z.string(),
  brand: z.string(),
  grain: z.string(),
  quantity: z.number(),
  datePurchased: z.string().datetime(),
  amountPaid: z.number(),
  pricePerRound: z.number().optional(),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessory round-exposure usage (declared early: range visits embed it)
// ─────────────────────────────────────────────────────────────────────────────

export const accessoryCategorySchema = z.enum([
  "red_dot",
  "scope",
  "magnifier",
  "iron_sights",
  "flashlight",
  "laser",
  "suppressor",
  "bipod",
  "grip",
  "stock_brace",
  "sling",
  "mount_adapter",
  "other",
]);

export const accessoryUsageModeSchema = z.enum(["full_visit", "manual"]);
export const accessoryUsageAttributionSchema = z.enum([
  "visit_entry",
  "historical_backfill",
  "manual_edit",
]);

export const accessoryUsageSchema = z.object({
  accessoryId: z.string(),
  firearmId: z.string(),
  accessoryNameSnapshot: z.string(),
  categorySnapshot: accessoryCategorySchema,
  rounds: z.number().int().min(1),
  mode: accessoryUsageModeSchema,
  attribution: accessoryUsageAttributionSchema,
});

export const rangeVisitStorageSchema = z.object({
  id: z.string(),
  date: z.string().datetime(),
  location: z.string(),
  notes: z.string().optional(),
  firearmsUsed: z.array(z.string()),
  ammunitionUsed: z
    .record(
      z.string(),
      z.object({
        ammunitionId: z.string(),
        rounds: z.number(),
      })
    )
    .optional(),
  photos: z.array(z.string()).optional(),
  // Optional for backward compatibility: records saved before the accessories
  // feature existed omit this field. When present it is the authoritative
  // per-visit record of which accessories were exposed to how many rounds.
  accessoryUsage: z.array(accessoryUsageSchema).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type FirearmStorage = z.infer<typeof firearmStorageSchema>;
export type AmmunitionStorage = z.infer<typeof ammunitionStorageSchema>;
export type RangeVisitStorage = z.infer<typeof rangeVisitStorageSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Accessories & round-exposure tracking
// ─────────────────────────────────────────────────────────────────────────────

export const accessoryMountReasonSchema = z.enum([
  "unmounted",
  "moved",
  "accessory_archived",
  "firearm_deleted",
]);

export const accessoryMountSessionSchema = z.object({
  id: z.string(),
  firearmId: z.string(),
  firearmNameSnapshot: z.string(),
  mountedAt: z.string().datetime(),
  // Undefined for the active mount. Intervals are [mountedAt, unmountedAt).
  unmountedAt: z.string().datetime().optional(),
  reasonEnded: accessoryMountReasonSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const accessoryStorageSchema = z.object({
  id: z.string(),
  category: accessoryCategorySchema,
  manufacturer: z.string().optional(),
  modelName: z.string(),
  serialNumber: z.string().optional(),
  datePurchased: z.string().datetime().optional(),
  amountPaid: z.number().optional(),
  // Round exposure accumulated before TriggerNote started tracking it.
  initialRounds: z.number().int().min(0),
  photos: z.array(z.string()).optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "archived"]),
  mountHistory: z.array(accessoryMountSessionSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Parts life database
// ─────────────────────────────────────────────────────────────────────────────

export const partBaselineTypeSchema = z.enum([
  "new",
  "original",
  "known_usage",
  "unknown",
]);

export const partReplacementReasonSchema = z.enum([
  "scheduled",
  "failure",
  "wear",
  "damage",
  "upgrade",
  "unknown",
  "other",
]);

export const partSlotSchema = z.object({
  id: z.string(),
  firearmId: z.string(),
  name: z.string(),
  serviceIntervalRounds: z.number().int().positive().optional(),
  notifyBeforeRounds: z.number().int().positive().optional(),
  enabled: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const partInstanceSchema = z.object({
  id: z.string(),
  partSlotId: z.string(),
  startingUsageRounds: z.number().int().min(0),
  baselineType: partBaselineTypeSchema,
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  partNumber: z.string().optional(),
  notes: z.string().optional(),
  replacementReason: partReplacementReasonSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const partInstallationPeriodSchema = z.object({
  id: z.string(),
  partInstanceId: z.string(),
  firearmId: z.string(),
  installedAt: z.string().datetime(),
  removedAt: z.string().datetime().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Firearm cleaning intervals
// ─────────────────────────────────────────────────────────────────────────────

export const cleaningTypeSchema = z.enum(["field_strip", "complete_disassembly"]);

export const cleaningSettingsSchema = z.object({
  firearmId: z.string(),
  fieldStripEnabled: z.boolean(),
  fieldStripIntervalRounds: z.number().int().positive().optional(),
  completeEnabled: z.boolean(),
  completeIntervalRounds: z.number().int().positive().optional(),
  warningThresholdPercent: z.number().min(0).max(100),
  // Rounds before this instant are ignored for cleaning status (baseline).
  trackingBaselineAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const cleaningEventSchema = z.object({
  id: z.string(),
  firearmId: z.string(),
  type: cleaningTypeSchema,
  performedAt: z.string().datetime(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type AccessoryCategory = z.infer<typeof accessoryCategorySchema>;
export type AccessoryMountReason = z.infer<typeof accessoryMountReasonSchema>;
export type AccessoryMountSession = z.infer<typeof accessoryMountSessionSchema>;
export type AccessoryStorage = z.infer<typeof accessoryStorageSchema>;
export type AccessoryUsage = z.infer<typeof accessoryUsageSchema>;
export type AccessoryUsageMode = z.infer<typeof accessoryUsageModeSchema>;
export type AccessoryUsageAttribution = z.infer<typeof accessoryUsageAttributionSchema>;

export type PartBaselineType = z.infer<typeof partBaselineTypeSchema>;
export type PartReplacementReason = z.infer<typeof partReplacementReasonSchema>;
export type PartSlot = z.infer<typeof partSlotSchema>;
export type PartInstance = z.infer<typeof partInstanceSchema>;
export type PartInstallationPeriod = z.infer<typeof partInstallationPeriodSchema>;

export type CleaningType = z.infer<typeof cleaningTypeSchema>;
export type CleaningSettings = z.infer<typeof cleaningSettingsSchema>;
export type CleaningEvent = z.infer<typeof cleaningEventSchema>;
