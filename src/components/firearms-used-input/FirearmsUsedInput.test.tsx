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
    { id: "f1", modelName: "Glock 19", caliber: "9mm", ownership: "mine" as const },
    { id: "f2", modelName: "AR-15", caliber: "5.56", ownership: "mine" as const },
    { id: "f3", modelName: "Rented 1911", caliber: ".45", ownership: "borrowed" as const },
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
    onAddBorrowedFirearm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with no firearms selected", () => {
    const { getByText, queryByText } = render(
      <FirearmsUsedInput {...defaultProps} />
    );

    expect(getByText("Glock 19")).toBeTruthy();
    expect(getByText("AR-15")).toBeTruthy();
    expect(
      queryByText("Rounds used", { includeHiddenElements: true })
    ).toBeNull();
    expect(getByText("+ Add borrowed gun")).toBeTruthy();
  });

  it("calls onToggleFirearm when a firearm is pressed", () => {
    const { getByText } = render(<FirearmsUsedInput {...defaultProps} />);
    fireEvent.press(getByText("Glock 19"));
    expect(defaultProps.onToggleFirearm).toHaveBeenCalledWith("f1");
  });

  it("shows a BORROWED tag on borrowed firearms", () => {
    const { getByText } = render(<FirearmsUsedInput {...defaultProps} />);
    expect(getByText("Rented 1911")).toBeTruthy();
    expect(getByText("BORROWED")).toBeTruthy();
  });

  it("shows ammunition input when a firearm is selected", () => {
    const { getByText } = render(
      <FirearmsUsedInput {...defaultProps} selectedFirearms={["f1"]} />
    );

    expect(getByText("Glock 19")).toBeTruthy();
    expect(getByText("AMMUNITION USED")).toBeTruthy();
    // Placeholder lives in TerminalInput's CRT visual layer which is hidden
    // from screen readers, so include hidden elements.
    expect(getByText("Rounds used", { includeHiddenElements: true })).toBeTruthy();
    expect(getByText("Select Ammunition")).toBeTruthy();
  });

  it("calls onRoundsChange when rounds input changes", () => {
    const { getByTestId } = render(
      <FirearmsUsedInput {...defaultProps} selectedFirearms={["f1"]} />
    );

    fireEvent.changeText(getByTestId("rounds-input-f1"), "10");
    expect(defaultProps.onRoundsChange).toHaveBeenCalledWith("f1", "10");
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

  it("opens the add-borrowed-gun form and calls onAddBorrowedFirearm with typed values", async () => {
    const { getByTestId, getByText } = render(
      <FirearmsUsedInput {...defaultProps} />
    );

    fireEvent.press(getByTestId("add-borrowed-gun-button"));

    fireEvent.changeText(getByTestId("borrowed-model-input"), "Glock 17");
    fireEvent.changeText(getByTestId("borrowed-caliber-input"), "9mm");
    fireEvent.press(getByTestId("add-borrowed-gun-submit"));

    expect(defaultProps.onAddBorrowedFirearm).toHaveBeenCalledWith(
      "Glock 17",
      "9mm"
    );
  });

  it("shows an error when submitting the borrowed form without a model or caliber", () => {
    const { getByTestId, getByText } = render(
      <FirearmsUsedInput {...defaultProps} />
    );

    fireEvent.press(getByTestId("add-borrowed-gun-button"));
    fireEvent.press(getByTestId("add-borrowed-gun-submit"));

    expect(getByText("Enter both a model name and caliber.")).toBeTruthy();
    expect(defaultProps.onAddBorrowedFirearm).not.toHaveBeenCalled();
  });

  it("cancels the borrowed form and clears its inputs", () => {
    const { getByTestId, queryByTestId } = render(
      <FirearmsUsedInput {...defaultProps} />
    );

    fireEvent.press(getByTestId("add-borrowed-gun-button"));
    fireEvent.changeText(getByTestId("borrowed-model-input"), "Glock 17");
    fireEvent.press(getByTestId("add-borrowed-gun-cancel"));

    expect(queryByTestId("borrowed-model-input")).toBeNull();
    expect(queryByTestId("borrowed-caliber-input")).toBeNull();
  });

  it("shows alert if no compatible ammunition found for a firearm", () => {
    const { getByText } = render(
      <FirearmsUsedInput
        {...defaultProps}
        firearms={[{ id: "f4", modelName: "Shotgun", caliber: "12ga", ownership: "mine" as const }]}
        ammunition={[]}
        selectedFirearms={["f4"]}
      />
    );

    fireEvent.press(getByText("Select Ammunition"));
    expect(Alert.alert).toHaveBeenCalledWith(
      "No Stock",
      "No 12ga ammunition in stock."
    );
  });

  it("filters out zero-quantity ammunition from selection", () => {
    const ammoWithZero = [
      ...mockAmmunition,
      {
        id: "a4",
        brand: "Empty Brand",
        caliber: "9mm",
        quantity: 0,
        datePurchased: "2023-01-01",
        amountPaid: 0,
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        grain: "115",
      },
    ];

    const { getByText } = render(
      <FirearmsUsedInput
        {...defaultProps}
        ammunition={ammoWithZero}
        selectedFirearms={["f1"]}
      />
    );

    fireEvent.press(getByText("Select Ammunition"));

    // Should show Federal and Winchester but NOT Empty Brand
    const alertCalls = (Alert.alert as jest.Mock).mock.calls;
    const alertButtons = alertCalls[0][2];

    expect(alertButtons.find((b: any) => b.text.includes("Federal"))).toBeTruthy();
    expect(alertButtons.find((b: any) => b.text.includes("Winchester"))).toBeTruthy();
    expect(alertButtons.find((b: any) => b.text.includes("Empty Brand"))).toBeFalsy();
  });
});
