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
import { RangeVisitDetails as RangeVisitDetailsScreen } from "./RangeVisitDetails";
import { storage } from "../../services/storage-new";
import {
  FirearmStorage,
  RangeVisitStorage,
  AmmunitionStorage,
} from "../../validation/storageSchemas";
import { formatDate } from "../../utils";
import { describe, it, expect, beforeEach } from "@jest/globals";

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

// Mock the storage module
jest.mock("../../services/storage-new");

// Mock Alert
jest.spyOn(Alert, "alert");

const mockFirearm: FirearmStorage = {
  id: "firearm-1",
  modelName: "Test Firearm",
  caliber: "9mm",
  datePurchased: "2025-03-04T00:00:00.000Z",
  amountPaid: 500,
  roundsFired: 0,
  createdAt: "2025-03-04T00:00:00.000Z",
  updatedAt: "2025-03-04T00:00:00.000Z",
  notes: "Test notes",
};

const mockAmmunition: AmmunitionStorage = {
  id: "ammo-1",
  caliber: "9mm",
  brand: "Test Brand",
  grain: "115",
  quantity: 1000,
  datePurchased: "2025-03-04T00:00:00.000Z",
  amountPaid: 300,
  createdAt: "2025-03-04T00:00:00.000Z",
  updatedAt: "2025-03-04T00:00:00.000Z",
  notes: "Test ammo notes",
};

const mockVisit: RangeVisitStorage = {
  id: "visit-1",
  location: "Test Range",
  date: "2026-08-28T00:00:00.000Z",
  firearmsUsed: ["firearm-1"],
  ammunitionUsed: {
    "firearm-1": {
      ammunitionId: "ammo-1",
      rounds: 100,
    },
  },
  notes: "Test visit notes",
  createdAt: "2026-08-28T00:00:00.000Z",
  updatedAt: "2026-08-28T00:00:00.000Z",
};

const Stack = createNativeStackNavigator();

const renderScreen = (initialParams = { id: "visit-1" }) => {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="RangeVisitDetails"
          component={RangeVisitDetailsScreen}
          initialParams={initialParams}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe("RangeVisitDetailsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state initially", () => {
    (storage.getRangeVisits as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );
    renderScreen();
    expect(screen.getByText(/LOADING DATABASE\.\.\./)).toBeTruthy();
  });

  it("displays range visit details when loaded successfully", async () => {
    (storage.getRangeVisits as jest.Mock).mockResolvedValue([mockVisit]);
    (storage.getFirearms as jest.Mock).mockResolvedValue([mockFirearm]);
    (storage.getAmmunition as jest.Mock).mockResolvedValue([mockAmmunition]);
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText(mockVisit.location)).toBeTruthy();
      expect(
        screen.getByText(formatDate(mockVisit.date, "dd MMM yyyy"))
      ).toBeTruthy();
      expect(screen.getByText("rounds fired")).toBeTruthy();
      expect(screen.getByText("FIREARMS")).toBeTruthy();
      expect(screen.getByText(mockFirearm.modelName)).toBeTruthy();
      expect(screen.getByText("100 rounds")).toBeTruthy();
      expect(
        screen.getByText(
          `${mockAmmunition.brand} ${mockAmmunition.caliber} ${mockAmmunition.grain}`
        )
      ).toBeTruthy();
      expect(screen.getByText("100 rounds consumed")).toBeTruthy();
      expect(screen.getByText(/Test visit notes/)).toBeTruthy();
    });
  });

  it("shows error message when range visit is not found", async () => {
    (storage.getRangeVisits as jest.Mock).mockResolvedValue([]);
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText(/Range visit not found/)).toBeTruthy();
    });
  });

  it("shows error message when there is an error loading range visit", async () => {
    (storage.getRangeVisits as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error("Failed to load"))
    );
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load range visit data/)).toBeTruthy();
    });
  });

  it("shows confirmation dialog when delete button is pressed", async () => {
    (storage.getRangeVisits as jest.Mock).mockResolvedValue([mockVisit]);
    (storage.getFirearms as jest.Mock).mockResolvedValue([mockFirearm]);
    (storage.getAmmunition as jest.Mock).mockResolvedValue([mockAmmunition]);
    renderScreen();

    await waitFor(() => {
      const deleteButton = screen.getByText("Delete visit");
      fireEvent.press(deleteButton);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Confirm Delete",
      "Are you sure you want to delete this range visit?",
      expect.any(Array)
    );
  });

  it("deletes range visit when confirmed in dialog", async () => {
    (storage.getRangeVisits as jest.Mock).mockResolvedValue([mockVisit]);
    (storage.getFirearms as jest.Mock).mockResolvedValue([mockFirearm]);
    (storage.getAmmunition as jest.Mock).mockResolvedValue([mockAmmunition]);
    (storage.deleteRangeVisit as jest.Mock).mockResolvedValue(undefined);
    renderScreen();

    await waitFor(() => {
      const deleteButton = screen.getByText("Delete visit");
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
      expect(storage.deleteRangeVisit).toHaveBeenCalledWith(mockVisit.id);
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it("shows error alert when deletion fails", async () => {
    (storage.getRangeVisits as jest.Mock).mockResolvedValue([mockVisit]);
    (storage.getFirearms as jest.Mock).mockResolvedValue([mockFirearm]);
    (storage.getAmmunition as jest.Mock).mockResolvedValue([mockAmmunition]);
    (storage.deleteRangeVisit as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error("Deletion failed"))
    );
    renderScreen();

    await waitFor(() => {
      const deleteButton = screen.getByText("Delete visit");
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
      expect(Alert.alert).toHaveBeenLastCalledWith(
        "Error",
        "Failed to delete range visit."
      );
    });
  });

  it("navigates to edit screen when edit button is pressed", async () => {
    (storage.getRangeVisits as jest.Mock).mockResolvedValue([mockVisit]);
    (storage.getFirearms as jest.Mock).mockResolvedValue([mockFirearm]);
    (storage.getAmmunition as jest.Mock).mockResolvedValue([mockAmmunition]);
    renderScreen();

    await waitFor(() => {
      const editButton = screen.getByText("Edit visit");
      fireEvent.press(editButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith("EditRangeVisit", {
      id: mockVisit.id,
    });
  });
});
