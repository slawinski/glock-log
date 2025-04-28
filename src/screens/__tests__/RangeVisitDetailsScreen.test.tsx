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
import RangeVisitDetailsScreen from "../../screens/RangeVisitDetailsScreen";
import { storage } from "../../services/storage";
import {
  FirearmStorage,
  RangeVisitStorage,
} from "../../validation/storageSchemas";

// Mock the storage service
jest.mock("../services/storage", () => ({
  storage: {
    getRangeVisits: jest.fn(),
    getFirearms: jest.fn(),
    deleteRangeVisit: jest.fn(),
  },
}));

// Mock Alert
jest.spyOn(Alert, "alert");

// Mock navigation
const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

const mockFirearm: FirearmStorage = {
  id: "firearm-1",
  modelName: "Test Firearm",
  caliber: "9mm",
  datePurchased: new Date().toISOString(),
  amountPaid: 500,
  roundsFired: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  notes: "Test notes",
};

const mockVisit: RangeVisitStorage = {
  id: "visit-1",
  location: "Test Range",
  date: new Date().toISOString(),
  firearmsUsed: ["firearm-1"],
  roundsPerFirearm: {
    "firearm-1": 100,
  },
  ammunitionUsed: {
    "9mm": 100,
  },
  notes: "Test visit notes",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
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
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText(/RANGE VISIT DETAILS/)).toBeTruthy();
      expect(screen.getByText(/Test Range/)).toBeTruthy();
      expect(
        screen.getByText(new Date(mockVisit.date).toLocaleDateString())
      ).toBeTruthy();
      expect(
        screen.getByText(`${mockFirearm.modelName} (${mockFirearm.caliber})`)
      ).toBeTruthy();
      expect(
        screen.getByText(
          `Rounds Fired: ${mockVisit.roundsPerFirearm[mockFirearm.id]}`
        )
      ).toBeTruthy();
      expect(
        screen.getByText(
          `TOTAL ROUNDS FIRED: ${Object.values(
            mockVisit.roundsPerFirearm
          ).reduce((a, b) => a + b, 0)}`
        )
      ).toBeTruthy();
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
    (storage.getRangeVisits as jest.Mock).mockRejectedValue(
      new Error("Failed to load")
    );
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load range visit data/)).toBeTruthy();
    });
  });

  it("shows confirmation dialog when delete button is pressed", async () => {
    (storage.getRangeVisits as jest.Mock).mockResolvedValue([mockVisit]);
    (storage.getFirearms as jest.Mock).mockResolvedValue([mockFirearm]);
    renderScreen();

    await waitFor(() => {
      const deleteButton = screen.getByText(/DELETE/);
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
    (storage.deleteRangeVisit as jest.Mock).mockResolvedValue(undefined);
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
      expect(storage.deleteRangeVisit).toHaveBeenCalledWith(mockVisit.id);
    });
  });

  it("shows error alert when deletion fails", async () => {
    (storage.getRangeVisits as jest.Mock).mockResolvedValue([mockVisit]);
    (storage.getFirearms as jest.Mock).mockResolvedValue([mockFirearm]);
    (storage.deleteRangeVisit as jest.Mock).mockRejectedValue(
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
        "Failed to delete range visit"
      );
    });
  });

  it("navigates to edit screen when edit button is pressed", async () => {
    (storage.getRangeVisits as jest.Mock).mockResolvedValue([mockVisit]);
    (storage.getFirearms as jest.Mock).mockResolvedValue([mockFirearm]);
    renderScreen();

    await waitFor(() => {
      const editButton = screen.getByText(/EDIT/);
      fireEvent.press(editButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith("EditRangeVisit", {
      id: mockVisit.id,
    });
  });
});
