import { z } from "zod";

// Maximum length for short identifier-like fields (names, brands, locations...)
const SHORT_FIELD_MAX = 100;
// Maximum length for free-form notes/description fields
const NOTES_MAX = 5000;

const shortFieldMaxMessage = (field: string): string =>
  `${field} must be at most ${SHORT_FIELD_MAX} characters`;

export const firearmInputSchema = z.object({
  id: z.string().max(SHORT_FIELD_MAX).optional(),
  modelName: z
    .string()
    .min(1, "Model name is required")
    .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Model name")),
  caliber: z
    .string()
    .min(1, "Caliber is required")
    .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Caliber")),
  datePurchased: z.string().datetime(),
  // The form keeps `null` while the field is empty; a missing amount is
  // treated as 0 when the record is saved.
  amountPaid: z
    .number()
    .min(0, "Amount paid must be greater than or equal to 0")
    .nullish()
    .transform((value) => value ?? 0),
  initialRoundsFired: z
    .number()
    .min(0, "Initial rounds fired must be a positive number")
    .optional(),
  photos: z.array(z.string()).optional(),
  notes: z
    .string()
    .max(NOTES_MAX, `Notes must be at most ${NOTES_MAX} characters`)
    .optional(),
});

export const ammunitionInputSchema = z.object({
  id: z.string().max(SHORT_FIELD_MAX).optional(),
  caliber: z
    .string()
    .min(1, "Caliber is required")
    .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Caliber")),
  brand: z
    .string()
    .min(1, "Brand is required")
    .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Brand")),
  grain: z
    .string()
    .min(1, "Grain is required")
    .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Grain")),
  // The form keeps `null` while the field is empty; an empty quantity is
  // invalid and reported with the same message as a non-positive number.
  quantity: z
    .number()
    .min(1, "Quantity must be greater than 0")
    .nullable()
    .refine(
      (value): value is number => value !== null,
      "Quantity must be greater than 0"
    ),
  datePurchased: z.string().datetime(),
  // The form keeps `null` while the field is empty; a missing amount is
  // treated as 0 when the record is saved.
  amountPaid: z
    .number()
    .min(0, "Amount paid must be greater than or equal to 0")
    .nullish()
    .transform((value) => value ?? 0),
  pricePerRound: z.number().optional(),
  notes: z
    .string()
    .max(NOTES_MAX, `Notes must be at most ${NOTES_MAX} characters`)
    .optional(),
  photos: z.array(z.string()).optional(),
});

// Form-only variant of the ammunition schema: additionally rejects future
// purchase dates (previously a manual check in AddAmmunition).
export const ammunitionFormSchema = ammunitionInputSchema.superRefine(
  (data, ctx) => {
    if (new Date(data.datePurchased).getTime() > Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Purchase date cannot be in the future",
        path: ["datePurchased"],
      });
    }
  }
);

export const rangeVisitInputSchema = z.object({
  id: z.string().max(SHORT_FIELD_MAX).optional(),
  date: z.string().datetime(),
  location: z
    .string()
    .min(1, "Location is required")
    .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Location")),
  notes: z
    .string()
    .max(NOTES_MAX, `Notes must be at most ${NOTES_MAX} characters`)
    .optional(),
  firearmsUsed: z.array(z.string()),
  ammunitionUsed: z
    .record(
      z.string(),
      z.object({
        ammunitionId: z.string(),
        rounds: z
          .number()
          .min(1, "Rounds used must be greater than 0")
          .nullable()
          .refine(
            (value): value is number => value !== null,
            "Rounds used must be greater than 0"
          ),
      })
    )
    .optional(),
  photos: z.array(z.string()).optional(),
});

// Storage-facing types (schema output): these match what the storage layer
// expects and are unchanged in shape.
export type FirearmInput = z.infer<typeof firearmInputSchema>;
export type AmmunitionInput = z.infer<typeof ammunitionInputSchema>;
export type RangeVisitInput = z.infer<typeof rangeVisitInputSchema>;

// Form-facing types (schema input): numeric fields may hold `null` while the
// user is editing; they are coerced/validated into the output types above.
export type FirearmFormData = z.input<typeof firearmInputSchema>;
export type AmmunitionFormData = z.input<typeof ammunitionFormSchema>;
export type RangeVisitFormData = z.input<typeof rangeVisitInputSchema>;
