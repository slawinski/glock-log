import React from "react";
import { render } from "@testing-library/react-native";
import type {
  DailyShootingActivity,
  NormalizedVisit,
  ResolvedPeriod,
  ShootingUsageEvent,
} from "../../analytics/stats";
import { VisitCalendarSection, buildCalendarData } from "./VisitCalendarSection";

const daily = (overrides: Partial<DailyShootingActivity>): DailyShootingActivity => ({
  dateKey: "2025-01-01",
  rounds: 0,
  knownCost: 0,
  pricedRounds: 0,
  visitCount: 0,
  visitIds: [],
  ...overrides,
});

const fixture: DailyShootingActivity[] = [
  daily({ dateKey: "2025-01-05", rounds: 10, visitCount: 1, visitIds: ["v1"] }),
  daily({ dateKey: "2025-01-10", rounds: 50, visitCount: 1, visitIds: ["v2"] }),
  daily({ dateKey: "2024-12-30", rounds: 200, visitCount: 2, visitIds: ["v3", "v4"] }),
];

describe("buildCalendarData", () => {
  const visibleMonth = new Date(2025, 0, 1);

  it("reports activity years and active months", () => {
    const data = buildCalendarData(fixture, visibleMonth);

    expect(data.years).toEqual(["2024", "2025"]);
    expect(data.activeMonths).toEqual(["2024-12", "2025-01"]);
  });

  it("builds a 5-6 week grid with correct inMonth flags", () => {
    const data = buildCalendarData(fixture, visibleMonth);
    const cells = data.weeks.flat();

    expect(data.weeks.length).toBeGreaterThanOrEqual(5);
    expect(data.weeks.length).toBeLessThanOrEqual(6);

    const jan5 = cells.find((c) => c.dateKey === "2025-01-05");
    const dec30 = cells.find((c) => c.dateKey === "2024-12-30");

    expect(jan5?.inMonth).toBe(true);
    expect(dec30?.inMonth).toBe(false);
  });

  it("marks active days with their rounds and visit counts", () => {
    const data = buildCalendarData(fixture, visibleMonth);
    const cells = data.weeks.flat();

    const jan5 = cells.find((c) => c.dateKey === "2025-01-05");
    const dec30 = cells.find((c) => c.dateKey === "2024-12-30");

    expect(jan5?.rounds).toBe(10);
    expect(jan5?.visitCount).toBe(1);
    expect(dec30?.rounds).toBe(200);
    expect(dec30?.visitCount).toBe(2);
  });
});

describe("VisitCalendarSection", () => {
  const period: ResolvedPeriod = {
    id: "6M",
    start: new Date(2024, 11, 1),
    end: new Date(2025, 1, 28),
    spanDays: 90,
  };

  const visit: NormalizedVisit = {
    id: "v1",
    date: "2025-01-05T00:00:00.000Z",
    dateKey: "2025-01-05",
    location: "Test Range",
    firearmIds: ["f1"],
    rounds: 10,
  };

  const event: ShootingUsageEvent = {
    visitId: "v1",
    date: "2025-01-05T00:00:00.000Z",
    dateKey: "2025-01-05",
    location: "Test Range",
    firearmId: "f1",
    firearmName: "Glock 19",
    caliber: "9mm",
    rounds: 10,
  };

  it("renders the section heading", () => {
    const { getByText } = render(
      <VisitCalendarSection
        daily={[daily({ dateKey: "2025-01-05", rounds: 10, visitCount: 1, visitIds: ["v1"] })]}
        visits={[visit]}
        events={[event]}
        period={period}
        firearmSelection={{ kind: "all" }}
        currency="USD"
        onOpenVisit={jest.fn()}
      />
    );

    expect(getByText("RANGE VISITS")).toBeTruthy();
  });
});
