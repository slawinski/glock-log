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

  describe("Basic Rendering", () => {
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

    it("renders correctly with empty items array", () => {
      const { getByText, queryByText } = render(
        <ChartToggles
          items={[]}
          visibleItems={new Set()}
          onToggleItem={mockOnToggleItem}
          onToggleAll={mockOnToggleAll}
          isAllSelected={false}
        />
      );

      // ALL toggle should still be present
      expect(getByText("ALL")).toBeTruthy();
      
      // No item toggles should be rendered
      expect(queryByText("Glock 19")).toBeNull();
      expect(queryByText("AR-15")).toBeNull();
    });

    it("renders with single item", () => {
      const singleItem = [{ id: "1", title: "Single Item" }];
      const { getByText } = render(
        <ChartToggles
          items={singleItem}
          visibleItems={new Set(["1"])}
          onToggleItem={mockOnToggleItem}
          onToggleAll={mockOnToggleAll}
          isAllSelected={false}
        />
      );

      expect(getByText("ALL")).toBeTruthy();
      expect(getByText("Single Item")).toBeTruthy();
    });

    it("renders with many items", () => {
      const manyItems = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i}`,
        title: `Item ${i + 1}`,
      }));

      const { getByText } = render(
        <ChartToggles
          items={manyItems}
          visibleItems={new Set(["item-0", "item-5"])}
          onToggleItem={mockOnToggleItem}
          onToggleAll={mockOnToggleAll}
          isAllSelected={false}
        />
      );

      expect(getByText("ALL")).toBeTruthy();
      manyItems.forEach(item => {
        expect(getByText(item.title)).toBeTruthy();
      });
    });
  });

  describe("User Interactions", () => {
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
      expect(mockOnToggleItem).toHaveBeenCalledTimes(1);
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
      expect(mockOnToggleAll).toHaveBeenCalledTimes(1);
      expect(mockOnToggleItem).not.toHaveBeenCalled();
    });

    it("calls onToggleItem with correct id for multiple items", () => {
      const { getByText } = render(
        <ChartToggles
          items={mockItems}
          visibleItems={mockVisibleItems}
          onToggleItem={mockOnToggleItem}
          onToggleAll={mockOnToggleAll}
          isAllSelected={false}
        />
      );

      fireEvent.press(getByText("AR-15"));
      expect(mockOnToggleItem).toHaveBeenCalledWith("2");

      fireEvent.press(getByText("Beretta 92"));
      expect(mockOnToggleItem).toHaveBeenCalledWith("3");

      expect(mockOnToggleItem).toHaveBeenCalledTimes(2);
    });

    it("does not interfere with multiple rapid clicks", () => {
      const { getByText } = render(
        <ChartToggles
          items={mockItems}
          visibleItems={mockVisibleItems}
          onToggleItem={mockOnToggleItem}
          onToggleAll={mockOnToggleAll}
          isAllSelected={false}
        />
      );

      const glockToggle = getByText("Glock 19");
      fireEvent.press(glockToggle);
      fireEvent.press(glockToggle);
      fireEvent.press(glockToggle);

      expect(mockOnToggleItem).toHaveBeenCalledTimes(3);
      expect(mockOnToggleItem).toHaveBeenCalledWith("1");
    });
  });

  describe("Visibility State Management", () => {
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

    it("applies correct styling when ALL is not selected", () => {
      const { getByText } = render(
        <ChartToggles
          items={mockItems}
          visibleItems={mockVisibleItems}
          onToggleItem={mockOnToggleItem}
          onToggleAll={mockOnToggleAll}
          isAllSelected={false}
        />
      );

      const allToggle = getByText("ALL");

      // ALL should be inactive
      expect(allToggle.props.className).toContain("text-terminal-green");
      expect(allToggle.props.className).not.toContain(
        "bg-terminal-green text-terminal-bg"
      );
    });

    it("handles empty visibleItems set correctly", () => {
      const { getByText } = render(
        <ChartToggles
          items={mockItems}
          visibleItems={new Set()}
          onToggleItem={mockOnToggleItem}
          onToggleAll={mockOnToggleAll}
          isAllSelected={false}
        />
      );

      // All items should be inactive
      mockItems.forEach(item => {
        const toggle = getByText(item.title);
        expect(toggle.props.className).toContain("text-terminal-green");
        expect(toggle.props.className).not.toContain(
          "bg-terminal-green text-terminal-bg"
        );
      });
    });

    it("handles all items visible correctly", () => {
      const allVisible = new Set(mockItems.map(item => item.id));
      const { getByText } = render(
        <ChartToggles
          items={mockItems}
          visibleItems={allVisible}
          onToggleItem={mockOnToggleItem}
          onToggleAll={mockOnToggleAll}
          isAllSelected={true}
        />
      );

      // All items should be active
      mockItems.forEach(item => {
        const toggle = getByText(item.title);
        expect(toggle.props.className).toContain(
          "bg-terminal-green text-terminal-bg"
        );
      });
    });
  });

  describe("Set Operations and Edge Cases", () => {
    it("handles visibleItems Set with extra ids not in items", () => {
      const visibleWithExtra = new Set(["1", "2", "non-existent-id", "another-fake-id"]);
      const { getByText } = render(
        <ChartToggles
          items={mockItems}
          visibleItems={visibleWithExtra}
          onToggleItem={mockOnToggleItem}
          onToggleAll={mockOnToggleAll}
          isAllSelected={false}
        />
      );

      // Should still render correctly, extra IDs should be ignored
      expect(getByText("Glock 19")).toBeTruthy();
      expect(getByText("AR-15")).toBeTruthy();
      expect(getByText("Beretta 92")).toBeTruthy();

      // Items 1 and 2 should be active
      const glockToggle = getByText("Glock 19");
      const arToggle = getByText("AR-15");
      const berettaToggle = getByText("Beretta 92");

      expect(glockToggle.props.className).toContain("bg-terminal-green text-terminal-bg");
      expect(arToggle.props.className).toContain("bg-terminal-green text-terminal-bg");
      expect(berettaToggle.props.className).not.toContain("bg-terminal-green text-terminal-bg");
    });

    it("handles duplicate ids in items array", () => {
      const itemsWithDuplicates = [
        { id: "1", title: "First Item" },
        { id: "1", title: "Duplicate Item" }, // Same ID as first
        { id: "2", title: "Second Item" },
      ];

      const { getByText, queryByText } = render(
        <ChartToggles
          items={itemsWithDuplicates}
          visibleItems={new Set(["1"])}
          onToggleItem={mockOnToggleItem}
          onToggleAll={mockOnToggleAll}
          isAllSelected={false}
        />
      );

      // Both items with id "1" should be rendered (React will handle key warnings)
      expect(getByText("First Item")).toBeTruthy();
      expect(getByText("Duplicate Item")).toBeTruthy();
      expect(getByText("Second Item")).toBeTruthy();
    });

    it("handles very large visibleItems Set efficiently", () => {
      const largeSet = new Set();
      for (let i = 0; i < 10000; i++) {
        largeSet.add(`item-${i}`);
      }
      largeSet.add("1"); // Include one of our actual items

      const { getByText } = render(
        <ChartToggles
          items={mockItems}
          visibleItems={largeSet as Set<string>}
          onToggleItem={mockOnToggleItem}
          onToggleAll={mockOnToggleAll}
          isAllSelected={false}
        />
      );

      // Should render without performance issues
      expect(getByText("Glock 19")).toBeTruthy();
      
      // Item 1 should be active due to large set containing "1"
      const glockToggle = getByText("Glock 19");
      expect(glockToggle.props.className).toContain("bg-terminal-green text-terminal-bg");
    });

    it("handles items with special characters in titles", () => {
      const specialItems = [
        { id: "1", title: "Item with & special chars" },
        { id: "2", title: "Item with <brackets>" },
        { id: "3", title: "Item with \"quotes\"" },
        { id: "4", title: "Item with emoji 🔫" },
      ];

      const { getByText } = render(
        <ChartToggles
          items={specialItems}
          visibleItems={new Set(["1", "3"])}
          onToggleItem={mockOnToggleItem}
          onToggleAll={mockOnToggleAll}
          isAllSelected={false}
        />
      );

      expect(getByText("Item with & special chars")).toBeTruthy();
      expect(getByText("Item with <brackets>")).toBeTruthy();
      expect(getByText("Item with \"quotes\"")).toBeTruthy();
      expect(getByText("Item with emoji 🔫")).toBeTruthy();
    });

    it("handles items with very long titles", () => {
      const longTitleItems = [
        { 
          id: "1", 
          title: "This is a very long title that might wrap to multiple lines and test how the component handles extensive text content in toggle buttons" 
        },
        { id: "2", title: "Short" },
      ];

      const { getByText } = render(
        <ChartToggles
          items={longTitleItems}
          visibleItems={new Set(["1"])}
          onToggleItem={mockOnToggleItem}
          onToggleAll={mockOnToggleAll}
          isAllSelected={false}
        />
      );

      expect(getByText(longTitleItems[0].title)).toBeTruthy();
      expect(getByText("Short")).toBeTruthy();
    });

    it("handles empty string titles", () => {
      const emptyTitleItems = [
        { id: "1", title: "" },
        { id: "2", title: "Normal Title" },
      ];

      const { getByText } = render(
        <ChartToggles
          items={emptyTitleItems}
          visibleItems={new Set(["1"])}
          onToggleItem={mockOnToggleItem}
          onToggleAll={mockOnToggleAll}
          isAllSelected={false}
        />
      );

      expect(getByText("Normal Title")).toBeTruthy();
      // Empty title should still create a button, just with no visible text
      // Component should render without crashing
    });
  });

  describe("Component Structure", () => {
    it("renders ALL toggle and all items", () => {
      const { getByText } = render(
        <ChartToggles
          items={mockItems}
          visibleItems={mockVisibleItems}
          onToggleItem={mockOnToggleItem}
          onToggleAll={mockOnToggleAll}
          isAllSelected={false}
        />
      );

      // ALL toggle should be present
      expect(getByText("ALL")).toBeTruthy();
      
      // All items should be present
      mockItems.forEach(item => {
        expect(getByText(item.title)).toBeTruthy();
      });
    });
  });

  describe("Props Validation Edge Cases", () => {
    it("handles null or undefined callback gracefully", () => {
      // This would typically cause TypeScript errors, but testing runtime behavior
      const { getByText } = render(
        <ChartToggles
          items={mockItems}
          visibleItems={mockVisibleItems}
          onToggleItem={null as any}
          onToggleAll={null as any}
          isAllSelected={false}
        />
      );

      // Should render without crashing
      expect(getByText("ALL")).toBeTruthy();
      expect(getByText("Glock 19")).toBeTruthy();
    });
  });
});
