import {
  differenceInCalendarDays,
  endOfDay,
  startOfDay,
  startOfYear,
  subMonths,
  subYears,
} from "date-fns";
import type { ActivityIndex, PeriodFilterId, ResolvedPeriod } from "./types";
import { dateKeyToDate } from "./dates";

export const resolvePeriod = (
  id: PeriodFilterId,
  today: Date,
  index: ActivityIndex
): ResolvedPeriod => {
  let start: Date;

  switch (id) {
    case "3M":
      start = startOfDay(subMonths(today, 3));
      break;
    case "6M":
      start = startOfDay(subMonths(today, 6));
      break;
    case "YTD":
      start = startOfYear(today);
      break;
    case "1Y":
      start = startOfDay(subYears(today, 1));
      break;
    case "ALL":
      start =
        index.earliestDateKey !== null
          ? startOfDay(dateKeyToDate(index.earliestDateKey))
          : startOfDay(today);
      break;
  }

  const end = endOfDay(today);
  const spanDays = differenceInCalendarDays(end, start) + 1;

  return { id, start, end, spanDays };
};
