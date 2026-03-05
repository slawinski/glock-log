import React, { useState } from "react";
import { View, Alert, ScrollView, Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { zip, unzip } from "react-native-zip-archive";
import { TerminalText, TerminalButton, ErrorDisplay } from "../../components";
import { storage } from "../../services/storage-new";
import { setNoBackupFlag } from "../../services/image-storage";
import { handleError, createAppError } from "../../services/error-handler";

// Helper to remove 'file://' prefix for react-native-zip-archive on some platforms if needed
const cleanPath = (path: string) => {
  if (Platform.OS === 'android' && path.startsWith('file://')) {
    return path.substring(7);
  }
  return path;
};

export const DataTransfer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleExport = async () => {
    let tempDir = "";
    let zipPath = "";
    try {
      setLoading(true);
      setError(null);
      setStatusMessage("Collecting data...");

      // 1. Fetch all data
      const [firearms, ammunition, rangeVisits] = await Promise.all([
        storage.getFirearms(),
        storage.getAmmunition(),
        storage.getRangeVisits(),
      ]);

      const exportData = {
        version: "1.1.0", // Bumped version for image support
        timestamp: new Date().toISOString(),
        data: {
          firearms,
          ammunition,
          rangeVisits,
        },
      };

      // 2. Prepare temporary directory
      tempDir = `${FileSystem.cacheDirectory}triggernote_export_${Date.now()}`;
      await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
      await FileSystem.makeDirectoryAsync(`${tempDir}/images`, { intermediates: true });

      // 3. Write JSON data
      setStatusMessage("Writing database...");
      const jsonData = JSON.stringify(exportData, null, 2);
      await FileSystem.writeAsStringAsync(`${tempDir}/data.json`, jsonData);

      // 4. Copy images
      setStatusMessage("Bundling images...");
      const appImagesDir = `${FileSystem.documentDirectory}images/`;
      
      // Collect all unique image paths referenced in the database
      const imageSet = new Set<string>();
      firearms.forEach(f => f.photos?.forEach(p => !p.startsWith('placeholder:') && imageSet.add(p)));
      rangeVisits.forEach(v => v.photos?.forEach(p => !p.startsWith('placeholder:') && imageSet.add(p)));
      // Ammunition doesn't have photos in current schema but good to be ready
      
      for (const imgPath of imageSet) {
        try {
          // Extract filename from path
          const fileName = imgPath.split('/').pop();
          if (fileName) {
            const destPath = `${tempDir}/images/${fileName}`;
            await FileSystem.copyAsync({ from: imgPath, to: destPath });
          }
        } catch (e) {
          console.warn(`Could not bundle image: ${imgPath}`, e);
        }
      }

      // 5. Create ZIP archive
      setStatusMessage("Creating archive...");
      const zipFileName = `triggernote_backup_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.zip`;
      zipPath = `${FileSystem.cacheDirectory}${zipFileName}`;

      await zip(cleanPath(tempDir), cleanPath(zipPath));

      // 6. Share ZIP
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
      // Cleanup
      try {
        if (tempDir) await FileSystem.deleteAsync(tempDir, { idempotent: true });
        // We don't delete zipPath immediately as Sharing might still need it on some platforms
        // but we can schedule it or just let it sit in cache.
      } catch (e) { /* ignore cleanup errors */ }
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
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
      const tempExtractDir = `${FileSystem.cacheDirectory}triggernote_import_${Date.now()}`;
      await FileSystem.makeDirectoryAsync(tempExtractDir, { intermediates: true });

      // 2. Unzip
      setStatusMessage("Extracting...");
      await unzip(cleanPath(zipUri), cleanPath(tempExtractDir));

      // 3. Read data.json
      const dataJsonPath = `${tempExtractDir}/data.json`;
      const jsonExists = await FileSystem.getInfoAsync(dataJsonPath);
      if (!jsonExists.exists) {
        throw new Error("Invalid backup: data.json missing.");
      }

      const fileContent = await FileSystem.readAsStringAsync(dataJsonPath);
      const parsedData = JSON.parse(fileContent);

      if (!parsedData.version || !parsedData.data) {
        throw new Error("Invalid import file format.");
      }

      setLoading(false);
      setStatusMessage(null);

      // 4. Ask for strategy
      Alert.alert(
        "Import Strategy",
        "Choose how to import the data:\n\nMERGE: Keep existing data, update records with matching IDs. Images will be added.\n\nRESTORE: WIPE ALL existing data and replace it with records from this backup.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "MERGE",
            onPress: () => performImport(parsedData.data, "merge", tempExtractDir),
          },
          {
            text: "FULL RESTORE",
            style: "destructive",
            onPress: () => {
              Alert.alert(
                "Confirm Full Restore",
                "THIS WILL DELETE ALL EXISTING DATA AND IMAGES. This action cannot be undone. Are you sure?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "YES, WIPE AND RESTORE",
                    style: "destructive",
                    onPress: () => performImport(parsedData.data, "restore", tempExtractDir),
                  },
                ]
              );
            },
          },
        ]
      );
    } catch (err) {
      const appError = createAppError(err, "Failed to import data.");
      setError(appError.userMessage);
      handleError(err, "DataTransfer.handleImport");
      setStatusMessage(null);
      setLoading(false);
    }
  };

  const performImport = async (data: any, strategy: "merge" | "restore", tempDir: string) => {
    try {
      setLoading(true);
      setError(null);
      setStatusMessage(`Importing (${strategy})...`);

      // 1. If restore, clear all existing data and images
      if (strategy === "restore") {
        await storage.clearAllData();
      }

      // 2. Restore images from the temp directory
      const extractedImagesDir = `${tempDir}/images/`;
      const imagesExist = await FileSystem.getInfoAsync(extractedImagesDir);
      
      if (imagesExist.exists) {
        setStatusMessage("Restoring images...");
        const appImagesDir = `${FileSystem.documentDirectory}images/`;
        
        // Ensure dir exists
        const dirInfo = await FileSystem.getInfoAsync(appImagesDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(appImagesDir, { intermediates: true });
          await setNoBackupFlag(appImagesDir);
        }

        const files = await FileSystem.readDirectoryAsync(extractedImagesDir);
        for (const file of files) {
          const from = `${extractedImagesDir}${file}`;
          const to = `${appImagesDir}${file}`;
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
          : "Database and images have been updated successfully."
      );
    } catch (err) {
      const appError = createAppError(err, "Failed to import data.");
      setError(appError.userMessage);
      handleError(err, "DataTransfer.performImport");
      setStatusMessage(null);
    } finally {
      // Cleanup temp directory
      try {
        await FileSystem.deleteAsync(tempDir, { idempotent: true });
      } catch (e) { /* ignore */ }
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
        <TerminalButton
          caption={loading ? "PROCESSING..." : "EXPORT SECURE BACKUP"}
          onPress={handleExport}
          disabled={loading}
          className="w-full"
        />
      </View>

      <View className="border-t border-terminal-dim my-4" />

      <View className="mb-8">
        <TerminalText className="text-xl mb-4">SECURE DATA IMPORT</TerminalText>
        <TerminalText className="mb-4">
          Restore or update your database from a previously exported .ZIP archive.
        </TerminalText>
        <TerminalText className="text-terminal-warning mb-4">
          CHOOSE STRATEGY: Merge will add new records and images.
          Full Restore will WIPE your current database and images before replacing them.
        </TerminalText>
        <TerminalButton
          caption={loading ? "PROCESSING..." : "IMPORT SECURE BACKUP"}
          onPress={handleImport}
          disabled={loading}
          className="w-full border-terminal-warning"
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
