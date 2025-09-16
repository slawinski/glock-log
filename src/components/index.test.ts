/**
 * Tests for the components barrel file (index.ts)
 * This ensures all component exports are working correctly
 */

// Import directly to test the barrel file
import * as ComponentIndex from "./index";

// Mock all component modules to avoid dependency issues
jest.mock("./chart-toggles/ChartToggles", () => ({
  ChartToggles: "ChartToggles",
  ToggleButton: "ToggleButton",
}));

jest.mock("./firearm-image/FirearmImage", () => ({
  FirearmImage: "FirearmImage",
}));

jest.mock("./image-gallery/ImageGallery", () => ({
  ImageGallery: "ImageGallery",
  DeleteButton: "DeleteButton",
}));

jest.mock("./placeholder-image-picker/PlaceholderImagePicker", () => ({
  PlaceholderImagePicker: "PlaceholderImagePicker",
}));

jest.mock("./scanlines-overlay/ScanlinesOverlay", () => ({
  ScanlinesOverlay: "ScanlinesOverlay",
}));

jest.mock("./terminal-button/TerminalButton", () => ({
  TerminalButton: "TerminalButton",
}));

jest.mock("./terminal-button/HeaderButton", () => ({
  HeaderButton: "HeaderButton",
}));

jest.mock("./terminal-calendar/TerminalCalendar", () => ({
  TerminalCalendar: "TerminalCalendar",
}));

jest.mock("./terminal-calendar-header/TerminalCalendarHeader", () => ({
  TerminalCalendarHeader: "TerminalCalendarHeader",
}));

jest.mock("./terminal-date-picker/TerminalDatePicker", () => ({
  TerminalDatePicker: "TerminalDatePicker",
}));

jest.mock("./terminal-input/TerminalInput", () => ({
  TerminalInput: "TerminalInput",
}));

jest.mock("./terminal-tabs/TerminalTabs", () => ({
  TerminalTabs: "TerminalTabs",
}));

jest.mock("./terminal-text/TerminalText", () => ({
  TerminalText: "TerminalText",
}));

describe("components/index.ts", () => {
  it("exports ChartToggles components", () => {
    expect(ComponentIndex.ChartToggles).toBe("ChartToggles");
    expect((ComponentIndex as any).ToggleButton).toBe("ToggleButton");
  });

  it("exports FirearmImage component", () => {
    expect(ComponentIndex.FirearmImage).toBe("FirearmImage");
  });

  it("exports ImageGallery components", () => {
    expect(ComponentIndex.ImageGallery).toBe("ImageGallery");
    expect((ComponentIndex as any).DeleteButton).toBe("DeleteButton");
  });

  it("exports PlaceholderImagePicker component", () => {
    expect(ComponentIndex.PlaceholderImagePicker).toBe("PlaceholderImagePicker");
  });

  it("exports ScanlinesOverlay component", () => {
    expect(ComponentIndex.ScanlinesOverlay).toBe("ScanlinesOverlay");
  });

  it("exports TerminalButton components", () => {
    expect(ComponentIndex.TerminalButton).toBe("TerminalButton");
    expect(ComponentIndex.HeaderButton).toBe("HeaderButton");
  });

  it("exports TerminalCalendar components", () => {
    expect(ComponentIndex.TerminalCalendar).toBe("TerminalCalendar");
    expect(ComponentIndex.TerminalCalendarHeader).toBe("TerminalCalendarHeader");
  });

  it("exports TerminalDatePicker component", () => {
    expect(ComponentIndex.TerminalDatePicker).toBe("TerminalDatePicker");
  });

  it("exports TerminalInput component", () => {
    expect(ComponentIndex.TerminalInput).toBe("TerminalInput");
  });

  it("exports TerminalTabs component", () => {
    expect(ComponentIndex.TerminalTabs).toBe("TerminalTabs");
  });

  it("exports TerminalText component", () => {
    expect(ComponentIndex.TerminalText).toBe("TerminalText");
  });

  it("exports all expected components", () => {
    const expectedExports = [
      "ChartToggles",
      "ToggleButton",
      "FirearmImage",
      "ImageGallery", 
      "DeleteButton",
      "PlaceholderImagePicker",
      "ScanlinesOverlay",
      "TerminalButton",
      "HeaderButton",
      "TerminalCalendar",
      "TerminalCalendarHeader",
      "TerminalDatePicker",
      "TerminalInput",
      "TerminalTabs",
      "TerminalText",
    ];
    
    expectedExports.forEach(exportName => {
      expect(ComponentIndex).toHaveProperty(exportName);
      expect((ComponentIndex as any)[exportName]).toBeDefined();
    });
  });

  it("exports are not null or undefined", () => {
    Object.values(ComponentIndex).forEach(exportedValue => {
      expect(exportedValue).not.toBeNull();
      expect(exportedValue).not.toBeUndefined();
    });
  });

  it("maintains consistent export structure", () => {
    const exportNames = Object.keys(ComponentIndex);
    
    // Should have a reasonable number of exports
    expect(exportNames.length).toBeGreaterThan(10);
    expect(exportNames.length).toBeLessThan(20);
    
    // All export names should be strings
    exportNames.forEach(name => {
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
    });
  });
});