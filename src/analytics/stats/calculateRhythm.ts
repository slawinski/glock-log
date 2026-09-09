import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  format,
  parseISO,
} from "date-fns";
import type {
  NormalizedVisit,
  ResolvedPeriod,
  RhythmResult,
  ShootingUsageEvent,
} from "./types";
import { dateKeyToDate } from "./dates";

const monthKeyOf = (dateKey: string): string => dateKey.slice(0, 7);

export const calculateRhythm = (
  events: ShootingUsageEvent[],
  visits: NormalizedVisit[],
  _period: ResolvedPeriod
): RhythmResult => {
  const visitDateKeys = [...new Set(visits.map((visit) => visit.dateKey))].sort();

  let avgBetweenVisitsDays: number | null = null;
  let longestGapDays: number | null = null;

  if (visitDateKeys.length >= 2) {
    let totalDays = 0;
    let maxGap = 0;
    for (let i = 1; i < visitDateKeys.length; i += 1) {
      const diff = differenceInCalendarDays(
        dateKeyToDate(visitDateKeys[i]),
        dateKeyToDate(visitDateKeys[i - 1])
      );
      totalDays += diff;
      if (diff > maxGap) {
        maxGap = diff;
      }
    }
    avgBetweenVisitsDays = totalDays / (visitDateKeys.length - 1);
    longestGapDays = maxGap;
  }

  const roundsByMonth = new Map<string, number>();
  const visitsByMonth = new Map<string, number>();
  let firstMonth: string | null = null;
  let lastMonth: string | null = null;

  for (const event of events) {
    const month = monthKeyOf(event.dateKey);
    roundsByMonth.set(month, (roundsByMonth.get(month) ?? 0) + event.rounds);
    if (firstMonth === null || month < firstMonth) {
      firstMonth = month;
    }
    if (lastMonth === null || month > lastMonth) {
      lastMonth = month;
    }
  }

  for (const visit of visits) {
    const month = monthKeyOf(visit.dateKey);
    visitsByMonth.set(month, (visitsByMonth.get(month) ?? 0) + 1);
  }

  let roundsPerMonth: number | null = null;
  let mostActiveMonth: RhythmResult["mostActiveMonth"] = null;

  if (firstMonth !== null && lastMonth !== null) {
    const totalRounds = [...roundsByMonth.values()].reduce(
      (sum, rounds) => sum + rounds,
      0
    );
    const monthCount =
      differenceInCalendarMonths(
        parseISO(`${lastMonth}-01`),
        parseISO(`${firstMonth}-01`)
      ) + 1;
    roundsPerMonth = totalRounds / monthCount;

    let best: { key: string; rounds: number; visits: number } | null = null;
    for (const [month, rounds] of roundsByMonth) {
      const monthVisits = visitsByMonth.get(month) ?? 0;
      if (
        best === null ||
        rounds > best.rounds ||
        (rounds === best.rounds &&
          (monthVisits > best.visits ||
            (monthVisits === best.visits && month > best.key)))
      ) {
        best = { key: month, rounds, visits: monthVisits };
      }
    }

    if (best !== null) {
      mostActiveMonth = {
        key: best.key,
        label: format(parseISO(`${best.key}-01`), "MMMM yyyy").toUpperCase(),
        rounds: best.rounds,
        visits: best.visits,
      };
    }
  }

  return {
    avgBetweenVisitsDays,
    roundsPerMonth,
    mostActiveMonth,
    longestGapDays,
  };
};
