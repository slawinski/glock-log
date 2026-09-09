import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { Stats as StatsScreen } from "./Stats";
import { storage } from "../../services/storage-new";
import type {
  AmmunitionStorage,
  FirearmStorage,
  RangeVisitStorage,
} from "../../validation/storageSchemas";

jest.mock("../../services/storage-new", () => ({
  storage: {
    getFirearms: jest.fn(),
    getAmmunition: jest.fn(),
    getRangeVisits: jest.fn(),
    getCurrency: jest.fn(),
    getStatsPeriod: jest.fn(),
    setStatsPeriod: jest.fn(),
  },
}));

jest.mock("../../services/error-handler", () => ({
  handleError: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const daysAgo = (n: number): string =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

const mockFirearms: FirearmStorage[] = [
  {
    id: "firearm-1",
    modelName: "Glock 19",
    caliber: "9mm",
    roundsFired: 80,
    amountPaid: 600,
    datePurchased: daysAgo(400),
    createdAt: daysAgo(400),
    updatedAt: daysAgo(400),
  },
  {
    id: "firearm-2",
    modelName: "AR-15",
    caliber: "5.56",
    roundsFired: 100,
    amountPaid: 1200,
    datePurchased: daysAgo(400),
    createdAt: daysAgo(400),
    updatedAt: daysAgo(400),
  },
];

const mockAmmunition: AmmunitionStorage[] = [
  {
    id: "ammo-1",
    caliber: "9mm",
    brand: "Federal",
    grain: "115",
    quantity: 1000,
    datePurchased: daysAgo(400),
    amountPaid: 300,
    pricePerRound: 0.3,
    createdAt: daysAgo(400),
    updatedAt: daysAgo(400),
  },
  {
    id: "ammo-2",
    caliber: "5.56",
    brand: "PMC",
    grain: "55",
    quantity: 500,
    datePurchased: daysAgo(400),
    amountPaid: 250,
    pricePerRound: 0.5,
    createdAt: daysAgo(400),
    updatedAt: daysAgo(400),
  },
];

const mockRangeVisits: RangeVisitStorage[] = [
  {
    id: "visit-1",
    date: daysAgo(10),
    location: "Test Range 1",
    firearmsUsed: ["firearm-1", "firearm-2"],
    ammunitionUsed: {
      "firearm-1": { ammunitionId: "ammo-1", rounds: 50 },
      "firearm-2": { ammunitionId: "ammo-2", rounds: 100 },
    },
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
  },
  {
    id: "visit-2",
    date: daysAgo(20),
    location: "Test Range 2",
    firearmsUsed: ["firearm-1"],
    ammunitionUsed: {
      "firearm-1": { ammunitionId: "ammo-1", rounds: 30 },
    },
    createdAt: daysAgo(20),
    updatedAt: daysAgo(20),
  },
];

describe("StatsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getFirearms as jest.Mock).mockResolvedValue(mockFirearms);
    (storage.getAmmunition as jest.Mock).mockResolvedValue(mockAmmunition);
    (storage.getRangeVisits as jest.Mock).mockResolvedValue(mockRangeVisits);
    (storage.getCurrency as jest.Mock).mockResolvedValue("USD");
    (storage.getStatsPeriod as jest.Mock).mockResolvedValue("6M");
    (storage.setStatsPeriod as jest.Mock).mockResolvedValue(undefined);
  });

  it("shows loading then renders the dashboard controls", async () => {
    render(<StatsScreen />);

    expect(screen.getByText(/LOADING DATABASE/)).toBeTruthy();

    await waitFor(() => {
      expect(screen.queryByText(/LOADING DATABASE/)).toBeNull();
    });

    expect(screen.getByTestId("period-6M")).toBeTruthy();
    expect(screen.getByTestId("firearm-filter-button")).toBeTruthy();
  });

  it("shows the correct summary rounds and visits", async () => {
    render(<StatsScreen />);

    expect(await screen.findByLabelText("Rounds fired, 180")).toBeTruthy();
    expect(await screen.findByLabelText("Visits, 2")).toBeTruthy();
  });

  it("shows an error state and recovers on retry", async () => {
    (storage.getFirearms as jest.Mock).mockRejectedValueOnce(
      new Error("Fetch failed")
    );

    render(<StatsScreen />);

    await screen.findByText(/Failed to load statistics/);

    fireEvent.press(screen.getByText("Retry"));

    await waitFor(() => {
      expect(screen.queryByText(/Failed to load statistics/)).toBeNull();
    });

    expect(screen.getByTestId("period-6M")).toBeTruthy();
  });

  it("shows the empty state when there are no visits", async () => {
    (storage.getRangeVisits as jest.Mock).mockResolvedValue([]);

    render(<StatsScreen />);

    expect(await screen.findByText("NO SHOOTING DATA YET")).toBeTruthy();
  });
});
