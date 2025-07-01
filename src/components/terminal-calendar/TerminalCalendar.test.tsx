import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TerminalCalendar } from "./TerminalCalendar";

describe("TerminalCalendar", () => {
  it("renders correctly with initial date", () => {
    const { getByText } = render(
      <TerminalCalendar
        highlightedDates={[]}
        initialDate={new Date("2024-01-15")}
      />
    );
    expect(getByText("JANUARY 2024")).toBeTruthy();
  });

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
});
