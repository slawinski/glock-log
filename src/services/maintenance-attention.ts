import {
  CleaningEvent,
  CleaningSettings,
  PartInstance,
  PartInstallationPeriod,
  PartSlot,
  RangeVisitStorage,
} from "../validation/storageSchemas";
import { calculateCleaningStatus } from "./cleaning-calculation";
import { calculatePartStatus } from "./parts-life-calculation";

/**
 * Whether a firearm needs the user's attention because any derived maintenance
 * state (cleaning interval or tracked part) is due or due-soon.
 */

export type AttentionLevel = "due" | "due_soon";

const toAttention = (status: string): AttentionLevel | null =>
  status === "due" ? "due" : status === "due_soon" ? "due_soon" : null;

const maxSeverity = (
  a: AttentionLevel | null,
  b: AttentionLevel | null
): AttentionLevel | null => {
  if (a === "due" || b === "due") return "due";
  if (a === "due_soon" || b === "due_soon") return "due_soon";
  return null;
};

const findCurrentInstance = (
  instances: PartInstance[],
  periods: PartInstallationPeriod[],
  slotId: string
): PartInstance | null => {
  const slotInstances = instances.filter((i) => i.partSlotId === slotId);
  const active = periods.find(
    (p) =>
      p.removedAt === undefined &&
      slotInstances.some((i) => i.id === p.partInstanceId)
  );
  if (!active) return null;
  return slotInstances.find((i) => i.id === active.partInstanceId) ?? null;
};

export const computeFirearmAttention = (
  firearmId: string,
  cleaningSettings: CleaningSettings | undefined,
  cleaningEvents: CleaningEvent[],
  partSlots: PartSlot[],
  partInstances: PartInstance[],
  partPeriods: PartInstallationPeriod[],
  rangeVisits: RangeVisitStorage[]
): AttentionLevel | null => {
  let level: AttentionLevel | null = null;

  const cleaning = calculateCleaningStatus(
    cleaningSettings,
    cleaningEvents.filter((e) => e.firearmId === firearmId),
    rangeVisits,
    firearmId
  );
  level = maxSeverity(level, toAttention(cleaning.fieldStrip.status));
  level = maxSeverity(level, toAttention(cleaning.completeDisassembly.status));

  for (const slot of partSlots.filter((s) => s.firearmId === firearmId)) {
    const currentInstance = findCurrentInstance(
      partInstances,
      partPeriods,
      slot.id
    );
    const status = calculatePartStatus(
      slot,
      currentInstance,
      partPeriods,
      rangeVisits
    );
    level = maxSeverity(level, toAttention(status.status));
  }

  return level;
};
