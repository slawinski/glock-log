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
import { AddFirearm as AddFirearmScreen } from "./AddFirearm";
import { storage } from "../../services/storage-new";
import * as ImagePicker from "react-native-image-picker";

// Mock the storage module
jest.mock("../../services/storage-new");

// Mock Alert
jest.spyOn(Alert, "alert");

// Mock ImagePicker
jest.mock("react-native-image-picker", () => ({
  launchImageLibrary: jest.fn(),
}));

// Mock navigation
const mockGoBack = jest.fn();
const mockAddListener = jest.fn(() => jest.fn());
const mockDispatch = jest.fn();
jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      goBack: mockGoBack,
      addListener: mockAddListener,
      dispatch: mockDispatch,
    }),
  };
});

const Stack = createNativeStackNavigator();

const renderScreen = () => {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="AddFirearm" component={AddFirearmScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe("AddFirearmScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all form fields", () => {
    renderScreen();

    expect(screen.getByText(/MODEL NAME/)).toBeTruthy();
    expect(screen.getByText(/CALIBER/)).toBeTruthy();
    expect(screen.getByText(/AMOUNT PAID/)).toBeTruthy();
    expect(screen.getByText(/PURCHASE DATE/)).toBeTruthy();
    expect(screen.getByText(/ADD PHOTO/)).toBeTruthy();
    expect(screen.getByText(/Save firearm/)).toBeTruthy();
  });

  it("handles form input changes", () => {
    renderScreen();

    const modelNameInput = screen.getByTestId("model-name-input");
    const caliberInput = screen.getByTestId("caliber-input");
    const amountPaidInput = screen.getByTestId("amount-paid-input");

    fireEvent.changeText(modelNameInput, "Glock 19");
    fireEvent.changeText(caliberInput, "9mm");
    fireEvent.changeText(amountPaidInput, "500");

    expect(modelNameInput.props.value).toBe("Glock 19");
    expect(caliberInput.props.value).toBe("9mm");
    expect(amountPaidInput.props.value).toBe("500");
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

  it("shows field errors when required fields are missing", async () => {
    (storage.saveFirearm as jest.Mock).mockResolvedValue(undefined);
    renderScreen();

    const saveButton = screen.getByText(/Save firearm/);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Enter a model name./)).toBeTruthy();
      expect(screen.getByText(/Enter a caliber./)).toBeTruthy();
    });
    expect(storage.saveFirearm).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("saves firearm when form is valid", async () => {
    (storage.saveFirearm as jest.Mock).mockResolvedValue(undefined);
    renderScreen();

    const modelNameInput = screen.getByTestId("model-name-input");
    const caliberInput = screen.getByTestId("caliber-input");
    const amountPaidInput = screen.getByTestId("amount-paid-input");

    fireEvent.changeText(modelNameInput, "Glock 19");
    fireEvent.changeText(caliberInput, "9mm");
    fireEvent.changeText(amountPaidInput, "500");

    const saveButton = screen.getByText(/Save firearm/);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(storage.saveFirearm).toHaveBeenCalledWith(
        expect.objectContaining({
          modelName: "Glock 19",
          caliber: "9mm",
          amountPaid: 500,
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

    const modelNameInput = screen.getByTestId("model-name-input");
    const caliberInput = screen.getByTestId("caliber-input");
    const amountPaidInput = screen.getByTestId("amount-paid-input");

    fireEvent.changeText(modelNameInput, "Glock 19");
    fireEvent.changeText(caliberInput, "9mm");
    fireEvent.changeText(amountPaidInput, "500");

    const saveButton = screen.getByText(/Save firearm/);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to create firearm. Please try again."
      );
    });
  });
});
