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
import { FirearmDetails as FirearmDetailsScreen } from "./FirearmDetails";
import { storage } from "../../services/storage-new";
import {
  FirearmStorage,
  RangeVisitStorage,
} from "../../validation/storageSchemas";
import { formatDate } from "../../utils";

// Mock the storage module
jest.mock("../../services/storage-new");

// Mock Alert
jest.spyOn(Alert, "alert");

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
  };
});

const mockFirearm: FirearmStorage = {
  id: "firearm-1",
  modelName: "Test Firearm",
  caliber: "9mm",
  datePurchased: "2025-03-04T00:00:00.000Z",
  amountPaid: 500,
  roundsFired: 1000,
  createdAt: "2025-03-04T00:00:00.000Z",
  updatedAt: "2025-03-04T00:00:00.000Z",
  notes: "Test notes",
};

const borrowedFirearm: FirearmStorage = {
  ...mockFirearm,
  ownership: "borrowed",
};

const mockVisit: RangeVisitStorage = {
  id: "visit-1",
  location: "Test Range",
  date: "2026-08-28T00:00:00.000Z",
  firearmsUsed: ["firearm-1"],
  ammunitionUsed: {
    "firearm-1": {
      ammunitionId: "ammo-1",
      rounds: 150,
    },
  },
  createdAt: "2026-08-28T00:00:00.000Z",
  updatedAt: "2026-08-28T00:00:00.000Z",
};

const Stack = createNativeStackNavigator();

const renderScreen = (initialParams = { id: "firearm-1" }) => {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="FirearmDetails"
          component={FirearmDetailsScreen}
          initialParams={initialParams}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe("FirearmDetailsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getCurrency as jest.Mock).mockResolvedValue("USD");
    (storage.getRangeVisits as jest.Mock).mockResolvedValue([]);
  });

  it("shows loading state initially", () => {
    (storage.getFirearms as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );
    renderScreen();
    expect(screen.getByText(/LOADING DATABASE\.\.\./)).toBeTruthy();
  });

  it("displays firearm details when loaded successfully", async () => {
    (storage.getFirearms as jest.Mock).mockResolvedValue([mockFirearm]);
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText(mockFirearm.modelName)).toBeTruthy();
      expect(screen.getByText(mockFirearm.caliber)).toBeTruthy();
      expect(screen.getByText("rounds fired")).toBeTruthy();
      expect(screen.getByText("OVERVIEW")).toBeTruthy();
      expect(screen.getByText("Purchased")).toBeTruthy();
      expect(screen.getByText("Amount paid")).toBeTruthy();
      expect(screen.getByText("Edit firearm")).toBeTruthy();
      expect(screen.getByText("Delete firearm")).toBeTruthy();
    });
  });

  it("shows borrowed label and hides purchase rows for borrowed firearm", async () => {
    (storage.getFirearms as jest.Mock).mockResolvedValue([borrowedFirearm]);
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText(borrowedFirearm.modelName)).toBeTruthy();
      expect(screen.getByText("BORROWED")).toBeTruthy();
      expect(screen.getByText("Added")).toBeTruthy();
    });

    expect(screen.queryByText("Purchased")).toBeNull();
    expect(screen.queryByText("Amount paid")).toBeNull();
  });

  it("shows derived recent activity from range visits", async () => {
    (storage.getFirearms as jest.Mock).mockResolvedValue([mockFirearm]);
    (storage.getRangeVisits as jest.Mock).mockResolvedValue([mockVisit]);
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText("RECENT ACTIVITY")).toBeTruthy();
      expect(
        screen.getByText(formatDate(mockVisit.date, "dd MMM yyyy"))
      ).toBeTruthy();
      expect(screen.getByText("150 rounds")).toBeTruthy();
    });
  });

  it("shows error message when firearm is not found", async () => {
    (storage.getFirearms as jest.Mock).mockResolvedValue([]);
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText(/Firearm not found/)).toBeTruthy();
    });
  });

  it("shows error message when there is an error loading firearm", async () => {
    (storage.getFirearms as jest.Mock).mockRejectedValue(
      new Error("Failed to load")
    );
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load firearm details/)).toBeTruthy();
    });
  });

  it("shows confirmation dialog when delete button is pressed", async () => {
    (storage.getFirearms as jest.Mock).mockResolvedValue([mockFirearm]);
    renderScreen();

    await waitFor(() => {
      const deleteButton = screen.getByText("Delete firearm");
      fireEvent.press(deleteButton);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Delete Firearm",
      "Are you sure you want to delete this firearm? This action cannot be undone.",
      expect.any(Array)
    );
  });

  it("deletes firearm when confirmed in dialog", async () => {
    (storage.getFirearms as jest.Mock).mockResolvedValue([mockFirearm]);
    (storage.deleteFirearm as jest.Mock).mockResolvedValue(undefined);
    renderScreen();

    await waitFor(() => {
      const deleteButton = screen.getByText("Delete firearm");
      fireEvent.press(deleteButton);
    });

    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const confirmButton = alertButtons.find(
      (button: { text: string }) => button.text === "Delete"
    );
    confirmButton.onPress();

    await waitFor(() => {
      expect(storage.deleteFirearm).toHaveBeenCalledWith(mockFirearm.id);
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it("shows error alert when deletion fails", async () => {
    (storage.getFirearms as jest.Mock).mockResolvedValue([mockFirearm]);
    (storage.deleteFirearm as jest.Mock).mockRejectedValue(
      new Error("Deletion failed")
    );
    renderScreen();

    await waitFor(() => {
      const deleteButton = screen.getByText("Delete firearm");
      fireEvent.press(deleteButton);
    });

    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const confirmButton = alertButtons.find(
      (button: { text: string }) => button.text === "Delete"
    );
    confirmButton.onPress();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to delete firearm. Please try again."
      );
    });
  });

  it("navigates to edit screen when edit button is pressed", async () => {
    (storage.getFirearms as jest.Mock).mockResolvedValue([mockFirearm]);
    renderScreen();

    await waitFor(() => {
      const editButton = screen.getByText("Edit firearm");
      fireEvent.press(editButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith("EditFirearm", {
      id: mockFirearm.id,
    });
  });
});
