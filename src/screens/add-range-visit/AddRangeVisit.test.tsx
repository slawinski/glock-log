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
import { AddRangeVisit as AddRangeVisitScreen } from "./AddRangeVisit";
import { storage } from "../../services/storage-new";
import * as ImagePicker from "react-native-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  FirearmStorage,
  AmmunitionStorage,
} from "../../validation/storageSchemas";

// Mock the storage module
jest.mock("../../services/storage-new");

// Mock Alert
const originalAlert = Alert.alert;
beforeAll(() => {
  jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
    if (
      title === "Select Ammunition" &&
      Array.isArray(buttons) &&
      buttons.length > 0
    ) {
      // Simulate user selecting the first ammo option
      buttons[0].onPress && buttons[0].onPress();
    } else if (title === "Validation error") {
      // For validation errors, just log them
      console.error("Validation error:", message);
    } else if (title === "Error") {
      // For error alerts, just log them
      console.error("Error creating range visit:", message);
    } else {
      // For other alerts, call the original
      return originalAlert(title, message, buttons);
    }
  });
});

afterAll(() => {
  (Alert.alert as jest.Mock).mockRestore();
});

// Mock ImagePicker
jest.mock("react-native-image-picker", () => ({
  launchImageLibrary: jest.fn(),
}));

// Mock navigation
const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      goBack: mockGoBack,
    }),
  };
});

const mockFirearms: FirearmStorage[] = [
  {
    id: "firearm-1",
    modelName: "Glock 19",
    caliber: "9mm",
    datePurchased: "2023-01-01T00:00:00.000Z",
    amountPaid: 500,
    roundsFired: 100,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },
  {
    id: "firearm-2",
    modelName: "Glock 17",
    caliber: "9mm",
    datePurchased: "2023-01-01T00:00:00.000Z",
    amountPaid: 500,
    roundsFired: 200,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },
];

const mockAmmunition: AmmunitionStorage[] = [
  {
    id: "ammo-1",
    caliber: "9mm",
    brand: "Federal",
    grain: "115",
    quantity: 1000,
    amountPaid: 300,
    datePurchased: "2023-01-01T00:00:00.000Z",
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },
  {
    id: "ammo-2",
    caliber: "9mm",
    brand: "Blazer",
    grain: "124",
    quantity: 500,
    amountPaid: 150,
    datePurchased: "2023-01-01T00:00:00.000Z",
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },
];

const Stack = createNativeStackNavigator();

const renderScreen = async ({ waitForLoad = true } = {}) => {
  render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="AddRangeVisit" component={AddRangeVisitScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );

  if (waitForLoad) {
    await waitFor(() => {
      expect(screen.getByText(mockFirearms[0].modelName)).toBeTruthy();
    });
  }
};

describe("AddRangeVisitScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getFirearms as jest.Mock).mockResolvedValue(mockFirearms);
    (storage.getAmmunition as jest.Mock).mockResolvedValue(mockAmmunition);
    (storage.saveRangeVisitWithAmmunition as jest.Mock).mockResolvedValue(
      undefined
    );
  });

  it("renders all form fields", async () => {
    await renderScreen();

    expect(screen.getByText(/LOCATION/)).toBeTruthy();
    expect(screen.getByText(/VISIT DATE/)).toBeTruthy();
    expect(screen.getByText(/FIREARMS USED/)).toBeTruthy();
    expect(screen.getByText(/ADD PHOTOS/)).toBeTruthy();
    expect(screen.getByText(/CANCEL/)).toBeTruthy();
    expect(screen.getByText(/SAVE/)).toBeTruthy();
  });

  it("loads and displays firearms", async () => {
    await renderScreen();

    expect(screen.getByText("Glock 19")).toBeTruthy();
    expect(screen.getByText("Glock 17")).toBeTruthy();
  });

  it("handles form input changes", async () => {
    await renderScreen();

    const locationInput = screen.getByTestId("location-input");
    fireEvent.changeText(locationInput, "Test Range");
    expect(locationInput.props.value).toBe("Test Range");
  });

  it("handles firearm selection and rounds input", async () => {
    await renderScreen();

    // Enter location first (required field)
    const locationInput = screen.getByTestId("location-input");
    fireEvent.changeText(locationInput, "Test Range");

    // Simulate firearm selection
    fireEvent.press(screen.getByText("Glock 19"));

    // Simulate rounds input
    const roundsInput = screen.getByTestId(
      `rounds-input-${mockFirearms[0].id}`
    );
    fireEvent.changeText(roundsInput, "100");

    // Simulate ammunition selection
    fireEvent.press(screen.getByText("Select Ammunition"));
    // The mock Alert.alert will automatically select the first option
    await waitFor(() => {
      expect(screen.getByText("Federal")).toBeTruthy(); // Check if the selected ammo brand is displayed
    });

    // Save the form
    const saveButton = screen.getByText(/SAVE/);
    fireEvent.press(saveButton);

    // Verify save was called with correct data
    await waitFor(() => {
      expect(storage.saveRangeVisitWithAmmunition).toHaveBeenCalledWith(
        expect.objectContaining({
          location: "Test Range",
          firearmsUsed: ["firearm-1"],
          ammunitionUsed: {
            "firearm-1": {
              ammunitionId: mockAmmunition[0].id,
              rounds: 100,
            },
          },
        })
      );
    });
  });

  it("handles image picker", async () => {
    const mockImageResponse = {
      assets: [
        {
          uri: "test-image-uri",
        },
      ],
    };

    (ImagePicker.launchImageLibrary as jest.Mock).mockImplementation(
      (_, callback) => callback(mockImageResponse)
    );

    await renderScreen();

    const addPhotoButton = screen.getByText(/ADD PHOTOS/);
    fireEvent.press(addPhotoButton);

    await waitFor(() => {
      expect(ImagePicker.launchImageLibrary).toHaveBeenCalled();
    });
  });

  it("shows validation error when required fields are missing", async () => {
    await renderScreen();

    const saveButton = screen.getByText(/SAVE/);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Validation error",
        expect.any(String)
      );
    });
  });

  it("handles firearm selection, ammunition selection, and form save", async () => {
    await renderScreen();

    // Enter location first (required field)
    const locationInput = screen.getByTestId("location-input");
    fireEvent.changeText(locationInput, "Test Range");

    // Simulate firearm selection first
    fireEvent.press(screen.getByText("Glock 19"));

    // Now the rounds input should be available
    const roundsInput = screen.getByTestId(
      `rounds-input-${mockFirearms[0].id}`
    );
    fireEvent.changeText(roundsInput, "100");

    // Simulate ammunition selection
    fireEvent.press(screen.getByText("Select Ammunition"));
    // The mock Alert.alert will automatically select the first option
    await waitFor(() => {
      expect(screen.getByText("Federal")).toBeTruthy(); // Check if the selected ammo brand is displayed
    });

    // Save the form
    const saveButton = screen.getByText(/SAVE/);
    fireEvent.press(saveButton);

    // Verify save was called with correct data
    await waitFor(() => {
      expect(storage.saveRangeVisitWithAmmunition).toHaveBeenCalledWith(
        expect.objectContaining({
          location: "Test Range",
          firearmsUsed: ["firearm-1"],
          ammunitionUsed: {
            "firearm-1": {
              ammunitionId: mockAmmunition[0].id,
              rounds: 100,
            },
          },
        })
      );
    });
  });

  it("shows error alert when saving fails", async () => {
    (storage.saveRangeVisitWithAmmunition as jest.Mock).mockRejectedValue(
      new Error("Save failed")
    );
    await renderScreen();

    const locationInput = screen.getByTestId("location-input");
    fireEvent.changeText(locationInput, "Test Range");

    // Simulate firearm selection
    fireEvent.press(screen.getByText("Glock 19"));

    // Simulate rounds input
    const roundsInput = screen.getByTestId(
      `rounds-input-${mockFirearms[0].id}`
    );
    fireEvent.changeText(roundsInput, "100");

    // Simulate ammunition selection
    fireEvent.press(screen.getByText("Select Ammunition"));
    // The mock Alert.alert will automatically select the first option
    await waitFor(() => {
      expect(screen.getByText("Federal")).toBeTruthy(); // Check if the selected ammo brand is displayed
    });

    const saveButton = screen.getByText(/SAVE/);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to create range visit. Please try again."
      );
    });
  });

  it("navigates back when cancel button is pressed", async () => {
    await renderScreen();

    const cancelButton = screen.getByText(/CANCEL/);
    fireEvent.press(cancelButton);

    expect(mockGoBack).toHaveBeenCalled();
  });

  it("handles date picker interaction", async () => {
    await renderScreen();

    const formattedToday = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const dateButton = screen.getByText(formattedToday);
    fireEvent.press(dateButton);

    // DateTimePicker should be visible
    const datePickerElement = screen.UNSAFE_getByType(DateTimePicker);
    expect(datePickerElement).toBeTruthy();
  });

  it("adds a range visit with a borrowed firearm", async () => {
    await renderScreen();

    const locationInput = screen.getByTestId("location-input");
    fireEvent.changeText(locationInput, "Test Range");

    const addBorrowedButton = screen.getByText(
      /\+ Log ammunition for a borrowed firearm/
    );
    fireEvent.press(addBorrowedButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Select Ammunition",
        expect.any(String),
        expect.any(Array)
      );
    });

    // The mock Alert.alert will automatically select the first option
    // Wait for the borrowed rounds input to appear
    await waitFor(() =>
      expect(screen.getAllByTestId(/^borrowed-rounds-input-/).length).toBe(1)
    );

    // Fill in rounds for borrowed firearm
    // Find the borrowed rounds input using pattern matching since the key is dynamically generated
    const borrowedRoundsInputs = screen.getAllByTestId(
      /^borrowed-rounds-input-borrowed-/
    );
    expect(borrowedRoundsInputs.length).toBe(1);
    const borrowedRoundsInput = borrowedRoundsInputs[0];
    fireEvent.changeText(borrowedRoundsInput, "50");

    const saveButton = screen.getByText(/SAVE/);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(storage.saveRangeVisitWithAmmunition).toHaveBeenCalledWith(
        expect.objectContaining({
          location: "Test Range",
          firearmsUsed: [],
          ammunitionUsed: expect.any(Object),
        })
      );

      const savedData = (storage.saveRangeVisitWithAmmunition as jest.Mock).mock
        .calls[0][0];
      const ammoUsedKeys = Object.keys(savedData.ammunitionUsed);
      expect(ammoUsedKeys.length).toBe(1);
      expect(ammoUsedKeys[0]).toMatch(/^borrowed-/);
      expect(savedData.ammunitionUsed[ammoUsedKeys[0]]).toEqual({
        ammunitionId: mockAmmunition[0].id,
        rounds: 50,
      });
    });
  });

  it("shows error when firearms fail to load", async () => {
    (storage.getFirearms as jest.Mock).mockRejectedValue(
      new Error("Failed to load")
    );
    await renderScreen({ waitForLoad: false });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeTruthy();
    });
  });
});
