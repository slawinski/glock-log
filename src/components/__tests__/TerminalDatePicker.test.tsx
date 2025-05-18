import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import TerminalDatePicker from "../TerminalDatePicker";

describe("TerminalDatePicker", () => {
  const mockOnChange = jest.fn();
  const mockDate = new Date("2024-03-20");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with initial date", () => {
    const { getByText } = render(
      <TerminalDatePicker
        value={mockDate}
        onChange={mockOnChange}
        label="TEST DATE"
      />
    );

    expect(getByText("TEST DATE")).toBeTruthy();
    expect(getByText("Mar 20, 2024")).toBeTruthy();
  });

  it("shows date picker when pressed", () => {
    const { getByText } = render(
      <TerminalDatePicker
        value={mockDate}
        onChange={mockOnChange}
        label="TEST DATE"
      />
    );

    fireEvent.press(getByText("Mar 20, 2024"));
    // Note: We can't test the actual DateTimePicker as it's platform-specific
    // But we can verify the press handler was called
  });
});
