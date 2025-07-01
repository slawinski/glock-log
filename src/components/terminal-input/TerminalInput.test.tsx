import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TerminalInput } from "../terminal-input/TerminalInput";

describe("TerminalInput", () => {
  const mockOnChangeText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with default props", () => {
    const { getByTestId } = render(
      <TerminalInput
        value=""
        onChangeText={mockOnChangeText}
        testID="terminal-input"
      />
    );
    expect(getByTestId("terminal-input")).toBeTruthy();
  });

  it("renders with placeholder text", () => {
    const placeholder = "Enter text here";
    const { getByText } = render(
      <TerminalInput
        value=""
        onChangeText={mockOnChangeText}
        placeholder={placeholder}
      />
    );
    expect(getByText(placeholder)).toBeTruthy();
  });

  it("handles text input correctly", () => {
    const { getByTestId } = render(
      <TerminalInput
        value=""
        onChangeText={mockOnChangeText}
        testID="terminal-input"
      />
    );
    const input = getByTestId("terminal-input");
    fireEvent.changeText(input, "test input");
    expect(mockOnChangeText).toHaveBeenCalledWith("test input");
  });

  it("renders with numeric keyboard type", () => {
    const { getByTestId } = render(
      <TerminalInput
        value=""
        onChangeText={mockOnChangeText}
        keyboardType="numeric"
        testID="terminal-input"
      />
    );
    const input = getByTestId("terminal-input");
    expect(input.props.keyboardType).toBe("numeric");
  });

  it("renders with multiline prop", () => {
    const { getByTestId } = render(
      <TerminalInput
        value=""
        onChangeText={mockOnChangeText}
        multiline
        testID="terminal-input"
      />
    );
    const input = getByTestId("terminal-input");
    expect(input.props.multiline).toBe(true);
  });

  it("applies custom className correctly", () => {
    const customClass = "custom-class";
    const { getByText } = render(
      <TerminalInput
        value="test value"
        onChangeText={mockOnChangeText}
        className={customClass}
      />
    );
    const textElement = getByText("test value");
    expect(textElement.props.className).toContain(customClass);
  });
});
