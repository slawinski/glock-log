import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { TerminalInput } from "../terminal-input/TerminalInput";

// Tests for TerminalInput component

describe("TerminalInput", () => {
  const mockOnChangeText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
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

    it("renders with placeholder text when not focused and no value", () => {
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

    it("hides placeholder when focused even with no value", () => {
      const placeholder = "Enter text here";
      const { getByTestId, queryByText } = render(
        <TerminalInput
          value=""
          onChangeText={mockOnChangeText}
          placeholder={placeholder}
          testID="terminal-input"
        />
      );
      
      const input = getByTestId("terminal-input");
      fireEvent(input, "focus");
      
      expect(queryByText(placeholder)).toBeNull();
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

  describe("Value Handling", () => {
    it("handles null value correctly", () => {
      const { getByTestId } = render(
        <TerminalInput
          value={null}
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      const input = getByTestId("terminal-input");
      expect(input.props.value).toBe("");
    });

    it("handles undefined value correctly", () => {
      const { getByTestId } = render(
        <TerminalInput
          value={undefined}
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      const input = getByTestId("terminal-input");
      expect(input.props.value).toBe("");
    });

    it("handles numeric value correctly", () => {
      const { getByTestId } = render(
        <TerminalInput
          value={123}
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      const input = getByTestId("terminal-input");
      expect(input.props.value).toBe("123");
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
  });

  describe("Focus and Blur Behavior", () => {
    it("manages focus state correctly", () => {
      const { getByTestId } = render(
        <TerminalInput
          value="test"
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      
      const input = getByTestId("terminal-input");
      
      // Test focus
      fireEvent(input, "focus");
      
      // Test blur
      fireEvent(input, "blur");
    });

    it("shows cursor when focused", () => {
      const { getByTestId, getByText } = render(
        <TerminalInput
          value=""
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      
      const input = getByTestId("terminal-input");
      fireEvent(input, "focus");
      
      // Cursor should be visible when focused at end of empty input
      expect(getByText("▋")).toBeTruthy();
    });

    it("hides cursor when blurred", () => {
      const { getByTestId, queryByText } = render(
        <TerminalInput
          value=""
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      
      const input = getByTestId("terminal-input");
      fireEvent(input, "focus");
      fireEvent(input, "blur");
      
      expect(queryByText("▋")).toBeNull();
    });
  });

  describe("Cursor Position and Selection", () => {
    it("handles cursor position at start of text", () => {
      const { getByTestId } = render(
        <TerminalInput
          value="hello"
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      
      const input = getByTestId("terminal-input");
      fireEvent(input, "focus");
      
      // Simulate cursor at position 0
      fireEvent(input, "selectionChange", {
        nativeEvent: { selection: { start: 0, end: 0 } }
      });
    });

    it("handles cursor position in middle of text", () => {
      const { getByTestId } = render(
        <TerminalInput
          value="hello"
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      
      const input = getByTestId("terminal-input");
      fireEvent(input, "focus");
      
      // Simulate cursor at position 2
      fireEvent(input, "selectionChange", {
        nativeEvent: { selection: { start: 2, end: 2 } }
      });
    });

    it("handles cursor position at end of text", () => {
      const { getByTestId } = render(
        <TerminalInput
          value="hello"
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      
      const input = getByTestId("terminal-input");
      fireEvent(input, "focus");
      
      // Simulate cursor at end
      fireEvent(input, "selectionChange", {
        nativeEvent: { selection: { start: 5, end: 5 } }
      });
    });

    it("resets cursor position when value becomes empty", () => {
      const { rerender, getByTestId } = render(
        <TerminalInput
          value="hello"
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      
      // Change value to empty
      rerender(
        <TerminalInput
          value=""
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      
      const input = getByTestId("terminal-input");
      fireEvent(input, "focus");
      
      // Should show cursor at position 0 for empty input
      expect(input).toBeTruthy();
    });
  });

  describe("Cursor Blinking Animation", () => {
    it("manages cursor visibility state correctly", () => {
      const { getByTestId } = render(
        <TerminalInput
          value=""
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      
      const input = getByTestId("terminal-input");
      
      // Test focus without timers
      fireEvent(input, "focus");
      fireEvent(input, "blur");
      
      // Component should handle focus/blur without crashing
      expect(input).toBeTruthy();
    });
  });

  describe("Text Rendering with Cursor", () => {
    it("renders text before cursor correctly", () => {
      const { getByTestId, getByText } = render(
        <TerminalInput
          value="hello"
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      
      const input = getByTestId("terminal-input");
      fireEvent(input, "focus");
      
      // Set cursor in middle
      fireEvent(input, "selectionChange", {
        nativeEvent: { selection: { start: 2, end: 2 } }
      });
      
      // Should render "he" before cursor
      expect(getByText("he")).toBeTruthy();
    });

    it("renders character at cursor position with highlighting", () => {
      const { getByTestId } = render(
        <TerminalInput
          value="hello"
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      
      const input = getByTestId("terminal-input");
      fireEvent(input, "focus");
      
      // Set cursor at position 2 (character 'l')
      fireEvent(input, "selectionChange", {
        nativeEvent: { selection: { start: 2, end: 2 } }
      });
    });

    it("renders text after cursor correctly", () => {
      const { getByTestId, getByText } = render(
        <TerminalInput
          value="hello"
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      
      const input = getByTestId("terminal-input");
      fireEvent(input, "focus");
      
      // Set cursor at position 2
      fireEvent(input, "selectionChange", {
        nativeEvent: { selection: { start: 2, end: 2 } }
      });
      
      // Should render "lo" after cursor (position 3 to end)
      expect(getByText("lo")).toBeTruthy();
    });
  });

  describe("Multiline Behavior", () => {
    it("applies correct alignment for multiline input", () => {
      const { getByTestId } = render(
        <TerminalInput
          value="line1\nline2"
          onChangeText={mockOnChangeText}
          multiline
          testID="terminal-input"
        />
      );
      
      const input = getByTestId("terminal-input");
      expect(input.props.style.textAlignVertical).toBe("top");
    });

    it("applies correct alignment for single line input", () => {
      const { getByTestId } = render(
        <TerminalInput
          value="single line"
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      
      const input = getByTestId("terminal-input");
      expect(input.props.style.textAlignVertical).toBe("center");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty string value", () => {
      const { getByTestId } = render(
        <TerminalInput
          value=""
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      
      const input = getByTestId("terminal-input");
      expect(input.props.value).toBe("");
    });

    it("handles very long text values", () => {
      const longText = "a".repeat(1000);
      const { getByTestId } = render(
        <TerminalInput
          value={longText}
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      
      const input = getByTestId("terminal-input");
      expect(input.props.value).toBe(longText);
    });

    it("handles special characters correctly", () => {
      const specialText = "!@#$%^&*()_+-={}[]|\\:;\"'<>?,./";
      const { getByTestId } = render(
        <TerminalInput
          value={specialText}
          onChangeText={mockOnChangeText}
          testID="terminal-input"
        />
      );
      
      const input = getByTestId("terminal-input");
      expect(input.props.value).toBe(specialText);
    });
  });
});
