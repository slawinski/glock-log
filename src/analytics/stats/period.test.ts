import { parseISO } from "date-fns";
import { resolvePeriod } from "./period";
import { buildActivityIndex } from "./buildActivityIndex";
import { makeAmmo, makeFirearm, makeVisit } from "./fixtures";
import { toDateKey } from "./dates";

const today = parseISO("2026-08-12T12:00:00");

const indexWith = (earliest: string | null) =>
  earliest === null
    ? buildActivityIndex({
        firearms: [],
        ammunition: [],
        rangeVisits: [],
      })
    : buildActivityIndex({
        firearms: [makeFirearm({ id: "f1" })],
        ammunition: [makeAmmo({ id: "a1" })],
        rangeVisits: [
          makeVisit({ id: "v1", date: `${earliest}T12:00:00` }),
        ],
      });

describe("resolvePeriod", () => {
  it("3M spans the previous three months through today", () => {
    const period = resolvePeriod("3M", today, indexWith(null));
    expect(toDateKey(period.start)).toBe("2026-05-12");
    expect(toDateKey(period.end)).toBe("2026-08-12");
  });

  it("6M spans the previous six months through today", () => {
    const period = resolvePeriod("6M", today, indexWith(null));
    expect(toDateKey(period.start)).toBe("2026-02-12");
    expect(toDateKey(period.end)).toBe("2026-08-12");
  });

  it("YTD starts at the first day of the year", () => {
    const period = resolvePeriod("YTD", today, indexWith(null));
    expect(toDateKey(period.start)).toBe("2026-01-01");
    expect(toDateKey(period.end)).toBe("2026-08-12");
  });

  it("1Y spans the previous year through today", () => {
    const period = resolvePeriod("1Y", today, indexWith(null));
    expect(toDateKey(period.start)).toBe("2025-08-12");
    expect(toDateKey(period.end)).toBe("2026-08-12");
  });

  it("ALL starts at the earliest activity when activity exists", () => {
    const period = resolvePeriod("ALL", today, indexWith("2024-03-10"));
    expect(toDateKey(period.start)).toBe("2024-03-10");
    expect(toDateKey(period.end)).toBe("2026-08-12");
  });

  it("ALL falls back to today when there is no activity", () => {
    const period = resolvePeriod("ALL", today, indexWith(null));
    expect(toDateKey(period.start)).toBe("2026-08-12");
    expect(toDateKey(period.end)).toBe("2026-08-12");
  });

  it("computes an inclusive span in days", () => {
    const period = resolvePeriod("3M", today, indexWith(null));
    expect(period.spanDays).toBeGreaterThan(0);
  });
});
