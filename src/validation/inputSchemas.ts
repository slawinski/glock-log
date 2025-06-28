import { z } from "zod";

// Input schemas for frontend validation
export const firearmInputSchema = z.object({
  id: z.string().optional(),
  modelName: z.string().min(1, "Model name is required"),
  caliber: z.string().min(1, "Caliber is required"),
  datePurchased: z.string().datetime(),
  amountPaid: z
    .number()
    .min(0, "Amount paid must be greater than or equal to 0"),
  initialRoundsFired: z
    .number()
    .min(0, "Initial rounds fired must be a positive number")
    .optional(),
  photos: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const ammunitionInputSchema = z.object({
  id: z.string().optional(),
  caliber: z.string().min(1, "Caliber is required"),
  brand: z.string().min(1, "Brand is required"),
  grain: z.string().min(1, "Grain is required"),
  quantity: z.number().min(1, "Quantity must be greater than 0"),
  datePurchased: z.string().datetime(),
  amountPaid: z
    .number()
    .min(0, "Amount paid must be greater than or equal to 0"),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

export const rangeVisitInputSchema = z.object({
  id: z.string().optional(),
  date: z.string().datetime(),
  location: z.string().min(1, "Location is required"),
  notes: z.string().optional(),
  firearmsUsed: z
    .array(z.string())
    .min(1, "At least one firearm must be selected"),
  ammunitionUsed: z
    .record(
      z.string(), // firearmId
      z.object({
        ammunitionId: z.string(),
        rounds: z.number().min(1, "Rounds used must be greater than 0"),
      })
    )
    .optional(),
  photos: z.array(z.string()).optional(),
});

// Type inference for TypeScript
export type FirearmInput = z.infer<typeof firearmInputSchema>;
export type AmmunitionInput = z.infer<typeof ammunitionInputSchema>;
export type RangeVisitInput = z.infer<typeof rangeVisitInputSchema>;
