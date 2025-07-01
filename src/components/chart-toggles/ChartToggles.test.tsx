import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ChartToggles, ChartToggleConfig } from "./ChartToggles";

describe("ChartToggles", () => {
  const mockItems: ChartToggleConfig[] = [
    { id: "1", title: "Glock 19" },
    { id: "2", title: "AR-15" },
    { id: "3", title: "Beretta 92" },
  ];

  const mockVisibleItems = new Set(["1", "2"]);
  const mockOnToggleItem = jest.fn();
  const mockOnToggleAll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all items and ALL toggle", () => {
    const { getByText } = render(
      <ChartToggles
        items={mockItems}
        visibleItems={mockVisibleItems}
        onToggleItem={mockOnToggleItem}
        onToggleAll={mockOnToggleAll}
        isAllSelected={false}
      />
    );

    expect(getByText("ALL")).toBeTruthy();
    expect(getByText("Glock 19")).toBeTruthy();
    expect(getByText("AR-15")).toBeTruthy();
    expect(getByText("Beretta 92")).toBeTruthy();
  });

  it("calls onToggleItem when an item toggle is pressed", () => {
    const { getByText } = render(
      <ChartToggles
        items={mockItems}
        visibleItems={mockVisibleItems}
        onToggleItem={mockOnToggleItem}
        onToggleAll={mockOnToggleAll}
        isAllSelected={false}
      />
    );

    fireEvent.press(getByText("Glock 19"));
    expect(mockOnToggleItem).toHaveBeenCalledWith("1");
  });

  it("calls onToggleAll when ALL toggle is pressed", () => {
    const { getByText } = render(
      <ChartToggles
        items={mockItems}
        visibleItems={mockVisibleItems}
        onToggleItem={mockOnToggleItem}
        onToggleAll={mockOnToggleAll}
        isAllSelected={false}
      />
    );

    fireEvent.press(getByText("ALL"));
    expect(mockOnToggleAll).toHaveBeenCalled();
  });

  it("applies correct styling for active toggles", () => {
    const { getByText } = render(
      <ChartToggles
        items={mockItems}
        visibleItems={mockVisibleItems}
        onToggleItem={mockOnToggleItem}
        onToggleAll={mockOnToggleAll}
        isAllSelected={true}
      />
    );

    const allToggle = getByText("ALL");
    const glockToggle = getByText("Glock 19");
    const berettaToggle = getByText("Beretta 92");

    // ALL should be active (black text on green background)
    expect(allToggle.props.className).toContain(
      "bg-terminal-green text-terminal-bg"
    );

    // Glock 19 should be active (black text on green background)
    expect(glockToggle.props.className).toContain(
      "bg-terminal-green text-terminal-bg"
    );

    // Beretta 92 should be inactive (green text on black background)
    expect(berettaToggle.props.className).toContain("text-terminal-green");
    expect(berettaToggle.props.className).not.toContain(
      "bg-terminal-green text-terminal-bg"
    );
  });
});
