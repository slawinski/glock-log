import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { BottomButtonGroup, ButtonConfig } from "./BottomButtonGroup";

describe("BottomButtonGroup", () => {
  const mockPress1 = jest.fn();
  const mockPress2 = jest.fn();
  const mockPress3 = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders buttons correctly", () => {
    const buttons: ButtonConfig[] = [
      { caption: "CANCEL", onPress: mockPress1 },
      { caption: "SAVE", onPress: mockPress2 },
    ];

    const { getByText } = render(<BottomButtonGroup buttons={buttons} />);

    expect(getByText("CANCEL")).toBeTruthy();
    expect(getByText("SAVE")).toBeTruthy();
  });

  it("calls onPress when buttons are pressed", () => {
    const buttons: ButtonConfig[] = [
      { caption: "EDIT", onPress: mockPress1 },
      { caption: "DELETE", onPress: mockPress2 },
      { caption: "BACK", onPress: mockPress3 },
    ];

    const { getByText } = render(<BottomButtonGroup buttons={buttons} />);

    fireEvent.press(getByText("EDIT"));
    expect(mockPress1).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText("DELETE"));
    expect(mockPress2).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText("BACK"));
    expect(mockPress3).toHaveBeenCalledTimes(1);
  });

  it("handles disabled buttons", () => {
    const buttons: ButtonConfig[] = [
      { caption: "CANCEL", onPress: mockPress1 },
      { caption: "SAVE", onPress: mockPress2, disabled: true },
    ];

    const { getByText } = render(<BottomButtonGroup buttons={buttons} />);

    fireEvent.press(getByText("CANCEL"));
    expect(mockPress1).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText("SAVE"));
    expect(mockPress2).not.toHaveBeenCalled();
  });
});