/**
 * Canonical entity-type identifiers shared across the app.
 *
 * These strings key image storage paths and collection helpers (e.g.
 * "firearm", "ammunition", "range-visit"). Always reference the entity type
 * through this enum instead of inlining the literal.
 *
 * TODO(follow-up): src/services/** internals (firearm-service.ts,
 * ammunition-service.ts, range-visit-service.ts, image-storage.ts,
 * storage-helpers.ts) still use the literal strings. They were freshly
 * refactored and intentionally left untouched; they should be migrated to
 * `EntityType` next.
 */
export const EntityType = {
  FIREARM: "firearm",
  AMMUNITION: "ammunition",
  RANGE_VISIT: "range-visit",
} as const;

// eslint-disable-next-line no-redeclare -- companion type for the const above (separate TS declaration spaces)
export type EntityType = (typeof EntityType)[keyof typeof EntityType];
