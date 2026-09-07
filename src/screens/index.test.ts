/**
 * Tests for the screens barrel file (index.ts)
 * This ensures all screen exports are working correctly
 */

// Import directly to test the barrel file
import * as ScreenIndex from "./index";

// Mock all screen modules to avoid dependency issues
jest.mock("./add-ammunition/AddAmmunition", () => ({
  AddAmmunition: "AddAmmunition",
}));

jest.mock("./add-firearm/AddFirearm", () => ({
  AddFirearm: "AddFirearm",
}));

jest.mock("./add-range-visit/AddRangeVisit", () => ({
  AddRangeVisit: "AddRangeVisit",
}));

jest.mock("./ammunition-details/AmmunitionDetails", () => ({
  AmmunitionDetails: "AmmunitionDetails",
}));

jest.mock("./edit-ammunition/EditAmmunition", () => ({
  EditAmmunition: "EditAmmunition",
}));

jest.mock("./edit-firearm/EditFirearm", () => ({
  EditFirearm: "EditFirearm",
}));

jest.mock("./edit-range-visit/EditRangeVisit", () => ({
  EditRangeVisit: "EditRangeVisit",
}));

jest.mock("./firearm-details/FirearmDetails", () => ({
  FirearmDetails: "FirearmDetails",
}));

jest.mock("./home/Home", () => ({
  Home: "Home",
}));

jest.mock("./range-visit-details/RangeVisitDetails", () => ({
  RangeVisitDetails: "RangeVisitDetails",
}));

jest.mock("./stats/Stats", () => ({
  Stats: "Stats",
}));

jest.mock("./menu/Menu", () => ({
  Menu: "Menu",
}));

jest.mock("./settings/Settings", () => ({
  Settings: "Settings",
}));

jest.mock("./currency-selection/CurrencySelection", () => ({
  CurrencySelection: "CurrencySelection",
}));

jest.mock("./data-transfer/DataTransfer", () => ({
  DataTransfer: "DataTransfer",
}));

jest.mock("./log-cleaning/LogCleaning", () => ({
  LogCleaning: "LogCleaning",
}));

jest.mock("./cleaning-history/CleaningHistory", () => ({
  CleaningHistory: "CleaningHistory",
}));

jest.mock("./cleaning-event-details/CleaningEventDetails", () => ({
  CleaningEventDetails: "CleaningEventDetails",
}));

jest.mock("./cleaning-settings/CleaningSettings", () => ({
  CleaningSettings: "CleaningSettings",
}));

jest.mock("./parts-life/PartsLife", () => ({
  PartsLife: "PartsLife",
}));

jest.mock("./firearm-parts/FirearmParts", () => ({
  FirearmParts: "FirearmParts",
}));

jest.mock("./part-details/PartDetails", () => ({
  PartDetails: "PartDetails",
}));

jest.mock("./add-part/AddPart", () => ({
  AddPart: "AddPart",
}));

jest.mock("./replace-part/ReplacePart", () => ({
  ReplacePart: "ReplacePart",
}));

jest.mock("./add-accessory/AddAccessory", () => ({
  AddAccessory: "AddAccessory",
}));

jest.mock("./accessory-details/AccessoryDetails", () => ({
  AccessoryDetails: "AccessoryDetails",
}));

jest.mock("./edit-accessory/EditAccessory", () => ({
  EditAccessory: "EditAccessory",
}));

jest.mock("./manage-firearm-accessories/ManageFirearmAccessories", () => ({
  ManageFirearmAccessories: "ManageFirearmAccessories",
}));

jest.mock("./accessory-reconciliation/AccessoryReconciliation", () => ({
  AccessoryReconciliation: "AccessoryReconciliation",
}));

describe("screens/index.ts", () => {
  it("exports AddAmmunition screen", () => {
    expect(ScreenIndex.AddAmmunition).toBe("AddAmmunition");
  });

  it("exports AddFirearm screen", () => {
    expect(ScreenIndex.AddFirearm).toBe("AddFirearm");
  });

  it("exports AddRangeVisit screen", () => {
    expect(ScreenIndex.AddRangeVisit).toBe("AddRangeVisit");
  });

  it("exports AmmunitionDetails screen", () => {
    expect(ScreenIndex.AmmunitionDetails).toBe("AmmunitionDetails");
  });

  it("exports EditAmmunition screen", () => {
    expect(ScreenIndex.EditAmmunition).toBe("EditAmmunition");
  });

  it("exports EditFirearm screen", () => {
    expect(ScreenIndex.EditFirearm).toBe("EditFirearm");
  });

  it("exports EditRangeVisit screen", () => {
    expect(ScreenIndex.EditRangeVisit).toBe("EditRangeVisit");
  });

  it("exports FirearmDetails screen", () => {
    expect(ScreenIndex.FirearmDetails).toBe("FirearmDetails");
  });

  it("exports Home screen", () => {
    expect(ScreenIndex.Home).toBe("Home");
  });

  it("exports RangeVisitDetails screen", () => {
    expect(ScreenIndex.RangeVisitDetails).toBe("RangeVisitDetails");
  });

  it("exports Stats screen", () => {
    expect(ScreenIndex.Stats).toBe("Stats");
  });

  it("exports all expected screens", () => {
    const expectedExports = [
      "AddAmmunition",
      "AddFirearm",
      "AddRangeVisit",
      "AmmunitionDetails",
      "EditAmmunition",
      "EditFirearm",
      "EditRangeVisit",
      "FirearmDetails",
      "Home",
      "RangeVisitDetails",
      "Stats",
      "Menu",
      "Settings",
      "CurrencySelection",
      "DataTransfer",
      "LogCleaning",
      "CleaningHistory",
      "CleaningEventDetails",
      "CleaningSettings",
      "PartsLife",
      "FirearmParts",
      "PartDetails",
      "AddPart",
      "ReplacePart",
      "AddAccessory",
      "AccessoryDetails",
      "EditAccessory",
      "ManageFirearmAccessories",
      "AccessoryReconciliation",
    ];

    expectedExports.forEach((exportName) => {
      expect(ScreenIndex).toHaveProperty(exportName);
      expect((ScreenIndex as any)[exportName]).toBeDefined();
    });
  });

  it("exports are not null or undefined", () => {
    Object.values(ScreenIndex).forEach((exportedValue) => {
      expect(exportedValue).not.toBeNull();
      expect(exportedValue).not.toBeUndefined();
    });
  });

  it("maintains consistent export count", () => {
    const exportNames = Object.keys(ScreenIndex);
    expect(exportNames.length).toBe(29);
    exportNames.forEach((name) => {
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
    });
  });
});
