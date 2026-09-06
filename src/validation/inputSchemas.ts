import { z } from "zod";

// Maximum length for short identifier-like fields (names, brands, locations...)
const SHORT_FIELD_MAX = 100;
// Maximum length for free-form notes/description fields
const NOTES_MAX = 5000;

const shortFieldMaxMessage = (field: string): string =>
  `${field} must be at most ${SHORT_FIELD_MAX} characters`;

/**
 * Coerces a numeric string into a number. Empty strings resolve to `0`, and
 * non-numeric input resolves to a value below `min` so `.min()` rejects it
 * with the provided message.
 */
const numericString = (min: number, message: string) =>
  z
    .string()
    .transform((raw) => {
      const trimmed = raw.trim();
      if (trimmed === "") return 0;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : min - 1;
    })
    .pipe(z.number().min(min, message));

export const firearmInputSchema = z.object({
  id: z.string().max(SHORT_FIELD_MAX).optional(),
  modelName: z
    .string()
    .min(1, "Enter a model name.")
    .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Model name")),
  caliber: z
    .string()
    .min(1, "Enter a caliber.")
    .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Caliber")),
  datePurchased: z.string().datetime(),
  // Kept as a string while editing; an empty value is treated as 0 on save.
  amountPaid: numericString(0, "Enter a valid amount."),
  // Kept as a string while editing; an empty value is treated as 0 on save.
  initialRoundsFired: numericString(0, "Enter a valid number.").optional(),
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
    .min(1, "Enter a caliber.")
    .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Caliber")),
  brand: z
    .string()
    .min(1, "Enter a brand.")
    .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Brand")),
  grain: z
    .string()
    .min(1, "Enter a grain.")
    .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Grain")),
  // Kept as a string while editing; an empty quantity is invalid and reported
  // with the same message as a non-positive number.
  quantity: numericString(1, "Quantity must be greater than 0."),
  datePurchased: z.string().datetime(),
  // Kept as a string while editing; an empty value is treated as 0 on save.
  amountPaid: numericString(0, "Enter a valid amount."),
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
    .min(1, "Enter a location.")
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
        rounds: numericString(1, "Rounds used must be greater than 0."),
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

// Form-facing types (schema input): numeric fields hold `string` while the
// user is editing; they are coerced/validated into the output types above.
export type FirearmFormData = z.input<typeof firearmInputSchema>;
export type AmmunitionFormData = z.input<typeof ammunitionFormSchema>;
export type RangeVisitFormData = z.input<typeof rangeVisitInputSchema>;
