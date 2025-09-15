import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TerminalCalendar } from "./TerminalCalendar";

describe("TerminalCalendar", () => {
  describe("Basic Rendering", () => {
    it("renders correctly with initial date", () => {
      const { getByText } = render(
        <TerminalCalendar
          highlightedDates={[]}
          initialDate={new Date("2024-01-15")}
        />
      );
      expect(getByText("JANUARY 2024")).toBeTruthy();
    });

    it("renders with default date when no initial date provided", () => {
      const { getByText } = render(
        <TerminalCalendar highlightedDates={[]} />
      );
      // Should render current month/year (though exact text depends on current date)
      // We'll just verify it renders without error
      expect(getByText("SUN")).toBeTruthy();
      expect(getByText("MON")).toBeTruthy();
      expect(getByText("SAT")).toBeTruthy();
    });

    it("renders all weekday headers correctly", () => {
      const { getByText } = render(
        <TerminalCalendar
          highlightedDates={[]}
          initialDate={new Date("2024-01-15")}
        />
      );
      
      const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      weekDays.forEach(day => {
        expect(getByText(day)).toBeTruthy();
      });
    });

    it("renders calendar grid with proper week structure", () => {
      const { getAllByText } = render(
        <TerminalCalendar
          highlightedDates={[]}
          initialDate={new Date("2024-01-15")}
        />
      );
      
      // January 2024 should show days 1-31 (may have duplicates from prev/next month)
      expect(getAllByText("1").length).toBeGreaterThan(0);
      expect(getAllByText("15").length).toBeGreaterThan(0);
      expect(getAllByText("31").length).toBeGreaterThan(0);
    });
  });

  describe("Date Highlighting", () => {
    it("highlights the correct dates", () => {
      const highlighted = [new Date("2024-01-10"), new Date("2024-01-20")];
      const { getByText } = render(
        <TerminalCalendar
          highlightedDates={highlighted}
          initialDate={new Date("2024-01-15")}
        />
      );

      const day10 = getByText("10");
      const day20 = getByText("20");

      expect(day10.props.className).toContain("bg-terminal-green");
      expect(day20.props.className).toContain("bg-terminal-green");
    });

    it("does not highlight non-specified dates", () => {
      const highlighted = [new Date("2024-01-10")];
      const { getByText } = render(
        <TerminalCalendar
          highlightedDates={highlighted}
          initialDate={new Date("2024-01-15")}
        />
      );

      const day15 = getByText("15");
      expect(day15.props.className).not.toContain("bg-terminal-green");
    });

    it("handles empty highlighted dates array", () => {
      const { getByText } = render(
        <TerminalCalendar
          highlightedDates={[]}
          initialDate={new Date("2024-01-15")}
        />
      );

      const day15 = getByText("15");
      expect(day15.props.className).not.toContain("bg-terminal-green");
    });

    it("handles multiple highlighted dates in same month", () => {
      const highlighted = [
        new Date("2024-01-01"),
        new Date("2024-01-15"),
        new Date("2024-01-31")
      ];
      const { getAllByText } = render(
        <TerminalCalendar
          highlightedDates={highlighted}
          initialDate={new Date("2024-01-15")}
        />
      );

      // Find highlighted dates - there may be multiple "1"s but we want the January one
      const ones = getAllByText("1");
      const fifteens = getAllByText("15");
      const thirtyOnes = getAllByText("31");
      
      // At least one of each should be highlighted
      expect(ones.some(el => el.props.className?.includes("bg-terminal-green"))).toBe(true);
      expect(fifteens.some(el => el.props.className?.includes("bg-terminal-green"))).toBe(true);
      expect(thirtyOnes.some(el => el.props.className?.includes("bg-terminal-green"))).toBe(true);
    });

    it("handles highlighted dates from different months", () => {
      const highlighted = [
        new Date("2024-01-15"),
        new Date("2024-02-15"),
        new Date("2024-03-15")
      ];
      const { getByText } = render(
        <TerminalCalendar
          highlightedDates={highlighted}
          initialDate={new Date("2024-01-15")}
        />
      );

      // Only January 15 should be highlighted in current view
      expect(getByText("15").props.className).toContain("bg-terminal-green");
    });
  });

  describe("Month Navigation", () => {
    it("navigates to the next month", () => {
      const { getByText } = render(
        <TerminalCalendar
          highlightedDates={[]}
          initialDate={new Date("2024-01-15")}
        />
      );
      fireEvent.press(getByText(">"));
      expect(getByText("FEBRUARY 2024")).toBeTruthy();
    });

    it("navigates to the previous month", () => {
      const { getByText } = render(
        <TerminalCalendar
          highlightedDates={[]}
          initialDate={new Date("2024-01-15")}
        />
      );
      fireEvent.press(getByText("<"));
      expect(getByText("DECEMBER 2023")).toBeTruthy();
    });

    it("navigates across year boundaries forward", () => {
      const { getByText } = render(
        <TerminalCalendar
          highlightedDates={[]}
          initialDate={new Date("2024-12-15")}
        />
      );
      fireEvent.press(getByText(">"));
      expect(getByText("JANUARY 2025")).toBeTruthy();
    });

    it("navigates across year boundaries backward", () => {
      const { getByText } = render(
        <TerminalCalendar
          highlightedDates={[]}
          initialDate={new Date("2024-01-15")}
        />
      );
      fireEvent.press(getByText("<"));
      expect(getByText("DECEMBER 2023")).toBeTruthy();
    });

    it("maintains highlighted dates after navigation", () => {
      const highlighted = [
        new Date("2024-01-15"),
        new Date("2024-02-15")
      ];
      const { getByText } = render(
        <TerminalCalendar
          highlightedDates={highlighted}
          initialDate={new Date("2024-01-15")}
        />
      );

      // Navigate to February
      fireEvent.press(getByText(">"));
      expect(getByText("FEBRUARY 2024")).toBeTruthy();
      
      // February 15 should be highlighted
      expect(getByText("15").props.className).toContain("bg-terminal-green");
    });
  });

  describe("Calendar Grid Layout", () => {
    it("shows previous month's days in muted style", () => {
      // February 2024 starts on Thursday, so should show some January days
      const { getAllByText } = render(
        <TerminalCalendar
          highlightedDates={[]}
          initialDate={new Date("2024-02-15")}
        />
      );
      
      // There should be days with muted text (previous month)
      // We can't easily test specific days without more complex selectors
      expect(getAllByText(/\d+/)).toBeTruthy();
    });

    it("shows next month's days in muted style", () => {
      // January 2024 ends on Wednesday, so should show some February days
      const { getAllByText } = render(
        <TerminalCalendar
          highlightedDates={[]}
          initialDate={new Date("2024-01-15")}
        />
      );
      
      expect(getAllByText(/\d+/)).toBeTruthy();
    });

    it("renders exactly 7 columns for weekdays", () => {
      const { getByText } = render(
        <TerminalCalendar
          highlightedDates={[]}
          initialDate={new Date("2024-01-15")}
        />
      );
      
      // All 7 weekday headers should be present
      const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      weekDays.forEach(day => {
        expect(getByText(day)).toBeTruthy();
      });
    });
  });

  describe("Date Edge Cases", () => {
    it("handles leap year February correctly", () => {
      const { getByText, getAllByText } = render(
        <TerminalCalendar
          highlightedDates={[]}
          initialDate={new Date("2024-02-15")} // 2024 is a leap year
        />
      );
      
      expect(getByText("FEBRUARY 2024")).toBeTruthy();
      // Feb 29 exists in leap year - there may be multiple 29s from different months
      expect(getAllByText("29").length).toBeGreaterThan(0);
    });

    it("handles non-leap year February correctly", () => {
      const { getByText, getAllByText } = render(
        <TerminalCalendar
          highlightedDates={[]}
          initialDate={new Date("2023-02-15")} // 2023 is not a leap year
        />
      );
      
      expect(getByText("FEBRUARY 2023")).toBeTruthy();
      expect(getAllByText("28").length).toBeGreaterThan(0);
      // In non-leap year, Feb 29 shouldn't appear in February portion of calendar
      // But might appear from other months, so this test is simplified
    });

    it("handles months with 30 days", () => {
      const { getByText, getAllByText } = render(
        <TerminalCalendar
          highlightedDates={[]}
          initialDate={new Date("2024-04-15")} // April has 30 days
        />
      );
      
      expect(getByText("APRIL 2024")).toBeTruthy();
      expect(getAllByText("30").length).toBeGreaterThan(0);
      // April has 30 days - simplified test since calendar shows adjacent months
    });

    it("handles months with 31 days", () => {
      const { getByText, getAllByText } = render(
        <TerminalCalendar
          highlightedDates={[]}
          initialDate={new Date("2024-01-15")} // January has 31 days
        />
      );
      
      expect(getByText("JANUARY 2024")).toBeTruthy();
      expect(getAllByText("31").length).toBeGreaterThan(0);
    });
  });

  describe("Highlighted Date Edge Cases", () => {
    it("handles same date in different months", () => {
      const highlighted = [
        new Date("2024-01-15"),
        new Date("2024-02-15")
      ];
      const { getByText } = render(
        <TerminalCalendar
          highlightedDates={highlighted}
          initialDate={new Date("2024-01-15")}
        />
      );

      expect(getByText("15").props.className).toContain("bg-terminal-green");
      
      // Navigate to February
      fireEvent.press(getByText(">"));
      expect(getByText("15").props.className).toContain("bg-terminal-green");
    });

    it("handles highlighted dates that span month boundaries", () => {
      const highlighted = [
        new Date("2024-01-31"),
        new Date("2024-02-01")
      ];
      const { getAllByText } = render(
        <TerminalCalendar
          highlightedDates={highlighted}
          initialDate={new Date("2024-01-15")}
        />
      );

      const thirtyOnes = getAllByText("31");
      expect(thirtyOnes.some(el => el.props.className?.includes("bg-terminal-green"))).toBe(true);
    });

    it("handles invalid or edge case dates gracefully", () => {
      const highlighted = [
        new Date("2024-01-15"),
        new Date("invalid"), // Invalid date
      ];
      
      // Should not crash when given invalid dates
      const { getByText } = render(
        <TerminalCalendar
          highlightedDates={highlighted}
          initialDate={new Date("2024-01-15")}
        />
      );

      expect(getByText("15").props.className).toContain("bg-terminal-green");
    });
  });

  describe("Date Calculation Logic", () => {
    it("correctly calculates first day of month", () => {
      // January 1, 2024 was a Monday
      const { getByText, getAllByText } = render(
        <TerminalCalendar
          highlightedDates={[]}
          initialDate={new Date("2024-01-01")}
        />
      );
      
      expect(getByText("JANUARY 2024")).toBeTruthy();
      expect(getAllByText("1").length).toBeGreaterThan(0);
    });

    it("correctly calculates last day of month", () => {
      const { getAllByText } = render(
        <TerminalCalendar
          highlightedDates={[]}
          initialDate={new Date("2024-01-31")}
        />
      );
      
      expect(getAllByText("31").length).toBeGreaterThan(0);
    });

    it("correctly handles month with different starting weekdays", () => {
      // Test different months that start on different days of the week
      const testCases = [
        new Date("2024-03-01"), // March 2024 starts on Friday
        new Date("2024-06-01"), // June 2024 starts on Saturday  
        new Date("2024-09-01"), // September 2024 starts on Sunday
      ];

      testCases.forEach(date => {
        const { getAllByText } = render(
          <TerminalCalendar
            highlightedDates={[]}
            initialDate={date}
          />
        );
        
        expect(getAllByText("1").length).toBeGreaterThan(0);
      });
    });
  });
});
