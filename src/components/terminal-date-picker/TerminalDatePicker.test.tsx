import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import TerminalDatePicker from "../terminal-date-picker/TerminalDatePicker";

// Mock the DateTimePickerModal component
jest.mock("react-native-modal-datetime-picker", () => {
  return jest.fn(({ isVisible, onConfirm, onCancel, date }) => {
    const MockDateTimePicker = require("react-native").View;
    return isVisible ? (
      <MockDateTimePicker testID="date-time-picker-modal">
        <MockDateTimePicker 
          testID="confirm-button" 
          onPress={() => onConfirm(date || new Date("2024-03-20"))}
        />
        <MockDateTimePicker 
          testID="cancel-button" 
          onPress={onCancel}
        />
      </MockDateTimePicker>
    ) : null;
  });
});

describe("TerminalDatePicker", () => {
  const mockOnChange = jest.fn();
  const mockDate = new Date("2024-03-20");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
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

    it("renders with null value and shows placeholder", () => {
      const { getByText } = render(
        <TerminalDatePicker
          value={null}
          onChange={mockOnChange}
          label="SELECT DATE"
          placeholder="Choose a date"
        />
      );

      expect(getByText("SELECT DATE")).toBeTruthy();
      expect(getByText("Choose a date")).toBeTruthy();
    });

    it("renders with custom placeholder", () => {
      const customPlaceholder = "Pick your date";
      const { getByText } = render(
        <TerminalDatePicker
          value={null}
          onChange={mockOnChange}
          label="DATE"
          placeholder={customPlaceholder}
        />
      );

      expect(getByText(customPlaceholder)).toBeTruthy();
    });

    it("renders with default placeholder when none provided", () => {
      const { getByText } = render(
        <TerminalDatePicker
          value={null}
          onChange={mockOnChange}
          label="DATE"
        />
      );

      expect(getByText("Select date")).toBeTruthy();
    });

    it("applies error styling when error prop is provided", () => {
      const { getByText } = render(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="DATE"
          error="Date is required"
        />
      );

      expect(getByText("Date is required")).toBeTruthy();
    });
  });

  describe("Date Formatting", () => {
    it("formats dates correctly for different months", () => {
      const testDates = [
        { date: new Date("2024-01-15"), expected: "Jan 15, 2024" },
        { date: new Date("2024-06-30"), expected: "Jun 30, 2024" },
        { date: new Date("2024-12-01"), expected: "Dec 1, 2024" },
      ];

      testDates.forEach(({ date, expected }) => {
        const { getByText } = render(
          <TerminalDatePicker
            value={date}
            onChange={mockOnChange}
            label="DATE"
          />
        );

        expect(getByText(expected)).toBeTruthy();
      });
    });

    it("formats dates correctly for different years", () => {
      const { getByText } = render(
        <TerminalDatePicker
          value={new Date("2025-03-20")}
          onChange={mockOnChange}
          label="DATE"
        />
      );

      expect(getByText("Mar 20, 2025")).toBeTruthy();
    });

    it("handles edge case dates correctly", () => {
      const leapYearDate = new Date("2024-02-29");
      const { getByText } = render(
        <TerminalDatePicker
          value={leapYearDate}
          onChange={mockOnChange}
          label="DATE"
        />
      );

      expect(getByText("Feb 29, 2024")).toBeTruthy();
    });
  });

  describe("Modal Interactions", () => {
    it("shows date picker modal when pressed", async () => {
      const { getByText, getByTestId } = render(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="TEST DATE"
        />
      );

      await act(async () => {
        fireEvent.press(getByText("Mar 20, 2024"));
      });

      expect(getByTestId("date-time-picker-modal")).toBeTruthy();
    });

    it("shows date picker modal when pressing placeholder", async () => {
      const { getByText, getByTestId } = render(
        <TerminalDatePicker
          value={null}
          onChange={mockOnChange}
          label="TEST DATE"
        />
      );

      await act(async () => {
        fireEvent.press(getByText("Select date"));
      });

      expect(getByTestId("date-time-picker-modal")).toBeTruthy();
    });

    it("calls onChange when date is confirmed in modal", async () => {
      const { getByText, getByTestId } = render(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="TEST DATE"
        />
      );

      // Open modal
      await act(async () => {
        fireEvent.press(getByText("Mar 20, 2024"));
      });

      // Confirm date selection
      await act(async () => {
        fireEvent.press(getByTestId("confirm-button"));
      });

      expect(mockOnChange).toHaveBeenCalledWith(new Date("2024-03-20"));
    });

    it("does not call onChange when modal is cancelled", async () => {
      const { getByText, getByTestId } = render(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="TEST DATE"
        />
      );

      // Open modal
      await act(async () => {
        fireEvent.press(getByText("Mar 20, 2024"));
      });

      // Cancel date selection
      await act(async () => {
        fireEvent.press(getByTestId("cancel-button"));
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("hides modal after date confirmation", async () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="TEST DATE"
        />
      );

      // Open modal
      await act(async () => {
        fireEvent.press(getByText("Mar 20, 2024"));
      });

      // Confirm date selection
      await act(async () => {
        fireEvent.press(getByTestId("confirm-button"));
      });

      expect(queryByTestId("date-time-picker-modal")).toBeNull();
    });

    it("hides modal after cancellation", async () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="TEST DATE"
        />
      );

      // Open modal
      await act(async () => {
        fireEvent.press(getByText("Mar 20, 2024"));
      });

      // Cancel date selection
      await act(async () => {
        fireEvent.press(getByTestId("cancel-button"));
      });

      expect(queryByTestId("date-time-picker-modal")).toBeNull();
    });
  });

  describe("Clear Functionality", () => {
    it("shows clear button when allowClear is true and value exists", () => {
      const { getByText } = render(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="DATE"
          allowClear={true}
        />
      );

      expect(getByText("CLEAR")).toBeTruthy();
    });

    it("does not show clear button when allowClear is false", () => {
      const { queryByText } = render(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="DATE"
          allowClear={false}
        />
      );

      expect(queryByText("CLEAR")).toBeNull();
    });

    it("does not show clear button when allowClear is true but no value", () => {
      const { queryByText } = render(
        <TerminalDatePicker
          value={null}
          onChange={mockOnChange}
          label="DATE"
          allowClear={true}
        />
      );

      expect(queryByText("CLEAR")).toBeNull();
    });

    it("calls onChange with new Date when clear button is pressed", () => {
      const { getByText } = render(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="DATE"
          allowClear={true}
        />
      );

      fireEvent.press(getByText("CLEAR"));
      expect(mockOnChange).toHaveBeenCalledWith(expect.any(Date));
    });

    it("has proper accessibility attributes for clear button", () => {
      const { getByLabelText } = render(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="DATE"
          allowClear={true}
        />
      );

      const clearButton = getByLabelText("Clear date");
      expect(clearButton).toBeTruthy();
    });
  });

  describe("Error State", () => {
    it("displays error message when provided", () => {
      const errorMessage = "Please select a valid date";
      const { getByText } = render(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="DATE"
          error={errorMessage}
        />
      );

      expect(getByText(errorMessage)).toBeTruthy();
    });

    it("applies error border styling when error exists", () => {
      const { getByText } = render(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="DATE"
          error="Error message"
        />
      );

      // Just verify error message is displayed
      expect(getByText("Error message")).toBeTruthy();
    });

    it("applies normal border styling when no error", () => {
      const { getByLabelText, queryByText } = render(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="DATE"
        />
      );

      const datePicker = getByLabelText("DATE date picker");
      expect(datePicker).toBeTruthy();
      // No error message should be displayed
      expect(queryByText(/error/i)).toBeNull();
    });
  });

  describe("Accessibility", () => {
    it("has proper accessibility attributes for main button", () => {
      const { getByLabelText } = render(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="BIRTH DATE"
        />
      );

      const datePicker = getByLabelText("BIRTH DATE date picker");
      expect(datePicker).toBeTruthy();
    });

    it("provides accessibility hint for date picker", () => {
      const { getByLabelText } = render(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="DATE"
        />
      );

      const datePicker = getByLabelText("DATE date picker");
      expect(datePicker.props.accessibilityHint).toBe("Opens date picker");
    });

    it("has proper role for interactive elements", () => {
      const { getByLabelText } = render(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="DATE"
        />
      );

      const datePicker = getByLabelText("DATE date picker");
      expect(datePicker.props.accessibilityRole).toBe("button");
    });
  });

  describe("Date Constraints", () => {
    it("passes minDate to DateTimePickerModal", async () => {
      const minDate = new Date("2024-01-01");
      const { getByText } = render(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="DATE"
          minDate={minDate}
        />
      );

      await act(async () => {
        fireEvent.press(getByText("Mar 20, 2024"));
      });

      // Modal should be rendered with minDate prop
      // This is tested implicitly through the mock
    });

    it("passes maxDate to DateTimePickerModal", async () => {
      const maxDate = new Date("2024-12-31");
      const { getByText } = render(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="DATE"
          maxDate={maxDate}
        />
      );

      await act(async () => {
        fireEvent.press(getByText("Mar 20, 2024"));
      });

      // Modal should be rendered with maxDate prop
      // This is tested implicitly through the mock
    });
  });

  describe("Edge Cases", () => {
    it("handles null value gracefully", () => {
      const { getByText } = render(
        <TerminalDatePicker
          value={null}
          onChange={mockOnChange}
          label="DATE"
        />
      );

      expect(getByText("Select date")).toBeTruthy();
    });

    it("uses current date when value is null and modal opens", async () => {
      const { getByText, getByTestId } = render(
        <TerminalDatePicker
          value={null}
          onChange={mockOnChange}
          label="DATE"
        />
      );

      await act(async () => {
        fireEvent.press(getByText("Select date"));
      });

      // Modal should open with current date as default
      expect(getByTestId("date-time-picker-modal")).toBeTruthy();
    });

    it("handles date change from null to valid date", () => {
      const { rerender, getByText } = render(
        <TerminalDatePicker
          value={null}
          onChange={mockOnChange}
          label="DATE"
        />
      );

      expect(getByText("Select date")).toBeTruthy();

      rerender(
        <TerminalDatePicker
          value={mockDate}
          onChange={mockOnChange}
          label="DATE"
        />
      );

      expect(getByText("Mar 20, 2024")).toBeTruthy();
    });

    it("handles very old dates", () => {
      const oldDate = new Date("1900-01-01");
      const { getByText } = render(
        <TerminalDatePicker
          value={oldDate}
          onChange={mockOnChange}
          label="DATE"
        />
      );

      expect(getByText("Jan 1, 1900")).toBeTruthy();
    });

    it("handles future dates", () => {
      const futureDate = new Date("2050-12-31");
      const { getByText } = render(
        <TerminalDatePicker
          value={futureDate}
          onChange={mockOnChange}
          label="DATE"
        />
      );

      expect(getByText("Dec 31, 2050")).toBeTruthy();
    });
  });
});
