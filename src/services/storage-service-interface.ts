import {
  FirearmStorage,
  AmmunitionStorage,
  RangeVisitStorage,
} from "../validation/storageSchemas";
import {
  FirearmInput,
  AmmunitionInput,
  RangeVisitInput,
} from "../validation/inputSchemas";

export type SettingsData = {
  currency: string;
  biometricLockEnabled: boolean;
  crtEffectEnabled: boolean;
};

/**
 * Public contract of the app storage layer (D3).
 *
 * Implemented by the domain services (firearm-service, ammunition-service,
 * range-visit-service, settings-service, data-transfer-service) and exposed
 * through the `storage` facade in storage-new.ts. Consumers should depend on
 * this interface, never on concrete service modules.
 */
export interface StorageService {
  // Firearms
  saveFirearm(firearm: FirearmInput): Promise<void>;
  getFirearms(): Promise<FirearmStorage[]>;
  deleteFirearm(id: string): Promise<void>;
  updateFirearmRoundsFired(firearmId: string, roundsToAdd: number): Promise<void>;
  getFirearmImages(firearmId: string): Promise<string[]>;

  // Ammunition
  saveAmmunition(ammunition: AmmunitionInput): Promise<void>;
  getAmmunition(): Promise<AmmunitionStorage[]>;
  deleteAmmunition(id: string): Promise<void>;
  updateAmmunitionQuantity(
    ammunitionId: string,
    quantityChange: number
  ): Promise<void>;
  getAmmunitionImages(ammunitionId: string): Promise<string[]>;

  // Range visits
  saveRangeVisit(visit: RangeVisitInput): Promise<void>;
  getRangeVisits(): Promise<RangeVisitStorage[]>;
  deleteRangeVisit(id: string): Promise<void>;
  saveRangeVisitWithAmmunition(visit: RangeVisitInput): Promise<void>;
  getRangeVisitImages(visitId: string): Promise<string[]>;

  // Settings
  getSettings(): Promise<SettingsData>;
  setCurrency(currency: string): Promise<void>;
  setBiometricLockEnabled(enabled: boolean): Promise<void>;
  setCrtEffectEnabled(enabled: boolean): Promise<void>;
  getCurrency(): Promise<string>;
  clearAllData(): Promise<void>;

  // Data transfer
  importData(
    data: {
      firearms: FirearmStorage[];
      ammunition: AmmunitionStorage[];
      rangeVisits: RangeVisitStorage[];
    },
    strategy?: "merge" | "restore"
  ): Promise<void>;
  /**
   * Exports the full database (firearms, ammunition, range visits + images)
   * to an AES-256 encrypted ZIP archive and returns the archive path.
   * The passphrase is used only for encryption and is never persisted.
   */
  exportData(password: string): Promise<string>;
}
