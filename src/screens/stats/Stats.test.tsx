import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { Alert } from "react-native";
import StatsScreen from "./Stats";
import { storage } from "../../services/storage-new";
import {
  FirearmStorage,
  RangeVisitStorage,
} from "../../validation/storageSchemas";

// Mock the storage module
jest.mock("../../services/storage-new");

// Mock Alert
jest.spyOn(Alert, "alert");

const mockFirearms: FirearmStorage[] = [
  {
    id: "firearm-1",
    modelName: "Glock 19",
    caliber: "9mm",
    roundsFired: 500,
    amountPaid: 600,
    datePurchased: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "firearm-2",
    modelName: "AR-15",
    caliber: "5.56",
    roundsFired: 1500,
    amountPaid: 1200,
    datePurchased: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockAmmunition = [
  {
    id: "ammo-1",
    caliber: "9mm",
    brand: "Federal",
    grain: 115,
    quantity: 1000,
    amountPaid: 300,
  },
  {
    id: "ammo-2",
    caliber: "5.56",
    brand: "PMC",
    grain: 55,
    quantity: 500,
    amountPaid: 250,
  },
];

const mockRangeVisits: RangeVisitStorage[] = [
  {
    id: "visit-1",
    date: "2024-01-01T00:00:00.000Z",
    location: "Test Range 1",
    firearmsUsed: ["firearm-1", "firearm-2"],
    ammunitionUsed: {
      "firearm-1": { ammunitionId: "ammo-1", rounds: 50 },
      "firearm-2": { ammunitionId: "ammo-2", rounds: 100 },
    },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "visit-2",
    date: "2024-02-01T00:00:00.000Z",
    location: "Test Range 2",
    firearmsUsed: ["firearm-1", "firearm-2"],
    ammunitionUsed: {
      "firearm-1": { ammunitionId: "ammo-1", rounds: 100 },
      "firearm-2": { ammunitionId: "ammo-2", rounds: 50 },
    },
    createdAt: "2024-02-01T00:00:00.000Z",
    updatedAt: "2024-02-01T00:00:00.000Z",
  },
];

describe("StatsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getFirearms as jest.Mock).mockResolvedValue(mockFirearms);
    (storage.getAmmunition as jest.Mock).mockResolvedValue(mockAmmunition);
    (storage.getRangeVisits as jest.Mock).mockResolvedValue(mockRangeVisits);
  });

  it("shows loading state initially", async () => {
    render(<StatsScreen />);
    expect(screen.getByText(/LOADING DATABASE/)).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByText(/LOADING DATABASE/)).toBeNull();
    });
  });

  it("shows error state when data fetch fails", async () => {
    (storage.getFirearms as jest.Mock).mockRejectedValue(
      new Error("Fetch failed")
    );
    render(<StatsScreen />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load statistics/)).toBeTruthy();
    });
  });

  it("renders all three tabs", async () => {
    render(<StatsScreen />);
    await waitFor(() => {
      expect(screen.getByText("VISITS")).toBeTruthy();
      expect(screen.getByText("FIREARMS")).toBeTruthy();
      expect(screen.getByText("AMMUNITION")).toBeTruthy();
    });
  });

  describe("Visits Tab", () => {
    it("shows correct visit statistics", async () => {
      render(<StatsScreen />);

      // First switch to the Visits tab
      await waitFor(() => {
        const visitsTab = screen.getByText("VISITS");
        fireEvent.press(visitsTab);
      });

      await waitFor(() => {
        expect(screen.getByText("TOTAL VISITS")).toBeTruthy();
        expect(screen.getByText("2")).toBeTruthy(); // Total visits
        expect(screen.getByText("TOTAL ROUNDS FIRED")).toBeTruthy();
        expect(screen.getByText("300")).toBeTruthy(); // Total rounds fired
        expect(screen.getByText("MOST VISITED LOCATION")).toBeTruthy();
        expect(screen.getByText("AVERAGE ROUNDS PER VISIT")).toBeTruthy();
        expect(screen.getByText("150.0")).toBeTruthy(); // Average rounds per visit
      });
    });
  });

  describe("Firearms Tab", () => {
    it("shows correct firearm statistics", async () => {
      render(<StatsScreen />);
      await waitFor(() => {
        const firearmsTab = screen.getByText("FIREARMS");
        fireEvent.press(firearmsTab);

        expect(screen.getByText("TOTAL FIREARMS")).toBeTruthy();
        expect(screen.getByText("2")).toBeTruthy(); // Total firearms
        expect(screen.getByText("TOTAL VALUE")).toBeTruthy();
        expect(screen.getByText(/1300\.00/)).toBeTruthy(); // Total value
        expect(screen.getByText("MOST COMMON CALIBER")).toBeTruthy();
        expect(screen.getByText("MOST USED FIREARM")).toBeTruthy();
        // Find the most used firearm text that includes both the name and rounds
        expect(
          screen.getByText(/Glock 19\s*\(\s*1000\s*rounds\s*\)/)
        ).toBeTruthy();
      });
    });

    it("allows selecting firearms for timeline", async () => {
      render(<StatsScreen />);

      // First switch to the Firearms tab
      await waitFor(() => {
        const firearmsTab = screen.getByText("FIREARMS");
        fireEvent.press(firearmsTab);
      });

      await waitFor(() => {
        // Check for the legend entries which show the firearm names
        expect(screen.getByText("[✓] Glock 19")).toBeTruthy();
        expect(screen.getByText("[✓] AR-15")).toBeTruthy();
      });
    });
  });

  describe("Ammunition Tab", () => {
    it("shows correct ammunition statistics", async () => {
      render(<StatsScreen />);
      await waitFor(() => {
        const ammunitionTab = screen.getByText("AMMUNITION");
        fireEvent.press(ammunitionTab);

        expect(screen.getByText("TOTAL ROUNDS")).toBeTruthy();
        expect(screen.getByText("1500")).toBeTruthy(); // Total rounds
        expect(screen.getByText("TOTAL SPENT")).toBeTruthy();
        expect(screen.getByText(/550\.00/)).toBeTruthy(); // Total spent
        expect(screen.getByText("COST PER ROUND")).toBeTruthy();
        expect(screen.getByText(/0\.37/)).toBeTruthy(); // Cost per round
        expect(screen.getByText("MOST STOCKED CALIBER")).toBeTruthy();
        expect(screen.getByText("9mm")).toBeTruthy();
      });
    });
  });

  it("handles retry after error", async () => {
    (storage.getFirearms as jest.Mock).mockRejectedValueOnce(
      new Error("Fetch failed")
    );
    render(<StatsScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load statistics/)).toBeTruthy();
    });

    const retryButton = screen.getByText("RETRY");
    fireEvent.press(retryButton);

    await waitFor(() => {
      expect(screen.queryByText(/Failed to load statistics/)).toBeNull();
    });
  });
});
