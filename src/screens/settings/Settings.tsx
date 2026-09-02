import { useState, useCallback } from "react";
import { Alert, View } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as LocalAuthentication from "expo-local-authentication";
import { RootStackParamList } from "../../app/App";
import {
  TerminalDirectory,
  TerminalText,
  ToggleButton,
} from "../../components";
import { storage } from "../../services/storage-new";
import { handleError } from "../../services/error-handler";
import { DirectoryItem } from "../../components/terminal-directory/TerminalDirectory";

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Settings"
>;

export const Settings = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [currentCurrency, setCurrentCurrency] = useState<string>("USD");
  const [biometricLockEnabled, setBiometricLockEnabled] =
    useState<boolean>(true);

  const loadSettings = useCallback(async () => {
    try {
      const settings = await storage.getSettings();
      setCurrentCurrency(settings.currency);
      setBiometricLockEnabled(settings.biometricLockEnabled);
    } catch (error) {
      handleError(error, "Settings.loadSettings", {
        userMessage: "Failed to load settings.",
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const updateBiometricLock = async (enabled: boolean) => {
    try {
      await storage.setBiometricLockEnabled(enabled);
      setBiometricLockEnabled(enabled);
    } catch (error) {
      handleError(error, "Settings.updateBiometricLock", {
        userMessage: "Failed to update biometric lock.",
      });
    }
  };

  const handleToggleBiometricLock = async () => {
    if (biometricLockEnabled) {
      Alert.alert(
        "DISABLE BIOMETRIC LOCK",
        "Warning: your data will be accessible without authentication. Disable the biometric lock?",
        [
          { text: "CANCEL", style: "cancel" },
          {
            text: "DISABLE",
            style: "destructive",
            onPress: () => updateBiometricLock(false),
          },
        ]
      );
      return;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to enable biometric lock",
        cancelLabel: "Cancel",
      });
      if (result.success) {
        await updateBiometricLock(true);
      }
    } catch (error) {
      handleError(error, "Settings.enableBiometricLock", {
        userMessage: "Authentication failed.",
      });
    }
  };

  const settingsItems: DirectoryItem[] = [
    {
      label: "LANGUAGE: [EN]",
      onPress: () => {
        // TODO: Implement language selection
      },
    },
    {
      label: `CURRENCY: [${currentCurrency}]`,
      onPress: () => navigation.navigate("CurrencySelection"),
    },
  ];

  return (
    <View className="flex-1 bg-terminal-bg">
      <TerminalDirectory title="SETTINGS/" items={settingsItems} />
      <View className="flex-row items-center justify-between border-t-2 border-terminal-border px-4 py-3">
        <TerminalText>BIOMETRIC LOCK</TerminalText>
        <ToggleButton
          title={biometricLockEnabled ? "ON" : "OFF"}
          active={biometricLockEnabled}
          onPress={handleToggleBiometricLock}
        />
      </View>
    </View>
  );
};
