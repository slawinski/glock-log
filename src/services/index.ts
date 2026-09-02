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
