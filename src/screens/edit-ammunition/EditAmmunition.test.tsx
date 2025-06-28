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
import EditAmmunitionScreen from "./EditAmmunition";
import { storage } from "../../services/storage-new";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AmmunitionStorage } from "../../validation/storageSchemas";

// Mock the storage module
jest.mock("../../services/storage-new");

// Mock Alert
jest.spyOn(Alert, "alert");

// Mock navigation
const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: { id: "test-id" },
    }),
  };
});

const mockAmmunition: AmmunitionStorage = {
  id: "ammo-1",
  caliber: "9mm",
  brand: "Federal",
  grain: "115",
  quantity: 1000,
  amountPaid: 299.99,
  datePurchased: "2024-01-01T00:00:00.000Z",
  notes: "Test notes",
  photos: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const Stack = createNativeStackNavigator();

const renderScreen = () => {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="EditAmmunition" component={EditAmmunitionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe("EditAmmunitionScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getAmmunition as jest.Mock).mockResolvedValue([mockAmmunition]);
  });

  it("shows loading state initially", async () => {
    renderScreen();
    expect(screen.getByText(/LOADING DATABASE/)).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByText(/LOADING DATABASE/)).toBeNull();
    });
  });

  it("shows error state when ammunition is not found", async () => {
    (storage.getAmmunition as jest.Mock).mockResolvedValue([]);
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText(/Ammunition not found/)).toBeTruthy();
    });
  });

  it("renders form with existing ammunition data", async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByDisplayValue("9mm")).toBeTruthy();
      expect(screen.getByDisplayValue("Federal")).toBeTruthy();
      expect(screen.getByDisplayValue("115")).toBeTruthy();
      expect(screen.getByDisplayValue("1000")).toBeTruthy();
      expect(screen.getByDisplayValue("299.99")).toBeTruthy();
      expect(screen.getByDisplayValue("Test notes")).toBeTruthy();
    });
  });

  it("handles form input changes", async () => {
    renderScreen();
    await waitFor(() => {
      const caliberInput = screen.getByDisplayValue("9mm");
      fireEvent.changeText(caliberInput, "45 ACP");
      expect(screen.getByDisplayValue("45 ACP")).toBeTruthy();
    });
  });

  it("handles date picker interaction", async () => {
    renderScreen();
    await waitFor(() => {
      const formattedDate = new Date(
        mockAmmunition.datePurchased
      ).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const dateButton = screen.getByText(formattedDate);
      fireEvent.press(dateButton);
      const datePickerElement = screen.UNSAFE_getByType(DateTimePicker);
      expect(datePickerElement).toBeTruthy();
    });
  });

  it("shows validation error when required fields are missing", async () => {
    renderScreen();
    await waitFor(() => {
      const caliberInput = screen.getByDisplayValue("9mm");
      fireEvent.changeText(caliberInput, "");
      const saveButton = screen.getByText(/SAVE CHANGES/);
      fireEvent.press(saveButton);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Validation error",
        expect.any(String)
      );
    });
  });

  it("saves ammunition when form is valid", async () => {
    (storage.saveAmmunition as jest.Mock).mockResolvedValue(undefined);
    renderScreen();
    await waitFor(() => {
      const saveButton = screen.getByText(/SAVE CHANGES/);
      fireEvent.press(saveButton);
      expect(storage.saveAmmunition).toHaveBeenCalledWith(
        expect.objectContaining({
          caliber: "9mm",
          brand: "Federal",
          grain: "115",
          quantity: 1000,
          amountPaid: 299.99,
        })
      );
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it("shows error alert when saving fails", async () => {
    (storage.saveAmmunition as jest.Mock).mockRejectedValue(
      new Error("Save failed")
    );
    renderScreen();
    await waitFor(() => {
      const saveButton = screen.getByText(/SAVE CHANGES/);
      fireEvent.press(saveButton);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to update ammunition. Please try again."
      );
    });
  });

  it("navigates back when cancel button is pressed", async () => {
    renderScreen();
    await waitFor(() => {
      const cancelButton = screen.getByText(/CANCEL/);
      fireEvent.press(cancelButton);
      expect(mockGoBack).toHaveBeenCalled();
    });
  });
});
