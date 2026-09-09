import { format, parseISO } from "date-fns";

export const toDateKey = (date: Date): string => format(date, "yyyy-MM-dd");

export const dateKeyToDate = (key: string): Date => parseISO(key);

export const periodContainsDateKey = (
  start: Date,
  end: Date,
  dateKey: string
): boolean => {
  const startKey = toDateKey(start);
  const endKey = toDateKey(end);
  return dateKey >= startKey && dateKey <= endKey;
};
