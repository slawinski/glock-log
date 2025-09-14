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
import { AddAmmunition as AddAmmunitionScreen } from "./AddAmmunition";
import { storage } from "../../services/storage-new";
import DateTimePicker from "@react-native-community/datetimepicker";

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

    const caliberInput = screen.getByTestId("caliber-input");
    const brandInput = screen.getByTestId("brand-input");
    const grainInput = screen.getByTestId("grain-input");
    const quantityInput = screen.getByTestId("quantity-input");
    const amountPaidInput = screen.getByTestId("amount-paid-input");
    const notesInput = screen.getByTestId("notes-input");

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
    (storage.saveAmmunition as jest.Mock).mockResolvedValueOnce({});
    renderScreen();

    fireEvent.changeText(screen.getByTestId("caliber-input"), "9mm");
    fireEvent.changeText(screen.getByTestId("brand-input"), "Federal");
    fireEvent.changeText(screen.getByTestId("grain-input"), "115");
    fireEvent.changeText(screen.getByTestId("quantity-input"), "1000");
    fireEvent.changeText(screen.getByTestId("amount-paid-input"), "299.99");

    fireEvent.press(screen.getByText(/SAVE AMMUNITION/));

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
    (storage.saveAmmunition as jest.Mock).mockRejectedValueOnce(
      new Error("Save failed")
    );
    renderScreen();

    fireEvent.changeText(screen.getByTestId("caliber-input"), "9mm");
    fireEvent.changeText(screen.getByTestId("brand-input"), "Federal");
    fireEvent.changeText(screen.getByTestId("grain-input"), "115");
    fireEvent.changeText(screen.getByTestId("quantity-input"), "1000");
    fireEvent.changeText(screen.getByTestId("amount-paid-input"), "299.99");

    fireEvent.press(screen.getByText(/SAVE AMMUNITION/));

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

  it("handles date picker interaction", async () => {
    renderScreen();

    const formattedDate = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const datePurchasedButton = screen.getByText(formattedDate);
    fireEvent.press(datePurchasedButton);

    // DateTimePicker should be visible
    const datePickerElement = screen.UNSAFE_getByType(DateTimePicker);
    expect(datePickerElement).toBeTruthy();
  });
});
