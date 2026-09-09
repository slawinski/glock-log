import type { RankingEntry, ShootingUsageEvent } from "./types";

export const calculateRanking = (
  events: ShootingUsageEvent[],
  mode: "firearms" | "calibers"
): RankingEntry[] => {
  const total = events.reduce((sum, event) => sum + event.rounds, 0);

  const byKey = new Map<string, { label: string; rounds: number }>();

  for (const event of events) {
    const key = mode === "firearms" ? event.firearmId : event.caliber;
    const label = mode === "firearms" ? event.firearmName : event.caliber;
    const existing = byKey.get(key);
    if (existing !== undefined) {
      existing.rounds += event.rounds;
    } else {
      byKey.set(key, { label, rounds: event.rounds });
    }
  }

  return [...byKey.entries()]
    .map(([key, value]) => ({
      key,
      label: value.label,
      rounds: value.rounds,
      share: total === 0 ? 0 : value.rounds / total,
    }))
    .sort((a, b) => b.rounds - a.rounds);
};
