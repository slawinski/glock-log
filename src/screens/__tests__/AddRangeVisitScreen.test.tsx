/* eslint-disable no-undef */
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
import AddRangeVisitScreen from "../AddRangeVisitScreen";
import { storage } from "../../services/storage";
import * as ImagePicker from "react-native-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

// Mock the storage service
jest.mock("../../services/storage", () => ({
  storage: {
    saveRangeVisit: jest.fn(),
    saveRangeVisitWithAmmunition: jest.fn(),
    getFirearms: jest.fn(),
    getAmmunition: jest.fn(),
  },
}));

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
      console.log("Validation error:", message);
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

const mockFirearms = [
  { id: "firearm-1", modelName: "Glock 19", caliber: "9mm" },
  { id: "firearm-2", modelName: "Glock 17", caliber: "9mm" },
];

const mockAmmunition = [
  {
    id: "ammo-1",
    caliber: "9mm",
    brand: "Federal",
    grain: 115,
    quantity: 100,
    amountPaid: 25,
  },
  {
    id: "ammo-2",
    caliber: "9mm",
    brand: "Blazer",
    grain: 124,
    quantity: 50,
    amountPaid: 15,
  },
];

const Stack = createNativeStackNavigator();

const renderScreen = () => {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="AddRangeVisit" component={AddRangeVisitScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
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
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText(/LOCATION/)).toBeTruthy();
      expect(screen.getByText(/VISIT DATE/)).toBeTruthy();
      expect(screen.getByText(/FIREARMS USED/)).toBeTruthy();
      expect(screen.getByText(/PHOTOS/)).toBeTruthy();
      expect(screen.getByText(/CANCEL/)).toBeTruthy();
      expect(screen.getByText(/SAVE/)).toBeTruthy();
    });
  });

  it("loads and displays firearms", async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText("Glock 19")).toBeTruthy();
      expect(screen.getByText("Glock 17")).toBeTruthy();
    });
  });

  it("handles form input changes", async () => {
    renderScreen();

    await waitFor(() => {
      const locationInput = screen.getByPlaceholderText(/Enter range location/);
      fireEvent.changeText(locationInput, "Test Range");
      expect(locationInput.props.value).toBe("Test Range");
    });
  });

  it("handles firearm selection and rounds input", async () => {
    renderScreen();

    // Enter location first (required field)
    const locationInput = screen.getByPlaceholderText(/Enter range location/);
    fireEvent.changeText(locationInput, "Test Range");

    // Select firearm
    await waitFor(() => {
      const glock19Button = screen.getByText("Glock 19");
      fireEvent.press(glock19Button);
    });

    // Enter rounds
    const roundsInput = screen.getByPlaceholderText(/Rounds used/);
    fireEvent.changeText(roundsInput, "100");
    fireEvent(roundsInput, "blur");

    // Select ammunition
    await waitFor(() => {
      const selectAmmoButton = screen.getByText("SELECT AMMO");
      fireEvent.press(selectAmmoButton);
    });

    // Ensure state is updated
    await waitFor(() => {
      expect(roundsInput.props.value).toBe("100");
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
            "firearm-1": { ammunitionId: expect.any(String), rounds: 100 },
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

    renderScreen();

    const addPhotoButton = screen.getByText(/ADD PHOTO/);
    fireEvent.press(addPhotoButton);

    await waitFor(() => {
      expect(ImagePicker.launchImageLibrary).toHaveBeenCalled();
    });
  });

  it("shows validation error when required fields are missing", async () => {
    renderScreen();

    const saveButton = screen.getByText(/SAVE/);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Validation error",
        expect.any(String)
      );
    });
  });

  it("saves range visit when form is valid", async () => {
    renderScreen();

    // Fill in required fields
    const locationInput = screen.getByPlaceholderText(/Enter range location/);
    fireEvent.changeText(locationInput, "Test Range");

    // Select a firearm and enter rounds
    await waitFor(() => {
      const glock19Button = screen.getByText("Glock 19");
      fireEvent.press(glock19Button);
    });

    const roundsInput = screen.getByPlaceholderText(/Rounds used/);
    fireEvent.changeText(roundsInput, "100");
    fireEvent(roundsInput, "blur");

    // Select ammunition for the firearm
    await waitFor(() => {
      const selectAmmoButton = screen.getByText("SELECT AMMO");
      fireEvent.press(selectAmmoButton);
    });

    // Save the form
    const saveButton = screen.getByText(/SAVE/);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(storage.saveRangeVisitWithAmmunition).toHaveBeenCalledWith(
        expect.objectContaining({
          location: "Test Range",
          firearmsUsed: ["firearm-1"],
          ammunitionUsed: {
            "firearm-1": { ammunitionId: expect.any(String), rounds: 100 },
          },
        })
      );
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it("shows error alert when saving fails", async () => {
    (storage.saveRangeVisitWithAmmunition as jest.Mock).mockRejectedValue(
      new Error("Save failed")
    );
    renderScreen();

    // Enter location
    const locationInput = screen.getByPlaceholderText(/Enter range location/);
    fireEvent.changeText(locationInput, "Test Range");

    // Select firearm
    await waitFor(() => {
      const glock19Button = screen.getByText("Glock 19");
      fireEvent.press(glock19Button);
    });

    // Enter rounds
    const roundsInput = screen.getByPlaceholderText(/Rounds used/);
    fireEvent.changeText(roundsInput, "100");
    fireEvent(roundsInput, "blur");

    // Select ammunition
    await waitFor(() => {
      const selectAmmoButton = screen.getByText("SELECT AMMO");
      fireEvent.press(selectAmmoButton);
    });

    // Ensure state is updated
    await waitFor(() => {
      expect(roundsInput.props.value).toBe("100");
    });

    // Save the form
    const saveButton = screen.getByText(/SAVE/);
    fireEvent.press(saveButton);

    // Verify error alert
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to create range visit. Please try again."
      );
    });
  });

  it("navigates back when cancel button is pressed", () => {
    renderScreen();

    const cancelButton = screen.getByText(/CANCEL/);
    fireEvent.press(cancelButton);

    expect(mockGoBack).toHaveBeenCalled();
  });

  it("handles date picker interaction", async () => {
    renderScreen();

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

  it("shows error when firearms fail to load", async () => {
    (storage.getFirearms as jest.Mock).mockRejectedValue(
      new Error("Failed to load")
    );
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeTruthy();
    });
  });
});
