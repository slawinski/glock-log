import { z } from "zod";

export const firearmSchema = z.object({
  modelName: z.string().min(1, "Model name is required"),
  caliber: z.string().min(1, "Caliber is required"),
  datePurchased: z.string().datetime(),
  amountPaid: z
    .number()
    .min(0, "Amount paid must be greater than or equal to 0"),
  photos: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const ammunitionSchema = z.object({
  caliber: z.string().min(1, "Caliber is required"),
  brand: z.string().min(1, "Brand is required"),
  grain: z.number().min(1, "Grain must be greater than 0"),
  quantity: z.number().min(1, "Quantity must be greater than 0"),
  datePurchased: z.string().datetime(),
  amountPaid: z
    .number()
    .min(0, "Amount paid must be greater than or equal to 0"),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

export const rangeVisitSchema = z.object({
  date: z.string().datetime(),
  location: z.string().min(1, "Location is required"),
  notes: z.string().optional(),
  firearmsUsed: z
    .array(z.string())
    .min(1, "At least one firearm must be selected"),
  roundsPerFirearm: z
    .record(z.string(), z.string().min(1, "Rounds fired is required"))
    .refine(
      (data) => {
        // Check that all values are non-empty and greater than 0
        return Object.entries(data).every(([_, value]) => {
          const num = parseInt(value, 10);
          return !isNaN(num) && num > 0;
        });
      },
      {
        message: "Please enter a valid number of rounds fired for each firearm",
        path: ["roundsPerFirearm"],
      }
    ),
  photos: z.array(z.string()).optional(),
});
