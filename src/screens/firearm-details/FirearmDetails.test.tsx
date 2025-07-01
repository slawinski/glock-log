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
import FirearmDetailsScreen from "./FirearmDetails";
import { storage } from "../../services/storage-new";
import { FirearmStorage } from "../../validation/storageSchemas";

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
  datePurchased: new Date().toISOString(),
  amountPaid: 500,
  roundsFired: 1000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  notes: "Test notes",
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
      expect(screen.getByText(/ROUNDS FIRED/)).toBeTruthy();
      expect(
        screen.getByText(`${mockFirearm.roundsFired} rounds`)
      ).toBeTruthy();
      expect(screen.getByText(/DATE PURCHASED/)).toBeTruthy();
      expect(
        screen.getByText(
          new Date(mockFirearm.datePurchased).toLocaleDateString()
        )
      ).toBeTruthy();
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
      const deleteButton = screen.getByText(/DELETE/);
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
      const deleteButton = screen.getByText(/DELETE/);
      fireEvent.press(deleteButton);
    });

    // Simulate pressing the Delete button in the Alert
    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const deleteButton = alertButtons.find(
      (button: any) => button.text === "Delete"
    );
    deleteButton.onPress();

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
      const deleteButton = screen.getByText(/DELETE/);
      fireEvent.press(deleteButton);
    });

    // Simulate pressing the Delete button in the Alert
    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const deleteButton = alertButtons.find(
      (button: any) => button.text === "Delete"
    );
    deleteButton.onPress();

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
      const editButton = screen.getByText(/EDIT/);
      fireEvent.press(editButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith("EditFirearm", {
      id: mockFirearm.id,
    });
  });

  it("navigates back when back button is pressed", async () => {
    (storage.getFirearms as jest.Mock).mockResolvedValue([mockFirearm]);
    renderScreen();

    await waitFor(() => {
      const backButton = screen.getByText(/BACK/);
      fireEvent.press(backButton);
    });

    expect(mockGoBack).toHaveBeenCalled();
  });
});
