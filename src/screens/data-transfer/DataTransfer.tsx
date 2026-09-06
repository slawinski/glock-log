import React, { useState } from "react";
import { View, Alert, ScrollView } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import {
  unzip,
  unzipWithPassword,
  isPasswordProtected,
} from "react-native-zip-archive";
import {
  TerminalText,
  TerminalButton,
  TerminalInput,
  ErrorDisplay,
} from "../../components";
import { storage } from "../../services/storage-new";
import { setNoBackupFlag } from "../../services/image-storage";
import { handleError, createAppError } from "../../services/error-handler";
import {
  ImportData,
  ImportFileTooLargeError,
  checkImportFileSize,
  cleanPath,
  isImportData,
  isPathInside,
} from "../../services/data-transfer-service";

type PendingImport = {
  zipUri: string;
  tempExtractDir: string;
};

export const DataTransfer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [exportPassword, setExportPassword] = useState("");
  const [exportPasswordConfirm, setExportPasswordConfirm] = useState("");
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(
    null,
  );
  const [importPassword, setImportPassword] = useState("");

  const cleanupTempDir = async (dir: string) => {
    try {
      await FileSystem.deleteAsync(dir, { idempotent: true });
    } catch {
      /* ignore cleanup errors */
    }
  };

  const handleExport = async () => {
    // Validate the passphrase before doing any work (B7)
    if (exportPassword.length < 4) {
      setError("Passphrase must be at least 4 characters.");
      return;
    }
    if (exportPassword !== exportPasswordConfirm) {
      setError("Passphrases do not match.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStatusMessage("Collecting data...");

      // Build the AES-256 encrypted archive (passphrase is used in memory
      // only and never stored).
      const zipPath = await storage.exportData(exportPassword);

      // Share ZIP
      setStatusMessage("Sharing archive...");
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(zipPath, {
          mimeType: "application/zip",
          dialogTitle: "Export Secure Backup",
          UTI: "public.zip-archive",
        });
        setStatusMessage("Export complete.");
      } else {
        setStatusMessage(`Export saved to: ${zipPath}`);
        Alert.alert("Export Success", `Backup archive saved to ${zipPath}`);
      }
    } catch (err) {
      const appError = createAppError(err, "Failed to export data.");
      setError(appError.userMessage);
      handleError(err, "DataTransfer.handleExport");
      setStatusMessage(null);
    } finally {
      // The passphrase must not outlive the export operation (B7).
      setExportPassword("");
      setExportPasswordConfirm("");
      setLoading(false);
    }
  };

  const handleCancelPendingImport = async () => {
    const pending = pendingImport;
    setPendingImport(null);
    setImportPassword("");
    setStatusMessage(null);
    if (pending) {
      await cleanupTempDir(pending.tempExtractDir);
    }
  };

  const handleUnlockArchive = async () => {
    const pending = pendingImport;
    if (!pending) {
      return;
    }

    if (!importPassword) {
      setError("Enter the archive passphrase.");
      return;
    }

    setError(null);
    setLoading(true);
    setStatusMessage("Extracting...");

    try {
      // B7: password-protected archives are extracted with the user-supplied
      // passphrase (used in memory only, never stored).
      await unzipWithPassword(
        cleanPath(pending.zipUri),
        cleanPath(pending.tempExtractDir),
        importPassword,
      );

      setPendingImport(null);
      setImportPassword("");
      setLoading(false);
      setStatusMessage(null);

      await continueImport(pending.tempExtractDir);
    } catch (err) {
      const appError = createAppError(
        err,
        "Failed to unlock archive. Check the passphrase and try again.",
      );
      setError(appError.userMessage);
      handleError(err, "DataTransfer.handleUnlockArchive");
      setStatusMessage(null);
      setLoading(false);
    }
  };

  const handleImport = async () => {
    let tempExtractDir = "";
    try {
      // Starting a new import supersedes a pending passphrase prompt.
      if (pendingImport) {
        await handleCancelPendingImport();
      }

      setError(null);
      setStatusMessage(null);

      // 1. Pick ZIP File
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/zip", "application/x-zip-compressed"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      setLoading(true);
      setStatusMessage("Opening archive...");

      const asset = result.assets[0];
      const zipUri = asset.uri;

      // 2. Reject oversized archives before touching the filesystem (C19)
      await checkImportFileSize(zipUri);

      // 3. Detect password protection (B7)
      const passwordProtected = await isPasswordProtected(cleanPath(zipUri));

      tempExtractDir = `${FileSystem.cacheDirectory}triggernote_import_${Date.now()}`;
      await FileSystem.makeDirectoryAsync(tempExtractDir, {
        intermediates: true,
      });

      if (passwordProtected) {
        // Hold the archive and ask for the passphrase before extracting.
        setLoading(false);
        setStatusMessage(null);
        setPendingImport({ zipUri, tempExtractDir });
        return;
      }

      // 4. Unzip (legacy unencrypted archives keep working)
      setStatusMessage("Extracting...");
      await unzip(cleanPath(zipUri), cleanPath(tempExtractDir));

      setLoading(false);
      setStatusMessage(null);

      await continueImport(tempExtractDir);
    } catch (err) {
      const userMessage =
        err instanceof ImportFileTooLargeError
          ? err.message
          : "Failed to import data.";
      const appError = createAppError(err, userMessage);
      setError(appError.userMessage);
      handleError(err, "DataTransfer.handleImport");
      setStatusMessage(null);
      setLoading(false);
      if (tempExtractDir) {
        await cleanupTempDir(tempExtractDir);
      }
    }
  };

  /**
   * Post-extraction steps shared by the legacy and password-protected import
   * paths: read and validate data.json, then ask for the import strategy.
   */
  const continueImport = async (tempExtractDir: string) => {
    // Read data.json — verify the resolved path stays inside the extraction
    // root before reading (C18 zip-slip defense).
    const dataJsonPath = `${tempExtractDir}/data.json`;
    if (!isPathInside(tempExtractDir, dataJsonPath)) {
      throw new Error("Invalid backup: archive contains unsafe paths.");
    }

    const jsonExists = await FileSystem.getInfoAsync(dataJsonPath);
    if (!jsonExists.exists) {
      throw new Error("Invalid backup: data.json missing.");
    }

    const fileContent = await FileSystem.readAsStringAsync(dataJsonPath);
    const parsed = JSON.parse(fileContent) as unknown;

    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Invalid import file format.");
    }

    const candidate = parsed as Record<string, unknown>;
    const rawData = candidate.data;
    if (!candidate.version || !isImportData(rawData)) {
      throw new Error("Invalid import file format.");
    }

    const bundle: ImportData = rawData;

    setLoading(false);
    setStatusMessage(null);

    // Ask for strategy
    Alert.alert(
      "Import Strategy",
      "Choose how to import the data:\n\nMERGE: Keep existing data, update records with matching IDs. Images will be added.\n\nRESTORE: WIPE ALL existing data and replace it with records from this backup.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            void cleanupTempDir(tempExtractDir);
          },
        },
        {
          text: "MERGE",
          onPress: () => performImport(bundle, "merge", tempExtractDir),
        },
        {
          text: "FULL RESTORE",
          style: "default",
          onPress: () => {
            Alert.alert(
              "Confirm Full Restore",
              "THIS WILL DELETE ALL EXISTING DATA AND IMAGES. This action cannot be undone. Are you sure?",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: () => {
                    void cleanupTempDir(tempExtractDir);
                  },
                },
                {
                  text: "YES, WIPE AND RESTORE",
                  style: "default",
                  onPress: () =>
                    performImport(bundle, "restore", tempExtractDir),
                },
              ],
            );
          },
        },
      ],
    );
  };

  const performImport = async (
    data: ImportData,
    strategy: "merge" | "restore",
    tempDir: string,
  ) => {
    try {
      setLoading(true);
      setError(null);
      setStatusMessage(`Importing (${strategy})...`);

      // 1. If restore, clear all existing data and images
      if (strategy === "restore") {
        await storage.clearAllData();
      }

      // 2. Restore images from the temp directory. Every entry path is
      //    resolved and checked against both the extraction root and the
      //    destination images directory (C18 zip-slip defense).
      const extractedImagesDir = `${tempDir}/images/`;
      const imagesExist = await FileSystem.getInfoAsync(extractedImagesDir);

      if (imagesExist.exists) {
        setStatusMessage("Restoring images...");
        const appImagesDir = `${FileSystem.documentDirectory}images/`;

        // Ensure dir exists
        const dirInfo = await FileSystem.getInfoAsync(appImagesDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(appImagesDir, {
            intermediates: true,
          });
          await setNoBackupFlag(appImagesDir);
        }

        const files = await FileSystem.readDirectoryAsync(extractedImagesDir);
        for (const file of files) {
          const from = `${extractedImagesDir}${file}`;
          const to = `${appImagesDir}${file}`;

          if (!isPathInside(extractedImagesDir, from)) {
            console.warn(
              `Skipping archive entry outside the extraction root: ${file}`,
            );
            continue;
          }
          if (!isPathInside(appImagesDir, to)) {
            console.warn(`Skipping archive entry with an unsafe name: ${file}`);
            continue;
          }

          await FileSystem.copyAsync({ from, to });
          await setNoBackupFlag(to);
        }
      }

      // 3. Import MMKV data
      setStatusMessage("Importing database...");
      await storage.importData(data, strategy);

      setStatusMessage("Import successful.");
      Alert.alert(
        "Import Success",
        strategy === "restore"
          ? "Database and images have been fully restored."
          : "Database and images have been updated successfully.",
      );
    } catch (err) {
      const appError = createAppError(err, "Failed to import data.");
      setError(appError.userMessage);
      handleError(err, "DataTransfer.performImport");
      setStatusMessage(null);
    } finally {
      // Cleanup temp directory
      await cleanupTempDir(tempDir);
      setLoading(false);
    }
  };

  if (error) {
    return (
      <View className="flex-1 bg-terminal-bg p-4">
        <ErrorDisplay errorMessage={error} onRetry={() => setError(null)} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-terminal-bg p-4">
      <View className="mb-8">
        <TerminalText className="text-xl mb-4">SECURE DATA EXPORT</TerminalText>
        <TerminalText className="mb-4">
          Export your complete database to a secure ZIP archive. This includes:
        </TerminalText>
        <View className="ml-4 mb-4">
          <TerminalText>• Firearms inventory</TerminalText>
          <TerminalText>• Ammunition stock</TerminalText>
          <TerminalText>• Range visit logs</TerminalText>
          <TerminalText>• All associated images</TerminalText>
        </View>
        <TerminalText className="text-terminal-highlight text-sm italic mb-4">
          * Backups are bundled with images for full portability.
        </TerminalText>

        <TerminalText className="text-terminal-highlight mb-2">
          ENCRYPTION PASSPHRASE (MIN 4 CHARACTERS):
        </TerminalText>
        <TerminalInput
          value={exportPassword}
          onChangeText={setExportPassword}
          placeholder="Enter passphrase"
          label="Export passphrase"
          testID="export-password-input"
          secureTextEntry
        />
        <TerminalText className="text-terminal-highlight mb-2 mt-4">
          CONFIRM PASSPHRASE:
        </TerminalText>
        <TerminalInput
          value={exportPasswordConfirm}
          onChangeText={setExportPasswordConfirm}
          placeholder="Confirm passphrase"
          label="Confirm export passphrase"
          testID="export-password-confirm-input"
          secureTextEntry
        />
        <TerminalText className="text-terminal-green text-sm mt-2 mb-4">
          * The archive is AES-256 encrypted. The passphrase is never stored.
        </TerminalText>

        <TerminalButton
          caption={loading ? "PROCESSING..." : "EXPORT SECURE BACKUP"}
          onPress={handleExport}
          disabled={loading}
          className="w-full"
        />
      </View>

      <View className="border-t border-terminal-dim my-4" />

      {pendingImport && (
        <View className="mb-8 border-2 border-terminal-border p-4">
          <TerminalText className="text-terminal-green text-xl mb-2">
            ARCHIVE IS PASSWORD PROTECTED
          </TerminalText>
          <TerminalText className="mb-4">
            Enter the passphrase used to encrypt this backup:
          </TerminalText>
          <TerminalInput
            value={importPassword}
            onChangeText={setImportPassword}
            placeholder="ENTER ARCHIVE PASSPHRASE"
            label="Archive passphrase"
            testID="import-password-input"
            secureTextEntry
          />
          <View className="flex-row mt-4">
            <TerminalButton
              caption={loading ? "PROCESSING..." : "UNLOCK ARCHIVE"}
              onPress={handleUnlockArchive}
              disabled={loading}
              className="flex-1 mr-2"
            />
            <TerminalButton
              caption="CANCEL"
              onPress={handleCancelPendingImport}
              disabled={loading}
              className="flex-1 ml-2"
            />
          </View>
        </View>
      )}

      <View className="mb-8">
        <TerminalText className="text-xl mb-4">SECURE DATA IMPORT</TerminalText>
        <TerminalText className="mb-4">
          Restore or update your database from a previously exported .ZIP
          archive.
        </TerminalText>
        <TerminalText className="text-terminal-green mb-4">
          CHOOSE STRATEGY: Merge will add new records and images. Full Restore
          will WIPE your current database and images before replacing them.
        </TerminalText>
        <TerminalButton
          caption={loading ? "PROCESSING..." : "IMPORT SECURE BACKUP"}
          onPress={handleImport}
          disabled={loading}
          className="w-full"
        />
      </View>

      {statusMessage && (
        <View className="mt-4 p-4 border border-terminal-highlight">
          <TerminalText className="text-terminal-highlight text-center">
            {statusMessage}
          </TerminalText>
        </View>
      )}
    </ScrollView>
  );
};
