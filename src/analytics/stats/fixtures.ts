import type {
  AmmunitionStorage,
  FirearmStorage,
  RangeVisitStorage,
} from "../../validation/storageSchemas";

export const localIso = (
  year: number,
  month: number,
  day: number,
  hour = 12
): string => {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  return `${year}-${mm}-${dd}T${hh}:00:00`;
};

export const makeFirearm = (
  overrides: Partial<FirearmStorage> = {}
): FirearmStorage => ({
  id: "f1",
  modelName: "Glock 17",
  caliber: "9mm",
  datePurchased: localIso(2020, 1, 1),
  amountPaid: 1000,
  roundsFired: 0,
  createdAt: localIso(2020, 1, 1),
  updatedAt: localIso(2020, 1, 1),
  ...overrides,
});

export const makeAmmo = (
  overrides: Partial<AmmunitionStorage> = {}
): AmmunitionStorage => ({
  id: "a1",
  caliber: "9mm",
  brand: "Brand",
  grain: "115gr",
  quantity: 100,
  datePurchased: localIso(2020, 1, 1),
  amountPaid: 100,
  pricePerRound: 1,
  createdAt: localIso(2020, 1, 1),
  updatedAt: localIso(2020, 1, 1),
  ...overrides,
});

export const makeVisit = (
  overrides: Partial<RangeVisitStorage> = {}
): RangeVisitStorage => ({
  id: "v1",
  date: localIso(2026, 1, 10),
  location: "Range",
  firearmsUsed: ["f1"],
  ammunitionUsed: {
    f1: { ammunitionId: "a1", rounds: 100 },
  },
  createdAt: localIso(2026, 1, 10),
  updatedAt: localIso(2026, 1, 10),
  ...overrides,
});
