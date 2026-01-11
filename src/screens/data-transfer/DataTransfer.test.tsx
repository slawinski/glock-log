import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react-native";
import { DataTransfer } from "./DataTransfer";
import { storage } from "../../services/storage-new";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

// Mock dependencies
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
  },
}));

jest.mock("expo-file-system", () => ({
  documentDirectory: "file:///test/docs/",
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue(JSON.stringify({
    version: "1.0.0",
    data: { firearms: [], ammunition: [], rangeVisits: [] }
  })),
  EncodingType: { UTF8: "utf8" },
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: "file:///test/import.json" }]
  }),
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

describe("DataTransfer Screen", () => {
  it("renders correctly", () => {
    const { getByText } = render(<DataTransfer />);
    expect(getByText("DATA EXPORT")).toBeTruthy();
    expect(getByText("DATA IMPORT")).toBeTruthy();
    expect(getByText("EXPORT DATABASE")).toBeTruthy();
    expect(getByText("IMPORT DATABASE")).toBeTruthy();
  });

  it("handles export process", async () => {
    const { getByText } = render(<DataTransfer />);
    const exportButton = getByText("EXPORT DATABASE");

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

    expect(getByText("EXPORT DATABASE")).toBeTruthy();
  });

  it("handles import process", async () => {
    const { getByText } = render(<DataTransfer />);
    const importButton = getByText("IMPORT DATABASE");

    fireEvent.press(importButton);

    await waitFor(() => {
      expect(DocumentPicker.getDocumentAsync).toHaveBeenCalled();
      expect(FileSystem.readAsStringAsync).toHaveBeenCalled();
      expect(storage.importData).toHaveBeenCalled();
    });

    expect(getByText("IMPORT DATABASE")).toBeTruthy();
  });
});