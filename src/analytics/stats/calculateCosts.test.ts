import { calculateCosts } from "./calculateCosts";
import { buildActivityIndex } from "./buildActivityIndex";
import { resolvePeriod } from "./period";
import { makeAmmo, makeFirearm, makeVisit, localIso } from "./fixtures";
import { parseISO } from "date-fns";

const today = parseISO("2026-08-12T12:00:00");

const periodFor = (index: ReturnType<typeof buildActivityIndex>) =>
  resolvePeriod("ALL", today, index);

describe("calculateCosts", () => {
  it("Case B: uses stored unit price, not amountPaid/current quantity", () => {
    const ammunition = [
      makeAmmo({
        id: "a1",
        quantity: 500,
        purchasedQuantity: 1000,
        amountPaid: 1000,
        pricePerRound: 1,
      }),
    ];
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition,
      rangeVisits: [
        makeVisit({ id: "v1", ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 500 } } }),
      ],
    });

    const costs = calculateCosts(index.events, index.visits, ammunition, periodFor(index));

    expect(costs.ammoFired).toBe(500);
    expect(costs.avgCostPerRound).toBe(1);
  });

  it("sums ammoPurchased only for purchases within the period", () => {
    const ammunition = [
      makeAmmo({ id: "a1", datePurchased: localIso(2026, 7, 1), amountPaid: 300 }),
      makeAmmo({ id: "a2", datePurchased: localIso(2024, 1, 1), amountPaid: 200 }),
    ];
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition,
      rangeVisits: [makeVisit({ id: "v1", ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 10 } } })],
    });

    const costs = calculateCosts(index.events, index.visits, ammunition, periodFor(index));
    expect(costs.ammoPurchased).toBe(300);
  });

  it("computes current stock value independent of period and firearm filters", () => {
    const ammunition = [
      makeAmmo({ id: "a1", quantity: 500, pricePerRound: 1 }),
      makeAmmo({ id: "a2", quantity: 10, pricePerRound: 5 }),
      makeAmmo({ id: "a3", quantity: 999, pricePerRound: undefined }),
    ];
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition,
      rangeVisits: [],
    });

    const costs = calculateCosts(index.events, index.visits, ammunition, periodFor(index));
    expect(costs.currentStockValue).toBe(500 * 1 + 10 * 5);
  });

  it("computes average ammo cost per firing visit", () => {
    const ammunition = [makeAmmo({ id: "a1", pricePerRound: 2 })];
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition,
      rangeVisits: [
        makeVisit({ id: "v1", ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 25 } } }),
        makeVisit({ id: "v2", ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 25 } } }),
      ],
    });

    const costs = calculateCosts(index.events, index.visits, ammunition, periodFor(index));
    expect(costs.ammoFired).toBe(100);
    expect(costs.avgAmmoCostPerVisit).toBe(50);
  });

  it("returns null average costs when nothing is priced", () => {
    const ammunition = [makeAmmo({ id: "a1", pricePerRound: undefined })];
    const index = buildActivityIndex({
      firearms: [makeFirearm({ id: "f1" })],
      ammunition,
      rangeVisits: [makeVisit({ ammunitionUsed: { f1: { ammunitionId: "a1", rounds: 50 } } })],
    });

    const costs = calculateCosts(index.events, index.visits, ammunition, periodFor(index));
    expect(costs.avgCostPerRound).toBeNull();
    expect(costs.ammoFired).toBe(0);
    expect(costs.hasPriceData).toBe(false);
  });
});
