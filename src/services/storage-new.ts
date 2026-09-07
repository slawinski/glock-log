/**
 * Thin facade over the domain storage services.
 *
 * This module keeps the historical import path (`../../services/storage-new`)
 * working while the implementation lives in per-domain modules:
 *   - firearm-service.ts
 *   - ammunition-service.ts
 *   - range-visit-service.ts
 *   - settings-service.ts
 *   - data-transfer-service.ts
 *
 * Shared key-layout/migration helpers live in storage-helpers.ts and the
 * public contract is the StorageService interface in
 * storage-service-interface.ts.
 */
import { StorageService } from "./storage-service-interface";
import { firearmService } from "./firearm-service";
import { ammunitionService } from "./ammunition-service";
import { rangeVisitService } from "./range-visit-service";
import { settingsService } from "./settings-service";
import { dataTransferService } from "./data-transfer-service";
import { cleaningService } from "./cleaning-service";
import { partsLifeService } from "./parts-life-service";
import { accessoryService } from "./accessory-service";
import { accessoryUsageService } from "./accessory-usage-service";
import { computeAccessoryStats } from "./accessory-service";

export type { SettingsData } from "./storage-service-interface";

export const storage: StorageService = {
  ...firearmService,
  ...ammunitionService,
  ...rangeVisitService,
  ...settingsService,
  ...cleaningService,
  ...partsLifeService,
  ...accessoryService,
  ...accessoryUsageService,
  getUsageStats: computeAccessoryStats,
  ...dataTransferService,
};
