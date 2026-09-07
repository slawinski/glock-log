import { AccessoryCategory } from "../validation/storageSchemas";
import {
  accessoryVariantPlaceholders,
  DEFAULT_FIREARM_PLACEHOLDER_KEY,
} from "./image-source-manager";

/**
 * Maps an accessory category to the placeholder variants it can produce, keyed
 * by the base placeholder key. To support a new category/firearm-type
 * combination, add a require entry in image-source-manager's
 * `accessoryVariantPlaceholders` AND an entry here.
 */
const ACCESSORY_PLACEHOLDER_VARIANTS: Partial<
  Record<AccessoryCategory, Record<string, string>>
> = {
  red_dot: {
    "pistol-placeholder.png": "pistol-reddot-placeholder.png",
  },
};

/**
 * Deterministic precedence when several mounted categories could each produce
 * a variant: the first mounted category in this order wins.
 */
const CATEGORY_PRECEDENCE: AccessoryCategory[] = [
  "red_dot",
  "scope",
  "magnifier",
  "laser",
  "flashlight",
  "suppressor",
];

// Reverse map (variant -> base), derived from the forward map so the two can
// never drift out of sync.
const VARIANT_TO_BASE: Record<string, string> = {};
for (const variants of Object.values(ACCESSORY_PLACEHOLDER_VARIANTS)) {
  for (const [base, variant] of Object.entries(variants ?? {})) {
    VARIANT_TO_BASE[variant] = base;
  }
}

export const variantPlaceholderKeyFor = (
  baseKey: string,
  category: AccessoryCategory
): string | null => {
  const variant = ACCESSORY_PLACEHOLDER_VARIANTS[category]?.[baseKey];
  return variant && variant in accessoryVariantPlaceholders ? variant : null;
};

export const basePlaceholderKeyFor = (key: string): string =>
  VARIANT_TO_BASE[key] ?? key;

/**
 * Computes the placeholder key that should be stored for a firearm's thumbnail
 * given its current photo and the accessory categories mounted on it.
 *
 * Returns null when the thumbnail is a real photo (never touched). An empty
 * photo falls back to {@link DEFAULT_FIREARM_PLACEHOLDER_KEY}.
 */
export const effectivePlaceholderKey = (
  currentPhoto: string | undefined,
  mountedCategories: AccessoryCategory[]
): string | null => {
  if (currentPhoto && !currentPhoto.startsWith("placeholder:")) {
    return null;
  }

  const currentKey = currentPhoto
    ? currentPhoto.slice("placeholder:".length)
    : DEFAULT_FIREARM_PLACEHOLDER_KEY;

  const base = basePlaceholderKeyFor(currentKey);

  for (const category of CATEGORY_PRECEDENCE) {
    if (!mountedCategories.includes(category)) continue;
    const variant = variantPlaceholderKeyFor(base, category);
    if (variant) return variant;
  }

  return base;
};
