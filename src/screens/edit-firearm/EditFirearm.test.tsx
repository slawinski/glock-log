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
import { EditFirearm as EditFirearmScreen } from "./EditFirearm";
import { storage } from "../../services/storage-new";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "react-native-image-picker";
import { FirearmStorage } from "../../validation/storageSchemas";

// Mock the storage module
jest.mock("../../services/storage-new");

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
      params: { id: "firearm-1" },
    }),
  };
});

const mockFirearm: FirearmStorage = {
  id: "firearm-1",
  modelName: "Glock 19",
  caliber: "9mm",
  datePurchased: "2024-01-01T00:00:00.000Z",
  amountPaid: 599.99,
  photos: [],
  notes: "Test notes",
  roundsFired: 0,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const Stack = createNativeStackNavigator();

const renderScreen = () => {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="EditFirearm" component={EditFirearmScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe("EditFirearmScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getFirearms as jest.Mock).mockResolvedValue([mockFirearm]);
  });

  it("shows loading state initially", async () => {
    renderScreen();
    expect(screen.getByText(/LOADING DATABASE/)).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByText(/LOADING DATABASE/)).toBeNull();
    });
  });

  it("shows error state when firearm is not found", async () => {
    (storage.getFirearms as jest.Mock).mockResolvedValue([]);
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText(/Firearm not found/)).toBeTruthy();
    });
  });

  it("renders form with existing firearm data", async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByDisplayValue("Glock 19")).toBeTruthy();
      expect(screen.getByDisplayValue("9mm")).toBeTruthy();
      expect(screen.getByDisplayValue("599.99")).toBeTruthy();
    });
  });

  it("handles form input changes", async () => {
    renderScreen();
    await waitFor(() => {
      const modelInput = screen.getByDisplayValue("Glock 19");
      fireEvent.changeText(modelInput, "Glock 17");
      expect(screen.getByDisplayValue("Glock 17")).toBeTruthy();
    });
  });

  it("handles date picker interaction", async () => {
    renderScreen();
    await waitFor(() => {
      const formattedDate = new Date(
        mockFirearm.datePurchased
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

  it("handles image picker interaction", async () => {
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
    await waitFor(() => {
      const addPhotoButton = screen.getByText(/ADD PHOTO/);
      fireEvent.press(addPhotoButton);
      expect(ImagePicker.launchImageLibrary).toHaveBeenCalled();
    });
  });

  it("shows validation error when required fields are missing", async () => {
    renderScreen();
    await waitFor(() => {
      const modelInput = screen.getByDisplayValue("Glock 19");
      fireEvent.changeText(modelInput, "");
      const saveButton = screen.getByText(/SAVE CHANGES/);
      fireEvent.press(saveButton);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Validation error",
        expect.any(String)
      );
    });
  });

  it("saves firearm when form is valid", async () => {
    (storage.saveFirearm as jest.Mock).mockResolvedValue(undefined);
    renderScreen();
    await waitFor(() => {
      const saveButton = screen.getByText(/SAVE CHANGES/);
      fireEvent.press(saveButton);
      expect(storage.saveFirearm).toHaveBeenCalledWith(
        expect.objectContaining({
          modelName: "Glock 19",
          caliber: "9mm",
          amountPaid: 599.99,
        })
      );
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it("shows error alert when saving fails", async () => {
    (storage.saveFirearm as jest.Mock).mockRejectedValue(
      new Error("Save failed")
    );
    renderScreen();
    await waitFor(() => {
      const saveButton = screen.getByText(/SAVE CHANGES/);
      fireEvent.press(saveButton);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to update firearm. Please try again."
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
