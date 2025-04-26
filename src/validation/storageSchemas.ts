import { z } from "zod";

// Storage schemas for backend validation
export const firearmStorageSchema = z.object({
  id: z.string(),
  modelName: z.string(),
  caliber: z.string(),
  datePurchased: z.string().datetime(),
  amountPaid: z.number(),
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
  grain: z.number(),
  quantity: z.number(),
  datePurchased: z.string().datetime(),
  amountPaid: z.number(),
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
  roundsPerFirearm: z.record(z.string(), z.number()),
  ammunitionUsed: z.record(z.string(), z.number()),
  photos: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Type inference for TypeScript
export type FirearmStorage = z.infer<typeof firearmStorageSchema>;
export type AmmunitionStorage = z.infer<typeof ammunitionStorageSchema>;
export type RangeVisitStorage = z.infer<typeof rangeVisitStorageSchema>;
