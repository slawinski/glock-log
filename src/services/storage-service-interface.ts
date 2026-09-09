import {
  FirearmStorage,
  AmmunitionStorage,
  RangeVisitStorage,
  CleaningSettings,
  CleaningEvent,
  PartSlot,
  PartInstance,
  PartInstallationPeriod,
  AccessoryStorage,
  AccessoryMountSession,
} from "../validation/storageSchemas";
import {
  FirearmInput,
  AmmunitionInput,
  RangeVisitInput,
  CleaningEventInput,
  AddPartInput,
  ReplacePartInput,
  AccessoryInput,
} from "../validation/inputSchemas";
import { PartLifeResult } from "./parts-life-calculation";
import {
  BackfillDecision,
  UsageConflictDecision,
} from "./accessory-usage-service";
import { AccessoryUsageStats } from "./accessory-service";
import { AccessoryReconciliation } from "./accessory-reconciliation";

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
  saveFirearm(firearm: FirearmInput): Promise<string>;
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
  setStatsPeriod(period: string): Promise<void>;
  getStatsPeriod(): Promise<string>;
  getCurrency(): Promise<string>;
  clearAllData(): Promise<void>;

  // Cleaning intervals
  getCleaningSettings(firearmId: string): Promise<CleaningSettings | undefined>;
  getAllCleaningSettings(): Promise<CleaningSettings[]>;
  saveCleaningSettings(settings: CleaningSettings): Promise<void>;
  getCleaningEvents(firearmId: string): Promise<CleaningEvent[]>;
  getAllCleaningEvents(): Promise<CleaningEvent[]>;
  saveCleaningEvent(event: CleaningEventInput): Promise<string>;
  deleteCleaningEvent(id: string): Promise<void>;
  deleteCleaningForFirearm(firearmId: string): Promise<void>;

  // Parts life
  getPartSlots(firearmId: string): Promise<PartSlot[]>;
  getAllPartSlots(): Promise<PartSlot[]>;
  getPartInstances(slotId: string): Promise<PartInstance[]>;
  getAllPartInstances(): Promise<PartInstance[]>;
  getAllPartPeriods(): Promise<PartInstallationPeriod[]>;
  addPart(input: AddPartInput): Promise<string>;
  getCurrentInstance(slotId: string): Promise<PartInstance | null>;
  replacePart(slotId: string, input: ReplacePartInput): Promise<void>;
  removeInstalledPart(slotId: string): Promise<void>;
  reinstallPart(
    slotId: string,
    instanceId: string,
    installedAt: string
  ): Promise<void>;
  removePartSlot(slotId: string): Promise<void>;
  deletePartsForFirearm(firearmId: string): Promise<void>;
  getPartStatus(
    slot: PartSlot,
    rangeVisits: RangeVisitStorage[]
  ): Promise<PartLifeResult>;
  getFirearmPartsStatus(
    firearmId: string,
    rangeVisits: RangeVisitStorage[]
  ): Promise<PartLifeResult[]>;

  // Accessories
  getAccessories(): Promise<AccessoryStorage[]>;
  getAccessory(id: string): Promise<AccessoryStorage | null>;
  saveAccessory(
    input: AccessoryInput,
    mount?: { firearmId: string; mountedAt: string }
  ): Promise<string>;
  archiveAccessory(id: string): Promise<void>;
  restoreAccessory(id: string): Promise<void>;
  deleteAccessory(id: string): Promise<void>;
  mountAccessory(
    accessoryId: string,
    firearmId: string,
    mountedAt: string
  ): Promise<void>;
  unmountAccessory(accessoryId: string, unmountedAt: string): Promise<void>;
  moveAccessory(
    accessoryId: string,
    newFirearmId: string,
    movedAt: string
  ): Promise<void>;
  getAccessoriesMountedOnFirearm(
    firearmId: string,
    atDate?: string
  ): Promise<AccessoryStorage[]>;
  handleFirearmDeletion(firearmId: string): Promise<void>;
  getCurrentMount(
    accessory: AccessoryStorage
  ): AccessoryMountSession | null;
  getUsageStats(
    accessory: AccessoryStorage,
    rangeVisits: RangeVisitStorage[]
  ): AccessoryUsageStats;
  findReconciliation(
    accessory: AccessoryStorage,
    rangeVisits: RangeVisitStorage[]
  ): AccessoryReconciliation;
  applyBackfill(
    accessoryId: string,
    decisions: BackfillDecision[]
  ): Promise<void>;
  resolveConflicts(
    accessoryId: string,
    decisions: UsageConflictDecision[]
  ): Promise<void>;

  // Data transfer
  importData(
    data: {
      firearms: FirearmStorage[];
      ammunition: AmmunitionStorage[];
      rangeVisits: RangeVisitStorage[];
      accessories?: AccessoryStorage[];
      partSlots?: PartSlot[];
      partInstances?: PartInstance[];
      partPeriods?: PartInstallationPeriod[];
      cleaningSettings?: CleaningSettings[];
      cleaningEvents?: CleaningEvent[];
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
