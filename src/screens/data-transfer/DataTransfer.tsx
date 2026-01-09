import React, { useState } from "react";
import { View, Alert, ScrollView } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { TerminalText, TerminalButton, ErrorDisplay } from "../../components";
import { storage } from "../../services/storage-new";
import { handleError } from "../../services/error-handler";

export const DataTransfer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatusMessage("Exporting data...");

      // 1. Fetch all data
      const [firearms, ammunition, rangeVisits] = await Promise.all([
        storage.getFirearms(),
        storage.getAmmunition(),
        storage.getRangeVisits(),
      ]);

      const exportData = {
        version: "1.0.0", // Schema version
        timestamp: new Date().toISOString(),
        data: {
          firearms,
          ammunition,
          rangeVisits,
        },
      };

      // 2. Prepare file
      const jsonData = JSON.stringify(exportData, null, 2);
      const fileName = `triggernote_export_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      // 3. Write to file
      await FileSystem.writeAsStringAsync(filePath, jsonData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // 4. Share file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: "application/json",
          dialogTitle: "Export Data",
          UTI: "public.json",
        });
        setStatusMessage("Export complete.");
      } else {
        setStatusMessage(`Export saved to: ${filePath}`);
        Alert.alert("Export Success", `File saved to ${filePath}`);
      }
    } catch (err) {
      const appError = handleError(err, "DataTransfer.handleExport");
      setError(appError.userMessage);
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setError(null);
      setStatusMessage(null);

      // 1. Pick File
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      setLoading(true);
      setStatusMessage("Reading file...");

      const asset = result.assets[0];
      const fileUri = asset.uri;

      // 2. Read File
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // 3. Parse JSON
      setStatusMessage("Parsing data...");
      const parsedData = JSON.parse(fileContent);

      if (
        !parsedData.version ||
        !parsedData.data ||
        (!parsedData.data.firearms &&
          !parsedData.data.ammunition &&
          !parsedData.data.rangeVisits)
      ) {
        throw new Error("Invalid import file format.");
      }

      // 4. Import Data
      setStatusMessage("Importing records...");
      await storage.importData(parsedData.data);

      setStatusMessage("Import successful.");
      Alert.alert("Import Success", "Database has been updated successfully.");
    } catch (err) {
      const appError = handleError(err, "DataTransfer.handleImport");
      setError(appError.userMessage);
      setStatusMessage(null);
    } finally {
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
        <TerminalText className="text-xl mb-4">DATA EXPORT</TerminalText>
        <TerminalText className="mb-4">
          Export your complete database to a JSON file. This includes:
        </TerminalText>
        <View className="ml-4 mb-4">
          <TerminalText>• Firearms inventory</TerminalText>
          <TerminalText>• Ammunition stock</TerminalText>
          <TerminalText>• Range visit logs</TerminalText>
        </View>
        <TerminalText className="text-gray-400 text-sm italic mb-4">
          * Images are not included in the JSON export.
        </TerminalText>
        <TerminalButton
          caption={loading ? "PROCESSING..." : "EXPORT DATABASE"}
          onPress={handleExport}
          disabled={loading}
          className="w-full"
        />
      </View>

      <View className="border-t border-terminal-dim my-4" />

      <View className="mb-8">
        <TerminalText className="text-xl mb-4">DATA IMPORT</TerminalText>
        <TerminalText className="mb-4">
          Restore or update your database from a previously exported JSON file.
        </TerminalText>
        <TerminalText className="text-terminal-warning mb-4">
          WARNING: Existing records with the same ID will be overwritten. New
          records will be added.
        </TerminalText>
        <TerminalButton
          caption={loading ? "PROCESSING..." : "IMPORT DATABASE"}
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
