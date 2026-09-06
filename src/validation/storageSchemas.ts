import { z } from "zod";

/**
 * Whether a firearm belongs to the user ("mine") or was used without owning it
 * ("borrowed"). Borrowed firearms track guns the user has shot but doesn't own.
 */
export const firearmOwnershipSchema = z.enum(["mine", "borrowed"]);
export type FirearmOwnership = z.infer<typeof firearmOwnershipSchema>;

export const firearmStorageSchema = z.object({
  id: z.string(),
  modelName: z.string(),
  caliber: z.string(),
  datePurchased: z.string().datetime(),
  amountPaid: z.number(),
  // Optional for backward compatibility: records saved before the ownership
  // field existed omit it, and an absent value is treated as "mine".
  ownership: firearmOwnershipSchema.optional(),
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
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type FirearmStorage = z.infer<typeof firearmStorageSchema>;
export type AmmunitionStorage = z.infer<typeof ammunitionStorageSchema>;
export type RangeVisitStorage = z.infer<typeof rangeVisitStorageSchema>;
