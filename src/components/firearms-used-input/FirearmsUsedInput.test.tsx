import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { FirearmsUsedInput } from "./FirearmsUsedInput";
import { Alert } from "react-native";

jest.mock('react-native/Libraries/Alert/Alert');

// Mock Alert for testing purposes
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("react-native-screens", () => ({
  ...jest.requireActual("react-native-screens"),
  enableScreens: jest.fn(),
}));

describe("FirearmsUsedInput", () => {
  const mockFirearms = [
    { id: "f1", modelName: "Glock 19", caliber: "9mm" },
    { id: "f2", modelName: "AR-15", caliber: "5.56" },
  ];

  const mockAmmunition = [
    {
      id: "a1",
      brand: "Federal",
      caliber: "9mm",
      quantity: 100,
      datePurchased: "2023-01-01",
      amountPaid: 200,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
      grain: "115",
      photos: [],
      notes: "",
      pricePerRound: 2,
    },
    {
      id: "a2",
      brand: "PMC",
      caliber: "5.56",
      quantity: 200,
      datePurchased: "2023-02-01",
      amountPaid: 300,
      createdAt: "2023-02-01T00:00:00Z",
      updatedAt: "2023-02-01T00:00:00Z",
      grain: "55",
      photos: [],
      notes: "",
      pricePerRound: 1.5,
    },
    {
      id: "a3",
      brand: "Winchester",
      caliber: "9mm",
      quantity: 50,
      datePurchased: "2023-03-01",
      amountPaid: 80,
      createdAt: "2023-03-01T00:00:00Z",
      updatedAt: "2023-03-01T00:00:00Z",
      grain: "124",
      photos: [],
      notes: "",
      pricePerRound: 1.6,
    },
  ];

  const defaultProps = {
    firearms: mockFirearms,
    ammunition: mockAmmunition,
    selectedFirearms: [],
    ammunitionUsed: {},
    onToggleFirearm: jest.fn(),
    onRoundsChange: jest.fn(),
    onAmmunitionSelect: jest.fn(),
    onAddBorrowedAmmunition: jest.fn(),
    onRemoveBorrowedAmmunition: jest.fn(),
    onBorrowedAmmunitionRoundsChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with no firearms selected", () => {
    const { getByText, queryByText } = render(
      <FirearmsUsedInput {...defaultProps} />
    );

    expect(getByText("FIREARMS USED")).toBeTruthy();
    expect(getByText("Glock 19")).toBeTruthy();
    expect(getByText("AR-15")).toBeTruthy();
    expect(queryByText("Rounds used")).toBeNull();
    expect(getByText("+ Log ammunition for a borrowed firearm")).toBeTruthy();
  });

  it("calls onToggleFirearm when a firearm is pressed", () => {
    const { getByText } = render(<FirearmsUsedInput {...defaultProps} />);
    fireEvent.press(getByText("Glock 19"));
    expect(defaultProps.onToggleFirearm).toHaveBeenCalledWith("f1");
  });

  it("shows ammunition input when a firearm is selected", () => {
    const { getByText } = render(
      <FirearmsUsedInput {...defaultProps} selectedFirearms={["f1"]} />
    );

    expect(getByText("Glock 19")).toBeTruthy();
    expect(getByText("AMMUNITION USED")).toBeTruthy();
    expect(getByText("Rounds used")).toBeTruthy();
    expect(getByText("Select Ammunition")).toBeTruthy();
  });

  it("calls onRoundsChange when rounds input changes", () => {
    const { getByTestId } = render(
      <FirearmsUsedInput {...defaultProps} selectedFirearms={["f1"]} />
    );

    fireEvent.changeText(getByTestId("rounds-input-f1"), "10");
    expect(defaultProps.onRoundsChange).toHaveBeenCalledWith("f1", 10);
  });

  it("calls onAmmunitionSelect when ammunition is chosen", () => {
    const { getByText } = render(
      <FirearmsUsedInput {...defaultProps} selectedFirearms={["f1"]} />
    );

    fireEvent.press(getByText("Select Ammunition"));
    expect(Alert.alert).toHaveBeenCalledWith(
      "Select Ammunition",
      "Choose ammunition type",
      expect.arrayContaining([
        expect.objectContaining({ text: "Federal 9mm (100 rounds)" }),
        expect.objectContaining({ text: "Winchester 9mm (50 rounds)" }),
      ])
    );

    // Simulate selecting an ammunition type from the alert
    const selectFederal = (Alert.alert as jest.Mock).mock.calls[0][2][0];
    selectFederal.onPress();
    expect(defaultProps.onAmmunitionSelect).toHaveBeenCalledWith("f1", "a1");
  });

  it("calls onAddBorrowedAmmunition when button is pressed", () => {
    const { getByText } = render(<FirearmsUsedInput {...defaultProps} />);
    fireEvent.press(getByText("+ Log ammunition for a borrowed firearm"));
    expect(defaultProps.onAddBorrowedAmmunition).toHaveBeenCalled();
  });

  it("renders borrowed ammunition input", () => {
    const borrowedAmmoKey = "borrowed-123";
    const { getByText, getByDisplayValue } = render(
      <FirearmsUsedInput
        {...defaultProps}
        ammunitionUsed={{
          [borrowedAmmoKey]: { ammunitionId: "a1", rounds: 25 },
        }}
      />
    );

    expect(getByText("Federal 9mm")).toBeTruthy();
    expect(getByDisplayValue("25")).toBeTruthy();
    expect(getByText("Remove")).toBeTruthy();
  });

  it("calls onBorrowedAmmunitionRoundsChange when borrowed rounds input changes", () => {
    const borrowedAmmoKey = "borrowed-123";
    const { getByDisplayValue } = render(
      <FirearmsUsedInput
        {...defaultProps}
        ammunitionUsed={{
          [borrowedAmmoKey]: { ammunitionId: "a1", rounds: 25 },
        }}
      />
    );

    fireEvent.changeText(getByDisplayValue("25"), "30");
    expect(defaultProps.onBorrowedAmmunitionRoundsChange).toHaveBeenCalledWith(
      borrowedAmmoKey,
      30
    );
  });

  it("calls onRemoveBorrowedAmmunition when remove button is pressed", () => {
    const borrowedAmmoKey = "borrowed-123";
    const { getByText } = render(
      <FirearmsUsedInput
        {...defaultProps}
        ammunitionUsed={{
          [borrowedAmmoKey]: { ammunitionId: "a1", rounds: 25 },
        }}
      />
    );

    fireEvent.press(getByText("Remove"));
    expect(defaultProps.onRemoveBorrowedAmmunition).toHaveBeenCalledWith(
      borrowedAmmoKey
    );
  });

  it("shows alert if no compatible ammunition found for a firearm", () => {
    const { getByText } = render(
      <FirearmsUsedInput
        {...defaultProps}
        firearms={[{ id: "f3", modelName: "Shotgun", caliber: "12ga" }]}
        ammunition={[]}
        selectedFirearms={["f3"]}
      />
    );

    fireEvent.press(getByText("Select Ammunition"));
    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "No compatible ammunition found"
    );
  });
});