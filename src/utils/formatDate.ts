import { format } from "date-fns";

type DateInput = Date | string | null | undefined;

/**
 * Formats a date using an explicit date-fns pattern so the output is
 * deterministic regardless of the device locale (unlike toLocaleDateString).
 *
 * @param date    The date to format. Accepts a Date or an ISO date string.
 * @param pattern date-fns format pattern. Defaults to "M/d/yyyy" (e.g. 1/15/2023).
 * @returns The formatted date string, or an empty string for null/undefined/invalid dates.
 */
export const formatDate = (
  date: DateInput,
  pattern: string = "M/d/yyyy"
): string => {
  if (date === null || date === undefined) {
    return "";
  }

  const value = typeof date === "string" ? new Date(date) : date;

  if (isNaN(value.getTime())) {
    return "";
  }

  return format(value, pattern);
};
