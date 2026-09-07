/**
 * Public API barrel for the app's service layer.
 *
 * Exposes the storage facade and the symbols consumers actually use. Internal
 * helpers (storage-factory, storage-helpers, image-storage, domain service
 * implementations) are intentionally NOT re-exported: consumers should depend
 * on `storage` (backed by the `StorageService` interface), not on concrete
 * service modules.
 */

export { storage } from "./storage-new";
export type { StorageService, SettingsData } from "./storage-service-interface";

export { handleError, ERROR_MESSAGES } from "./error-handler";
export type { AppError } from "./error-handler";

export { StorageInit } from "./storage-init";

export {
  placeholderImages,
  normalizeImagePath,
  resolveImageSource,
} from "./image-source-manager";
export type { PlaceholderImageKey } from "./image-source-manager";

// Derived maintenance-state calculators (pure; consumed by screens).
export {
  calculateCleaningStatus,
  calculateCleaningTimeline,
  visitAfterCleaning,
  DEFAULT_WARNING_THRESHOLD_PERCENT,
} from "./cleaning-calculation";
export type {
  CleaningIntervalResult,
  CleaningIntervalStatus,
  CleaningStatus,
  CleaningEventStats,
} from "./cleaning-calculation";

export {
  calculatePartStatus,
  calculatePartInstanceUsage,
  roundsInPeriod,
  activePeriodForInstance,
  defaultNotifyBefore,
} from "./parts-life-calculation";
export type { PartStatus, PartLifeResult } from "./parts-life-calculation";

export {
  findReconciliation,
} from "./accessory-reconciliation";
export type {
  CandidateUsage,
  UsageConflict,
  AccessoryReconciliation,
} from "./accessory-reconciliation";

export { computeAccessoryStats, getCurrentMount, buildAutoAccessoryUsage } from "./accessory-service";
export type { AccessoryUsageStats } from "./accessory-service";

export { computeFirearmAttention } from "./maintenance-attention";
export type { AttentionLevel } from "./maintenance-attention";

export {
  variantPlaceholderKeyFor,
  basePlaceholderKeyFor,
  effectivePlaceholderKey,
} from "./firearm-placeholder";
