import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react-native";
import { DataTransfer } from "./DataTransfer";
import { storage } from "../../services/storage-new";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { Alert } from "react-native";

// Mock navigation
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock("../../services/storage-new", () => ({
  storage: {
    getFirearms: jest.fn().mockResolvedValue([]),
    getAmmunition: jest.fn().mockResolvedValue([]),
    getRangeVisits: jest.fn().mockResolvedValue([]),
    importData: jest.fn().mockResolvedValue(undefined),
    clearAllData: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../../components", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return {
    TerminalText: ({ children, className }: any) => (
      <Text testID="terminal-text" className={className}>
        {children}
      </Text>
    ),
    TerminalButton: ({ caption, onPress }: any) => (
      <TouchableOpacity onPress={onPress}>
        <Text>{caption}</Text>
      </TouchableOpacity>
    ),
    ErrorDisplay: ({ errorMessage }: any) => (
      <View>
        <Text>{errorMessage}</Text>
      </View>
    ),
  };
});

// Mock Alert.alert
const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("DataTransfer Screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks for DocumentPicker and FileSystem
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///test/import.zip" }]
    });
    
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify({
      version: "1.1.0",
      data: { firearms: [], ammunition: [], rangeVisits: [] }
    }));
  });

  it("renders correctly", () => {
    const { getByText } = render(<DataTransfer />);
    expect(getByText("SECURE DATA EXPORT")).toBeTruthy();
    expect(getByText("SECURE DATA IMPORT")).toBeTruthy();
    expect(getByText("EXPORT SECURE BACKUP")).toBeTruthy();
    expect(getByText("IMPORT SECURE BACKUP")).toBeTruthy();
  });

  it("handles export process", async () => {
    const { getByText } = render(<DataTransfer />);
    const exportButton = getByText("EXPORT SECURE BACKUP");

    fireEvent.press(exportButton);

    await waitFor(() => {
      expect(screen.getAllByText("PROCESSING...").length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(storage.getFirearms).toHaveBeenCalled();
      expect(storage.getAmmunition).toHaveBeenCalled();
      expect(storage.getRangeVisits).toHaveBeenCalled();
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      expect(Sharing.shareAsync).toHaveBeenCalled();
    });

    expect(getByText("EXPORT SECURE BACKUP")).toBeTruthy();
  });

  it("handles import process (MERGE)", async () => {
    const { getByText } = render(<DataTransfer />);
    const importButton = getByText("IMPORT SECURE BACKUP");

    fireEvent.press(importButton);

    await waitFor(() => {
      expect(DocumentPicker.getDocumentAsync).toHaveBeenCalled();
      expect(FileSystem.readAsStringAsync).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        "Import Strategy",
        expect.any(String),
        expect.any(Array)
      );
    });

    // Manually trigger the MERGE button's onPress
    const mergeButton = alertSpy.mock.calls[0][2]?.find((b: any) => b.text === "MERGE");
    mergeButton?.onPress?.();

    await waitFor(() => {
      expect(storage.importData).toHaveBeenCalledWith(expect.any(Object), "merge");
    });

    expect(getByText("IMPORT SECURE BACKUP")).toBeTruthy();
  });

  it("handles import process (FULL RESTORE)", async () => {
    const { getByText } = render(<DataTransfer />);
    const importButton = getByText("IMPORT SECURE BACKUP");

    fireEvent.press(importButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Import Strategy",
        expect.any(String),
        expect.any(Array)
      );
    });

    // Manually trigger the FULL RESTORE button's onPress
    const fullRestoreButton = alertSpy.mock.calls[0][2]?.find((b: any) => b.text === "FULL RESTORE");
    fullRestoreButton?.onPress?.();

    // The second confirmation alert
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Confirm Full Restore",
        expect.any(String),
        expect.any(Array)
      );
    });

    const confirmButton = alertSpy.mock.calls[1][2]?.find((b: any) => b.text === "YES, WIPE AND RESTORE");
    confirmButton?.onPress?.();

    await waitFor(() => {
      expect(storage.importData).toHaveBeenCalledWith(expect.any(Object), "restore");
    });
  });
});