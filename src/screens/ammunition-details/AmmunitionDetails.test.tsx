import { jest, describe, beforeEach, it, expect } from "@jest/globals";
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AmmunitionDetails as AmmunitionDetailsScreen } from "./AmmunitionDetails";
import { storage } from "../../services/storage-new";
import {
  AmmunitionStorage,
  RangeVisitStorage,
} from "../../validation/storageSchemas";
import { formatDate } from "../../utils";

// Define types for the mock functions
type GetAmmunitionMock = jest.Mock<() => Promise<AmmunitionStorage[]>>;
type DeleteAmmunitionMock = jest.Mock<() => Promise<void>>;
type GetCurrencyMock = jest.Mock<() => Promise<string>>;
type GetRangeVisitsMock = jest.Mock<() => Promise<RangeVisitStorage[]>>;

// Mock the storage module
jest.mock("../../services/storage-new");

// Mock Alert
jest.spyOn(Alert, "alert");

const mockAmmunition: AmmunitionStorage = {
  id: "test-id",
  brand: "Test Brand",
  caliber: "9mm",
  grain: "115",
  quantity: 100,
  amountPaid: 29.99,
  datePurchased: "2026-08-12T00:00:00.000Z",
  createdAt: "2026-08-12T00:00:00.000Z",
  updatedAt: "2026-08-12T00:00:00.000Z",
};

const mockVisit: RangeVisitStorage = {
  id: "visit-1",
  location: "FSO Shooting Range",
  date: "2026-08-28T00:00:00.000Z",
  firearmsUsed: ["firearm-1"],
  ammunitionUsed: {
    "firearm-1": {
      ammunitionId: "test-id",
      rounds: 80,
    },
  },
  createdAt: "2026-08-28T00:00:00.000Z",
  updatedAt: "2026-08-28T00:00:00.000Z",
};

const Stack = createNativeStackNavigator();

const renderScreen = (initialParams = { id: "test-id" }) => {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="AmmunitionDetails"
          component={AmmunitionDetailsScreen}
          initialParams={initialParams}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe("AmmunitionDetailsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getCurrency as GetCurrencyMock).mockResolvedValue("USD");
    (storage.getRangeVisits as GetRangeVisitsMock).mockResolvedValue([]);
  });

  it("shows loading state initially", () => {
    (storage.getAmmunition as GetAmmunitionMock).mockImplementation(
      () => new Promise(() => {})
    );
    renderScreen();
    expect(screen.getByText("LOADING DATABASE...")).toBeTruthy();
  });

  it("displays ammunition details when loaded successfully", async () => {
    (storage.getAmmunition as GetAmmunitionMock).mockResolvedValue([
      mockAmmunition,
    ]);
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText(mockAmmunition.brand)).toBeTruthy();
      expect(
        screen.getByText(`${mockAmmunition.caliber} • ${mockAmmunition.grain}`)
      ).toBeTruthy();
      expect(screen.getByText("rounds remaining")).toBeTruthy();
      expect(screen.getByText("INVENTORY")).toBeTruthy();
      expect(screen.getByText("Initial quantity")).toBeTruthy();
      expect(screen.getByText("Remaining")).toBeTruthy();
      expect(screen.getByText("Used")).toBeTruthy();
      expect(screen.getByText("PURCHASE")).toBeTruthy();
      expect(screen.getByText("Total paid")).toBeTruthy();
      expect(screen.getByText("Purchase date")).toBeTruthy();
      expect(screen.getByText("Edit ammunition")).toBeTruthy();
      expect(screen.getByText("Delete ammunition")).toBeTruthy();
    });
  });

  it("shows derived usage from range visits", async () => {
    (storage.getAmmunition as GetAmmunitionMock).mockResolvedValue([
      mockAmmunition,
    ]);
    (storage.getRangeVisits as GetRangeVisitsMock).mockResolvedValue([
      mockVisit,
    ]);
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText("USAGE")).toBeTruthy();
      expect(
        screen.getByText(formatDate(mockVisit.date, "dd MMM yyyy"))
      ).toBeTruthy();
      expect(screen.getByText("80 rounds")).toBeTruthy();
      expect(screen.getByText(mockVisit.location)).toBeTruthy();
    });
  });

  it("shows depleted status and keeps history when quantity is zero", async () => {
    const depletedAmmo: AmmunitionStorage = {
      ...mockAmmunition,
      quantity: 0,
    };
    (storage.getAmmunition as GetAmmunitionMock).mockResolvedValue([
      depletedAmmo,
    ]);
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText("rounds remaining")).toBeTruthy();
      expect(screen.getByText("Status")).toBeTruthy();
      expect(screen.getByText("Depleted")).toBeTruthy();
      expect(screen.getByText("INVENTORY")).toBeTruthy();
      expect(screen.getByText("PURCHASE")).toBeTruthy();
    });
  });

  it("shows error message when ammunition is not found", async () => {
    (storage.getAmmunition as GetAmmunitionMock).mockResolvedValue([]);
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText("Ammunition not found")).toBeTruthy();
    });
  });

  it("shows error message when there is an error loading ammunition", async () => {
    (storage.getAmmunition as GetAmmunitionMock).mockRejectedValue(
      new Error("Failed to load")
    );
    renderScreen();

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load ammunition details. Please try again.")
      ).toBeTruthy();
    });
  });

  it("shows confirmation dialog when delete button is pressed", async () => {
    (storage.getAmmunition as GetAmmunitionMock).mockResolvedValue([
      mockAmmunition,
    ]);
    renderScreen();

    await waitFor(() => {
      const deleteButton = screen.getByText("Delete ammunition");
      fireEvent.press(deleteButton);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Delete Ammunition",
      "Are you sure you want to delete this ammunition? This action cannot be undone.",
      expect.any(Array)
    );
  });

  it("deletes ammunition when confirmed in dialog", async () => {
    (storage.getAmmunition as GetAmmunitionMock).mockResolvedValue([
      mockAmmunition,
    ]);
    (storage.deleteAmmunition as DeleteAmmunitionMock).mockResolvedValue(
      undefined
    );
    renderScreen();

    await waitFor(() => {
      const deleteButton = screen.getByText("Delete ammunition");
      fireEvent.press(deleteButton);
    });

    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2] as Array<{
      text: string;
      onPress: () => void;
    }>;
    const confirmButton = alertButtons.find(
      (button) => button.text === "Delete"
    );
    confirmButton?.onPress();

    await waitFor(() => {
      expect(storage.deleteAmmunition).toHaveBeenCalledWith(mockAmmunition.id);
    });
  });

  it("shows error alert when deletion fails", async () => {
    (storage.getAmmunition as GetAmmunitionMock).mockResolvedValue([
      mockAmmunition,
    ]);
    (storage.deleteAmmunition as DeleteAmmunitionMock).mockRejectedValue(
      new Error("Deletion failed")
    );
    renderScreen();

    await waitFor(() => {
      const deleteButton = screen.getByText("Delete ammunition");
      fireEvent.press(deleteButton);
    });

    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2] as Array<{
      text: string;
      onPress: () => void;
    }>;
    const confirmButton = alertButtons.find(
      (button) => button.text === "Delete"
    );
    confirmButton?.onPress();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to delete ammunition. Please try again."
      );
    });
  });
});
