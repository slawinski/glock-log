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
import AddAmmunitionScreen from "../AddAmmunitionScreen";
import { storage } from "../../services/storage";
import DateTimePicker from "@react-native-community/datetimepicker";

// Mock the storage service
jest.mock("../../services/storage", () => ({
  storage: {
    saveAmmunition: jest.fn(),
  },
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
  };
});

const Stack = createNativeStackNavigator();

const renderScreen = () => {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="AddAmmunition" component={AddAmmunitionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe("AddAmmunitionScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all form fields", () => {
    renderScreen();

    expect(screen.getByText(/CALIBER/)).toBeTruthy();
    expect(screen.getByText(/BRAND/)).toBeTruthy();
    expect(screen.getByText(/GRAIN/)).toBeTruthy();
    expect(screen.getByText(/QUANTITY/)).toBeTruthy();
    expect(screen.getByText(/DATE PURCHASED/)).toBeTruthy();
    expect(screen.getByText(/AMOUNT PAID/)).toBeTruthy();
    expect(screen.getByText(/NOTES/)).toBeTruthy();
    expect(screen.getByText(/CANCEL/)).toBeTruthy();
    expect(screen.getByText(/SAVE AMMUNITION/)).toBeTruthy();
  });

  it("handles form input changes", () => {
    renderScreen();

    const caliberInput = screen.getByPlaceholderText(/e.g., 9mm/);
    const brandInput = screen.getByPlaceholderText(/e.g., Federal/);
    const grainInput = screen.getByPlaceholderText(/e.g., 115/);
    const quantityInput = screen.getByPlaceholderText(/e.g., 1000/);
    const amountPaidInput = screen.getByPlaceholderText(/e.g., 299.99/);
    const notesInput = screen.getByPlaceholderText(/Optional notes/);

    fireEvent.changeText(caliberInput, "9mm");
    fireEvent.changeText(brandInput, "Federal");
    fireEvent.changeText(grainInput, "115");
    fireEvent.changeText(quantityInput, "1000");
    fireEvent.changeText(amountPaidInput, "299.99");
    fireEvent.changeText(notesInput, "Test notes");

    expect(caliberInput.props.value).toBe("9mm");
    expect(brandInput.props.value).toBe("Federal");
    expect(grainInput.props.value).toBe("115");
    expect(quantityInput.props.value).toBe("1000");
    expect(amountPaidInput.props.value).toBe("299.99");
    expect(notesInput.props.value).toBe("Test notes");
  });

  it("shows validation error when required fields are missing", async () => {
    (storage.saveAmmunition as jest.Mock).mockResolvedValue(undefined);
    renderScreen();

    const saveButton = screen.getByText(/SAVE AMMUNITION/);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Validation error",
        expect.any(String)
      );
    });
  });

  it("saves ammunition when form is valid", async () => {
    (storage.saveAmmunition as jest.Mock).mockResolvedValue(undefined);
    renderScreen();

    const caliberInput = screen.getByPlaceholderText(/e.g., 9mm/);
    const brandInput = screen.getByPlaceholderText(/e.g., Federal/);
    const grainInput = screen.getByPlaceholderText(/e.g., 115/);
    const quantityInput = screen.getByPlaceholderText(/e.g., 1000/);
    const amountPaidInput = screen.getByPlaceholderText(/e.g., 299.99/);

    fireEvent.changeText(caliberInput, "9mm");
    fireEvent.changeText(brandInput, "Federal");
    fireEvent.changeText(grainInput, "115");
    fireEvent.changeText(quantityInput, "1000");
    fireEvent.changeText(amountPaidInput, "299.99");

    const saveButton = screen.getByText(/SAVE AMMUNITION/);
    fireEvent.press(saveButton);

    await waitFor(() => {
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

    const caliberInput = screen.getByPlaceholderText(/e.g., 9mm/);
    const brandInput = screen.getByPlaceholderText(/e.g., Federal/);
    const grainInput = screen.getByPlaceholderText(/e.g., 115/);
    const quantityInput = screen.getByPlaceholderText(/e.g., 1000/);
    const amountPaidInput = screen.getByPlaceholderText(/e.g., 299.99/);

    fireEvent.changeText(caliberInput, "9mm");
    fireEvent.changeText(brandInput, "Federal");
    fireEvent.changeText(grainInput, "115");
    fireEvent.changeText(quantityInput, "1000");
    fireEvent.changeText(amountPaidInput, "299.99");

    const saveButton = screen.getByText(/SAVE AMMUNITION/);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to create ammunition. Please try again."
      );
    });
  });

  it("navigates back when cancel button is pressed", () => {
    renderScreen();

    const cancelButton = screen.getByText(/CANCEL/);
    fireEvent.press(cancelButton);

    expect(mockGoBack).toHaveBeenCalled();
  });

  it("handles date picker interaction", () => {
    renderScreen();

    const datePurchasedButton = screen.getByText(
      new Date().toLocaleDateString()
    );
    fireEvent.press(datePurchasedButton);

    // DateTimePicker should be visible
    const datePickerElement = screen.UNSAFE_getByType(DateTimePicker);
    expect(datePickerElement).toBeTruthy();
  });
});
