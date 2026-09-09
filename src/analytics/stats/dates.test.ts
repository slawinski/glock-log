import { endOfDay, parseISO, startOfDay } from "date-fns";
import { dateKeyToDate, periodContainsDateKey, toDateKey } from "./dates";

describe("toDateKey", () => {
  it("formats a local date as yyyy-MM-dd", () => {
    expect(toDateKey(parseISO("2026-08-12T15:30:00"))).toBe("2026-08-12");
  });

  it("uses the local calendar day rather than a UTC conversion", () => {
    const date = new Date(2026, 7, 12, 23, 45, 0);
    expect(toDateKey(date)).toBe("2026-08-12");
  });

  it("zero-pads single-digit months and days", () => {
    expect(toDateKey(parseISO("2026-01-05T00:00:00"))).toBe("2026-01-05");
  });
});

describe("dateKeyToDate", () => {
  it("parses a date key back to a local date", () => {
    const date = dateKeyToDate("2026-08-12");
    expect(toDateKey(date)).toBe("2026-08-12");
  });

  it("treats the key as local midnight", () => {
    const date = dateKeyToDate("2026-08-12");
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
  });
});

describe("periodContainsDateKey", () => {
  const start = startOfDay(parseISO("2026-08-01T10:00:00"));
  const end = endOfDay(parseISO("2026-08-31T10:00:00"));

  it("includes the start boundary", () => {
    expect(periodContainsDateKey(start, end, "2026-08-01")).toBe(true);
  });

  it("includes the end boundary", () => {
    expect(periodContainsDateKey(start, end, "2026-08-31")).toBe(true);
  });

  it("includes interior dates", () => {
    expect(periodContainsDateKey(start, end, "2026-08-15")).toBe(true);
  });

  it("excludes dates before the start", () => {
    expect(periodContainsDateKey(start, end, "2026-07-31")).toBe(false);
  });

  it("excludes dates after the end", () => {
    expect(periodContainsDateKey(start, end, "2026-09-01")).toBe(false);
  });
});
