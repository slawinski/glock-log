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
    getFirearms: jest.fn(),
  },
}));

// Mock Alert
jest.spyOn(Alert, "alert");

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
  { id: "firearm-1", modelName: "Glock 19" },
  { id: "firearm-2", modelName: "Glock 17" },
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
  });

  it("renders all form fields", async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText(/LOCATION/)).toBeTruthy();
      expect(screen.getByText(/DATE/)).toBeTruthy();
      expect(screen.getByText(/FIREARMS USED/)).toBeTruthy();
      expect(screen.getByText(/PHOTOS/)).toBeTruthy();
      expect(screen.getByText(/CANCEL/)).toBeTruthy();
      expect(screen.getByText(/SAVE VISIT/)).toBeTruthy();
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

    const locationInput = screen.getByPlaceholderText(/Enter range location/);
    fireEvent.changeText(locationInput, "Test Range");

    await waitFor(() => {
      expect(locationInput.props.value).toBe("Test Range");
    });
  });

  it("handles firearm selection and rounds input", async () => {
    renderScreen();

    await waitFor(() => {
      const glock19Button = screen.getByText("Glock 19");
      fireEvent.press(glock19Button);
    });

    const roundsInput = screen.getByPlaceholderText(/Rounds fired/);
    fireEvent.changeText(roundsInput, "100");

    await waitFor(() => {
      expect(roundsInput.props.value).toBe("100");
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

    expect(ImagePicker.launchImageLibrary).toHaveBeenCalled();
  });

  it("shows validation error when required fields are missing", async () => {
    (storage.saveRangeVisit as jest.Mock).mockResolvedValue(undefined);
    renderScreen();

    const saveButton = screen.getByText(/SAVE VISIT/);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Validation error",
        expect.any(String)
      );
    });
  });

  it("saves range visit when form is valid", async () => {
    (storage.saveRangeVisit as jest.Mock).mockResolvedValue(undefined);
    renderScreen();

    // Fill in required fields
    const locationInput = screen.getByPlaceholderText(/Enter range location/);
    fireEvent.changeText(locationInput, "Test Range");

    // Select a firearm and enter rounds
    await waitFor(() => {
      const glock19Button = screen.getByText("Glock 19");
      fireEvent.press(glock19Button);
    });

    const roundsInput = screen.getByPlaceholderText(/Rounds fired/);
    fireEvent.changeText(roundsInput, "100");

    const saveButton = screen.getByText(/SAVE VISIT/);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(storage.saveRangeVisit).toHaveBeenCalledWith(
        expect.objectContaining({
          location: "Test Range",
          firearmsUsed: ["firearm-1"],
          roundsPerFirearm: { "firearm-1": 100 },
        })
      );
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it("shows error alert when saving fails", async () => {
    (storage.saveRangeVisit as jest.Mock).mockRejectedValue(
      new Error("Save failed")
    );
    renderScreen();

    const locationInput = screen.getByPlaceholderText(/Enter range location/);
    fireEvent.changeText(locationInput, "Test Range");

    // Select a firearm directly by its model name
    await waitFor(() => {
      const glock19Button = screen.getByText("Glock 19");
      fireEvent.press(glock19Button);
    });

    const roundsInput = screen.getByPlaceholderText(/Rounds fired/);
    fireEvent.changeText(roundsInput, "100");

    const saveButton = screen.getByText(/SAVE VISIT/);
    fireEvent.press(saveButton);

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

    const dateButton = screen.getByText(new Date().toLocaleDateString());
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
      expect(screen.getByText(/Failed to load firearms/)).toBeTruthy();
    });
  });
});
