import React from "react";
import { jest, describe, beforeEach, it, expect } from "@jest/globals";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import EditRangeVisitScreen from "../EditRangeVisitScreen";
import { storage } from "../../services/storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "react-native-image-picker";

// Mock the storage service
jest.mock("../../services/storage", () => ({
  storage: {
    getRangeVisits: jest.fn(),
    saveRangeVisit: jest.fn(),
    getFirearms: jest.fn(),
    getAmmunition: jest.fn(),
    saveRangeVisitWithAmmunition: jest.fn(),
  },
}));

// Mock ImagePicker
jest.mock("react-native-image-picker", () => ({
  launchImageLibrary: jest.fn(),
}));

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

const mockFirearms = [
  {
    id: "firearm-1",
    modelName: "Glock 19",
    caliber: "9mm",
  },
  {
    id: "firearm-2",
    modelName: "AR-15",
    caliber: "5.56",
  },
];

const mockRangeVisit = {
  id: "test-id",
  date: "2024-01-01T00:00:00.000Z",
  location: "Test Range",
  notes: "Test notes",
  photos: [],
  firearmsUsed: ["firearm-1"],
  roundsPerFirearm: {
    "firearm-1": 50,
  },
  ammunitionUsed: {},
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const Stack = createNativeStackNavigator();

const renderScreen = () => {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="EditRangeVisit" component={EditRangeVisitScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe("EditRangeVisitScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getRangeVisits as jest.Mock).mockResolvedValue([mockRangeVisit]);
    (storage.getFirearms as jest.Mock).mockResolvedValue(mockFirearms);
    (storage.getAmmunition as jest.Mock).mockResolvedValue([]);
  });

  it("shows loading state initially", async () => {
    renderScreen();
    expect(screen.getByText(/LOADING DATABASE/)).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByText(/LOADING DATABASE/)).toBeNull();
    });
  });

  it("shows error state when range visit is not found", async () => {
    (storage.getRangeVisits as jest.Mock).mockResolvedValue([]);
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText(/Range visit not found/)).toBeTruthy();
    });
  });

  it("renders form with existing range visit data", async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Range")).toBeTruthy();
      expect(screen.getByDisplayValue("Test notes")).toBeTruthy();
      expect(screen.getByText("Glock 19")).toBeTruthy();
      expect(screen.getByText("AR-15")).toBeTruthy();
    });
  });

  it("handles form input changes", async () => {
    renderScreen();
    await waitFor(() => {
      const locationInput = screen.getByDisplayValue("Test Range");
      fireEvent.changeText(locationInput, "New Range");
      expect(screen.getByDisplayValue("New Range")).toBeTruthy();
    });
  });

  it("handles date picker interaction", async () => {
    renderScreen();
    await waitFor(() => {
      const dateButton = screen.getByText(
        new Date(mockRangeVisit.date).toLocaleDateString()
      );
      fireEvent.press(dateButton);
      const datePickerElement = screen.UNSAFE_getByType(DateTimePicker);
      expect(datePickerElement).toBeTruthy();
    });
  });

  it("handles firearm selection", async () => {
    renderScreen();
    await waitFor(() => {
      const firearmButton = screen.getByText("AR-15");
      fireEvent.press(firearmButton);
      expect(screen.getByText("AMMUNITION USED")).toBeTruthy();
    });
  });

  it("handles rounds input for selected firearm", async () => {
    renderScreen();
    await waitFor(() => {
      const firearmButton = screen.getByText("AR-15");
      fireEvent.press(firearmButton);
      const roundsInput = screen.getAllByPlaceholderText("Rounds used")[0];
      fireEvent.changeText(roundsInput, "100");
      expect(screen.getByDisplayValue("100")).toBeTruthy();
    });
  });

  it("handles image picker interaction", async () => {
    const mockImageResponse = {
      assets: [{ uri: "test-image-uri" }],
    };
    (ImagePicker.launchImageLibrary as jest.Mock).mockImplementation(
      (_, callback) => callback(mockImageResponse)
    );

    renderScreen();
    await waitFor(() => {
      const addPhotoButton = screen.getByText(/ADD PHOTO/);
      fireEvent.press(addPhotoButton);
      expect(ImagePicker.launchImageLibrary).toHaveBeenCalled();
    });
  });

  it("shows validation error when required fields are missing", async () => {
    renderScreen();
    await waitFor(() => {
      const locationInput = screen.getByDisplayValue("Test Range");
      fireEvent.changeText(locationInput, "");
      const saveButton = screen.getByText(/SAVE/);
      fireEvent.press(saveButton);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Validation error",
        expect.any(String)
      );
    });
  });

  it("saves range visit when form is valid", async () => {
    (storage.saveRangeVisitWithAmmunition as jest.Mock).mockResolvedValue(
      undefined
    );
    renderScreen();
    await waitFor(() => {
      const saveButton = screen.getByText(/SAVE/);
      fireEvent.press(saveButton);
      expect(storage.saveRangeVisitWithAmmunition).toHaveBeenCalledWith(
        expect.objectContaining({
          location: "Test Range",
          notes: "Test notes",
          firearmsUsed: ["firearm-1"],
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
    await waitFor(() => {
      const saveButton = screen.getByText(/SAVE/);
      fireEvent.press(saveButton);
      expect(Alert.alert).toHaveBeenCalledWith("Error", "Save failed");
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

  it("handles removing a firearm", async () => {
    renderScreen();
    await waitFor(() => {
      const firearmButton = screen.getByText("Glock 19");
      fireEvent.press(firearmButton);
      expect(screen.queryByText("Glock 19")).toBeTruthy();
    });
  });
});
