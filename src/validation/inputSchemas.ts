import { z } from "zod";
import {
  firearmOwnershipSchema,
  accessoryCategorySchema,
  accessoryUsageSchema,
  cleaningTypeSchema,
  partBaselineTypeSchema,
  partReplacementReasonSchema,
} from "./storageSchemas";

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
  ownership: firearmOwnershipSchema.default("mine"),
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
  // Kept as a string while editing. Quantity is required but may be 0 — a
  // depleted ammunition record is a valid inventory state.
  quantity: z
    .string()
    .refine((raw) => raw.trim() !== "", "Enter a quantity.")
    .transform((raw) => {
      const parsed = Number(raw.trim());
      return Number.isFinite(parsed) ? parsed : -1;
    })
    .pipe(z.number().min(0, "Quantity cannot be negative.")),
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
  accessoryUsage: z.array(accessoryUsageSchema).optional(),
  photos: z.array(z.string()).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessories & round-exposure tracking
// ─────────────────────────────────────────────────────────────────────────────

export const accessoryInputSchema = z.object({
  id: z.string().max(SHORT_FIELD_MAX).optional(),
  category: accessoryCategorySchema,
  manufacturer: z
    .string()
    .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Manufacturer"))
    .optional(),
  modelName: z
    .string()
    .min(1, "Enter a model name.")
    .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Model name")),
  serialNumber: z
    .string()
    .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Serial number"))
    .optional(),
  datePurchased: z.string().datetime().optional(),
  amountPaid: numericString(0, "Enter a valid amount.").optional(),
  // Kept as a string while editing; an empty value is treated as 0 on save.
  initialRounds: numericString(0, "Enter a valid number."),
  photos: z.array(z.string()).optional(),
  notes: z
    .string()
    .max(NOTES_MAX, `Notes must be at most ${NOTES_MAX} characters`)
    .optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Firearm cleaning intervals
// ─────────────────────────────────────────────────────────────────────────────

export const cleaningEventInputSchema = z.object({
  id: z.string().max(SHORT_FIELD_MAX).optional(),
  firearmId: z.string().min(1, "Select a firearm."),
  type: cleaningTypeSchema,
  performedAt: z.string().datetime(),
  notes: z
    .string()
    .max(NOTES_MAX, `Notes must be at most ${NOTES_MAX} characters`)
    .optional(),
});

// Form-only variant: additionally rejects future cleaning dates.
export const cleaningEventFormSchema = cleaningEventInputSchema.superRefine(
  (data, ctx) => {
    if (new Date(data.performedAt).getTime() > Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cleaning date cannot be in the future",
        path: ["performedAt"],
      });
    }
  }
);

// Intervals are held as strings while editing; a configured interval must be a
// positive whole number. Cross-field rule enforced in superRefine below.
export const cleaningSettingsInputSchema = z
  .object({
    firearmId: z.string(),
    fieldStripEnabled: z.boolean(),
    fieldStripIntervalRounds: z.string(),
    completeEnabled: z.boolean(),
    completeIntervalRounds: z.string(),
    trackingBaselineAt: z.string().datetime().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fieldStripEnabled) {
      const interval = Number(data.fieldStripIntervalRounds.trim());
      if (!Number.isInteger(interval) || interval < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a positive whole number of rounds.",
          path: ["fieldStripIntervalRounds"],
        });
      }
    }
    if (data.completeEnabled) {
      const interval = Number(data.completeIntervalRounds.trim());
      if (!Number.isInteger(interval) || interval < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a positive whole number of rounds.",
          path: ["completeIntervalRounds"],
        });
      }
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// Parts life database
// ─────────────────────────────────────────────────────────────────────────────

// Creating a tracked part slot + its first installed part instance in one flow.
export const addPartSchema = z
  .object({
    firearmId: z.string(),
    name: z
      .string()
      .min(1, "Enter a part name.")
      .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Part name")),
    trackInterval: z.boolean(),
    serviceIntervalRounds: z.string(),
    notifyBeforeRounds: z.string(),
    baselineType: partBaselineTypeSchema,
    startingUsageRounds: z.string(),
    manufacturer: z
      .string()
      .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Manufacturer"))
      .optional(),
    model: z
      .string()
      .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Model"))
      .optional(),
    partNumber: z
      .string()
      .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Part number"))
      .optional(),
    notes: z
      .string()
      .max(NOTES_MAX, `Notes must be at most ${NOTES_MAX} characters`)
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.trackInterval) {
      const interval = Number(data.serviceIntervalRounds.trim());
      if (!Number.isInteger(interval) || interval < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a positive whole number of rounds.",
          path: ["serviceIntervalRounds"],
        });
      } else {
        const notify = data.notifyBeforeRounds.trim();
        if (notify !== "") {
          const notifyRounds = Number(notify);
          if (!Number.isInteger(notifyRounds) || notifyRounds < 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Notify-before must be a positive whole number.",
              path: ["notifyBeforeRounds"],
            });
          } else if (notifyRounds >= interval) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Notify-before must be less than the interval.",
              path: ["notifyBeforeRounds"],
            });
          }
        }
      }
    }
    if (data.baselineType === "known_usage") {
      const usage = Number(data.startingUsageRounds.trim());
      if (!Number.isInteger(usage) || usage < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid round count.",
          path: ["startingUsageRounds"],
        });
      }
    }
  });

// Replacing the currently installed part with a new physical component.
export const replacePartSchema = z
  .object({
    replacementDate: z.string().datetime(),
    reason: partReplacementReasonSchema,
    baselineType: partBaselineTypeSchema,
    startingUsageRounds: z.string(),
    manufacturer: z
      .string()
      .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Manufacturer"))
      .optional(),
    model: z
      .string()
      .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Model"))
      .optional(),
    partNumber: z
      .string()
      .max(SHORT_FIELD_MAX, shortFieldMaxMessage("Part number"))
      .optional(),
    notes: z
      .string()
      .max(NOTES_MAX, `Notes must be at most ${NOTES_MAX} characters`)
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (new Date(data.replacementDate).getTime() > Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Replacement date cannot be in the future",
        path: ["replacementDate"],
      });
    }
    if (data.baselineType === "known_usage") {
      const usage = Number(data.startingUsageRounds.trim());
      if (!Number.isInteger(usage) || usage < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid round count.",
          path: ["startingUsageRounds"],
        });
      }
    }
  });

// Storage-facing types (schema output): these match what the storage layer
// expects and are unchanged in shape.
export type FirearmInput = z.infer<typeof firearmInputSchema>;
export type AmmunitionInput = z.infer<typeof ammunitionInputSchema>;
export type RangeVisitInput = z.infer<typeof rangeVisitInputSchema>;
export type AccessoryInput = z.infer<typeof accessoryInputSchema>;
export type CleaningEventInput = z.infer<typeof cleaningEventInputSchema>;
export type CleaningSettingsInput = z.infer<typeof cleaningSettingsInputSchema>;
export type AddPartInput = z.infer<typeof addPartSchema>;
export type ReplacePartInput = z.infer<typeof replacePartSchema>;

// Form-facing types (schema input): numeric fields hold `string` while the
// user is editing; they are coerced/validated into the output types above.
export type FirearmFormData = z.input<typeof firearmInputSchema>;
export type AmmunitionFormData = z.input<typeof ammunitionFormSchema>;
export type RangeVisitFormData = z.input<typeof rangeVisitInputSchema>;
export type AccessoryFormData = z.input<typeof accessoryInputSchema>;
export type CleaningEventFormData = z.input<typeof cleaningEventFormSchema>;
export type CleaningSettingsFormData = z.input<typeof cleaningSettingsInputSchema>;
export type AddPartFormData = z.input<typeof addPartSchema>;
export type ReplacePartFormData = z.input<typeof replacePartSchema>;
