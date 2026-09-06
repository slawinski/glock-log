import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { DataTransfer } from "./DataTransfer";
import { storage } from "../../services/storage-new";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import {
  unzip,
  unzipWithPassword,
  isPasswordProtected,
} from "react-native-zip-archive";
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
    exportData: jest.fn().mockResolvedValue("file:///test-cache/backup.zip"),
    clearAllData: jest.fn().mockResolvedValue(undefined),
  },
}));

// The global setup mock does not cover the password-aware APIs, so re-mock
// the module here with the full surface used by the screen.
jest.mock("react-native-zip-archive", () => ({
  zip: jest.fn().mockResolvedValue("zip-path"),
  unzip: jest.fn().mockResolvedValue("unzip-path"),
  zipWithPassword: jest.fn().mockResolvedValue("zip-path"),
  unzipWithPassword: jest.fn().mockResolvedValue("unzip-path"),
  isPasswordProtected: jest.fn().mockResolvedValue(false),
  subscribe: jest.fn(),
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
    ErrorDisplay: ({ errorMessage, onRetry }: any) => (
      <View>
        <Text>{errorMessage}</Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry}>
            <Text>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    TerminalInput: ({
      value,
      onChangeText,
      placeholder,
      testID,
      secureTextEntry,
    }: any) => {
      const { TextInput } = require("react-native");
      return (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          testID={testID}
        />
      );
    },
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
      assets: [{ uri: "file:///test/import.zip" }],
    });

    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
      JSON.stringify({
        version: "1.1.0",
        data: { firearms: [], ammunition: [], rangeVisits: [] },
      }),
    );

    // Unencrypted by default: keeps the legacy import path working.
    (isPasswordProtected as jest.Mock).mockResolvedValue(false);
    (unzip as jest.Mock).mockResolvedValue("unzip-path");
    (unzipWithPassword as jest.Mock).mockResolvedValue("unzip-path");

    // Reset module-level mocks whose implementations may be overridden by
    // individual tests (clearAllMocks does not restore implementations).
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([]);
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
  });

  it("renders correctly", () => {
    const { getByText } = render(<DataTransfer />);
    expect(getByText("SECURE DATA EXPORT")).toBeTruthy();
    expect(getByText("SECURE DATA IMPORT")).toBeTruthy();
    expect(getByText("EXPORT SECURE BACKUP")).toBeTruthy();
    expect(getByText("IMPORT SECURE BACKUP")).toBeTruthy();
    expect(getByText("ENCRYPTION PASSPHRASE (MIN 4 CHARACTERS):")).toBeTruthy();
  });

  describe("export", () => {
    it("rejects a passphrase shorter than 4 characters", async () => {
      const { getByPlaceholderText, getByText } = render(<DataTransfer />);

      fireEvent.changeText(getByPlaceholderText("Enter passphrase"), "abc");
      fireEvent.changeText(getByPlaceholderText("Confirm passphrase"), "abc");
      fireEvent.press(getByText("EXPORT SECURE BACKUP"));

      await waitFor(() => {
        expect(
          getByText("Passphrase must be at least 4 characters."),
        ).toBeTruthy();
      });
      expect(storage.exportData).not.toHaveBeenCalled();
    });

    it("rejects mismatched passphrases", async () => {
      const { getByPlaceholderText, getByText } = render(<DataTransfer />);

      fireEvent.changeText(
        getByPlaceholderText("Enter passphrase"),
        "correct-horse",
      );
      fireEvent.changeText(
        getByPlaceholderText("Confirm passphrase"),
        "correct-hors",
      );
      fireEvent.press(getByText("EXPORT SECURE BACKUP"));

      await waitFor(() => {
        expect(getByText("Passphrases do not match.")).toBeTruthy();
      });
      expect(storage.exportData).not.toHaveBeenCalled();
    });

    it("exports an AES-256 encrypted archive and shares it", async () => {
      const { getByPlaceholderText, getByText } = render(<DataTransfer />);

      fireEvent.changeText(
        getByPlaceholderText("Enter passphrase"),
        "correct-horse",
      );
      fireEvent.changeText(
        getByPlaceholderText("Confirm passphrase"),
        "correct-horse",
      );
      fireEvent.press(getByText("EXPORT SECURE BACKUP"));

      await waitFor(() => {
        expect(storage.exportData).toHaveBeenCalledWith("correct-horse");
        expect(Sharing.shareAsync).toHaveBeenCalledWith(
          "file:///test-cache/backup.zip",
          expect.objectContaining({ mimeType: "application/zip" }),
        );
      });

      // The passphrase is cleared from the inputs and never persisted.
      expect(getByPlaceholderText("Enter passphrase").props.value).toBe("");
      expect(getByPlaceholderText("Confirm passphrase").props.value).toBe("");

      expect(getByText("EXPORT SECURE BACKUP")).toBeTruthy();
    });

    it("reports the archive path when sharing is unavailable", async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);
      const { getByPlaceholderText, getByText } = render(<DataTransfer />);

      fireEvent.changeText(
        getByPlaceholderText("Enter passphrase"),
        "correct-horse",
      );
      fireEvent.changeText(
        getByPlaceholderText("Confirm passphrase"),
        "correct-horse",
      );
      fireEvent.press(getByText("EXPORT SECURE BACKUP"));

      await waitFor(() => {
        expect(storage.exportData).toHaveBeenCalledWith("correct-horse");
        expect(alertSpy).toHaveBeenCalledWith(
          "Export Success",
          "Backup archive saved to file:///test-cache/backup.zip",
        );
      });
    });
  });

  describe("import", () => {
    it("handles import process (MERGE) for unencrypted archives", async () => {
      const { getByText } = render(<DataTransfer />);
      const importButton = getByText("IMPORT SECURE BACKUP");

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(DocumentPicker.getDocumentAsync).toHaveBeenCalled();
        expect(isPasswordProtected).toHaveBeenCalledWith(
          "file:///test/import.zip",
        );
        expect(unzip).toHaveBeenCalled();
        expect(unzipWithPassword).not.toHaveBeenCalled();
        expect(FileSystem.readAsStringAsync).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith(
          "Import Strategy",
          expect.any(String),
          expect.any(Array),
        );
      });

      // Manually trigger the MERGE button's onPress
      const mergeButton = alertSpy.mock.calls[0][2]?.find(
        (b: any) => b.text === "MERGE",
      );
      mergeButton?.onPress?.();

      await waitFor(() => {
        expect(storage.importData).toHaveBeenCalledWith(
          expect.any(Object),
          "merge",
        );
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
          expect.any(Array),
        );
      });

      // Manually trigger the FULL RESTORE button's onPress
      const fullRestoreButton = alertSpy.mock.calls[0][2]?.find(
        (b: any) => b.text === "FULL RESTORE",
      );
      fullRestoreButton?.onPress?.();

      // The second confirmation alert
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "Confirm Full Restore",
          expect.any(String),
          expect.any(Array),
        );
      });

      const confirmButton = alertSpy.mock.calls[1][2]?.find(
        (b: any) => b.text === "YES, WIPE AND RESTORE",
      );
      confirmButton?.onPress?.();

      await waitFor(() => {
        expect(storage.importData).toHaveBeenCalledWith(
          expect.any(Object),
          "restore",
        );
      });
    });

    it("rejects archives larger than 100 MB before extracting", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 101 * 1024 * 1024,
      });

      const { getByText } = render(<DataTransfer />);
      fireEvent.press(getByText("IMPORT SECURE BACKUP"));

      await waitFor(() => {
        expect(
          getByText("Import file exceeds the 100 MB size limit."),
        ).toBeTruthy();
      });
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(
        "file:///test/import.zip",
        { size: true },
      );
      expect(isPasswordProtected).not.toHaveBeenCalled();
      expect(unzip).not.toHaveBeenCalled();
      expect(unzipWithPassword).not.toHaveBeenCalled();
    });

    it("asks for a passphrase when the archive is password protected", async () => {
      (isPasswordProtected as jest.Mock).mockResolvedValue(true);
      const { getByText, getByPlaceholderText } = render(<DataTransfer />);

      fireEvent.press(getByText("IMPORT SECURE BACKUP"));

      await waitFor(() => {
        expect(getByText("ARCHIVE IS PASSWORD PROTECTED")).toBeTruthy();
        expect(unzip).not.toHaveBeenCalled();
        expect(unzipWithPassword).not.toHaveBeenCalled();
      });

      fireEvent.changeText(
        getByPlaceholderText("ENTER ARCHIVE PASSPHRASE"),
        "correct-horse",
      );
      fireEvent.press(getByText("UNLOCK ARCHIVE"));

      await waitFor(() => {
        expect(unzipWithPassword).toHaveBeenCalledWith(
          "file:///test/import.zip",
          expect.any(String),
          "correct-horse",
        );
        expect(alertSpy).toHaveBeenCalledWith(
          "Import Strategy",
          expect.any(String),
          expect.any(Array),
        );
      });

      // Manually trigger the MERGE button's onPress
      const mergeButton = alertSpy.mock.calls[0][2]?.find(
        (b: any) => b.text === "MERGE",
      );
      mergeButton?.onPress?.();

      await waitFor(() => {
        expect(storage.importData).toHaveBeenCalledWith(
          expect.any(Object),
          "merge",
        );
      });
    });

    it("shows an error and keeps the prompt when the passphrase is wrong", async () => {
      (isPasswordProtected as jest.Mock).mockResolvedValue(true);
      (unzipWithPassword as jest.Mock).mockRejectedValue(
        new Error("bad password"),
      );
      const { getByText, getByPlaceholderText } = render(<DataTransfer />);

      fireEvent.press(getByText("IMPORT SECURE BACKUP"));

      await waitFor(() => {
        expect(getByText("ARCHIVE IS PASSWORD PROTECTED")).toBeTruthy();
      });

      fireEvent.changeText(
        getByPlaceholderText("ENTER ARCHIVE PASSPHRASE"),
        "wrong-pass",
      );
      fireEvent.press(getByText("UNLOCK ARCHIVE"));

      await waitFor(() => {
        expect(
          getByText(
            "Failed to unlock archive. Check the passphrase and try again.",
          ),
        ).toBeTruthy();
      });
      expect(storage.importData).not.toHaveBeenCalled();
      // Retrying is possible: dismissing the error brings the prompt back.
      fireEvent.press(getByText("Retry"));
      expect(getByText("ARCHIVE IS PASSWORD PROTECTED")).toBeTruthy();
    });

    it("cancels a pending passphrase prompt and cleans up the temp directory", async () => {
      (isPasswordProtected as jest.Mock).mockResolvedValue(true);
      const { getByText, queryByText } = render(<DataTransfer />);

      fireEvent.press(getByText("IMPORT SECURE BACKUP"));

      await waitFor(() => {
        expect(getByText("ARCHIVE IS PASSWORD PROTECTED")).toBeTruthy();
      });

      fireEvent.press(getByText("CANCEL"));

      await waitFor(() => {
        expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
          expect.stringContaining("triggernote_import_"),
          { idempotent: true },
        );
      });
      expect(queryByText("ARCHIVE IS PASSWORD PROTECTED")).toBeNull();
    });

    it("skips extracted image entries whose paths escape the extraction root", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([
        "../../evil.png",
        "ok.png",
      ]);
      const { getByText } = render(<DataTransfer />);

      fireEvent.press(getByText("IMPORT SECURE BACKUP"));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "Import Strategy",
          expect.any(String),
          expect.any(Array),
        );
      });

      const mergeButton = alertSpy.mock.calls[0][2]?.find(
        (b: any) => b.text === "MERGE",
      );
      mergeButton?.onPress?.();

      await waitFor(() => {
        expect(FileSystem.copyAsync).toHaveBeenCalledTimes(1);
        expect(FileSystem.copyAsync).toHaveBeenCalledWith({
          from: expect.stringContaining("/images/ok.png"),
          to: expect.stringContaining("/images/ok.png"),
        });
        expect(storage.importData).toHaveBeenCalledWith(
          expect.any(Object),
          "merge",
        );
      });

      expect(warnSpy).toHaveBeenCalledWith(
        "Skipping archive entry outside the extraction root: ../../evil.png",
      );
      warnSpy.mockRestore();
    });

    it("shows an error when the archive is missing data.json", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });
      const { getByText } = render(<DataTransfer />);

      fireEvent.press(getByText("IMPORT SECURE BACKUP"));

      await waitFor(() => {
        expect(getByText("Failed to import data.")).toBeTruthy();
      });
      expect(storage.importData).not.toHaveBeenCalled();
    });
  });
});
