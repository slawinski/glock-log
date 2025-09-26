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
import { AmmunitionStorage } from "../../validation/storageSchemas";

// Define types for the mock functions
type GetAmmunitionMock = jest.Mock<() => Promise<AmmunitionStorage[]>>;
type DeleteAmmunitionMock = jest.Mock<() => Promise<void>>;
type GetCurrencyMock = jest.Mock<() => Promise<string>>;

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
  datePurchased: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
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
        screen.getByText(
          `${mockAmmunition.caliber} - ${mockAmmunition.grain}gr`
        )
      ).toBeTruthy();
      expect(
        screen.getByText(`${mockAmmunition.quantity} rounds`)
      ).toBeTruthy();
      expect(screen.getByText(`$${mockAmmunition.amountPaid.toFixed(2)}`)).toBeTruthy();
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
      const deleteButton = screen.getByText("DELETE");
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
      const deleteButton = screen.getByText("DELETE");
      fireEvent.press(deleteButton);
    });

    // Simulate pressing the Delete button in the Alert
    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2] as Array<{
      text: string;
      onPress: () => void;
    }>;
    const deleteButton = alertButtons.find(
      (button) => button.text === "Delete"
    );
    deleteButton?.onPress();

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
      const deleteButton = screen.getByText("DELETE");
      fireEvent.press(deleteButton);
    });

    // Simulate pressing the Delete button in the Alert
    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2] as Array<{
      text: string;
      onPress: () => void;
    }>;
    const deleteButton = alertButtons.find(
      (button) => button.text === "Delete"
    );
    deleteButton?.onPress();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to delete ammunition. Please try again."
      );
    });
  });
});
