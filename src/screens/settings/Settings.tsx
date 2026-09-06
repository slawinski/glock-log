import { useState, useCallback, useEffect } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as LocalAuthentication from "expo-local-authentication";
import { RootStackParamList } from "../../app/App";
import {
  SectionHeading,
  TerminalText,
  ToggleButton,
  useCrtSettings,
} from "../../components";
import { storage } from "../../services/storage-new";
import { handleError } from "../../services/error-handler";

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Settings"
>;

const BIOMETRIC_HELP_TEXT =
  "Require Face ID / Touch ID / passcode when opening TriggerNote.";

const getAuthMethodLabel = (
  types: LocalAuthentication.AuthenticationType[]
): string => {
  if (
    types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
  ) {
    return "Face ID";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return "Touch ID";
  }
  return "Biometrics";
};

export const Settings = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [currentCurrency, setCurrentCurrency] = useState<string>("USD");
  const [biometricLockEnabled, setBiometricLockEnabled] =
    useState<boolean>(true);
  const [authMethodLabel, setAuthMethodLabel] = useState<string>("Biometrics");
  const { crtEnabled, setCrtEnabled } = useCrtSettings();
  const crtEnabledOn = crtEnabled ?? true;

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

  useEffect(() => {
    let mounted = true;
    const loadAuthMethod = async () => {
      try {
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (mounted) {
          setAuthMethodLabel(getAuthMethodLabel(types));
        }
      } catch (error) {
        handleError(error, "Settings.loadAuthMethod", {
          userMessage: "Failed to detect authentication method.",
        });
      }
    };
    loadAuthMethod();
    return () => {
      mounted = false;
    };
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
        "Turn off biometric lock?",
        "TriggerNote will open without biometric authentication.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Turn off",
            style: "default",
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

  return (
    <ScrollView
      className="flex-1 bg-terminal-bg"
      contentContainerStyle={{ flexGrow: 1, padding: 16 }}
    >
      <View className="mb-6">
        <SectionHeading title="SECURITY" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Biometric lock"
          accessibilityHint="Toggles biometric authentication"
          accessibilityState={{ selected: biometricLockEnabled }}
          onPress={handleToggleBiometricLock}
          className="flex-row items-center justify-between border-t-2 border-terminal-border px-4 py-3 min-h-[48px]"
        >
          <View className="flex-1 pr-3">
            <TerminalText>BIOMETRIC LOCK</TerminalText>
            <TerminalText className="text-terminal-muted text-sm">
              {BIOMETRIC_HELP_TEXT}
            </TerminalText>
            <TerminalText className="text-terminal-muted text-sm">
              METHOD: {authMethodLabel}
            </TerminalText>
          </View>
          <ToggleButton
            title={biometricLockEnabled ? "ON" : "OFF"}
            active={biometricLockEnabled}
            onPress={handleToggleBiometricLock}
          />
        </Pressable>
      </View>

      <View className="mb-6">
        <SectionHeading title="APPEARANCE" />
        <View
          testID="crt-effect-row"
          className="flex-row items-center justify-between border-t-2 border-terminal-border px-4 py-3 min-h-[48px]"
        >
          <View className="flex-1 pr-3">
            <TerminalText>CRT EFFECT</TerminalText>
            <TerminalText className="text-terminal-muted text-sm">
              Show or hide the CRT screen effect.
            </TerminalText>
          </View>
          <ToggleButton
            title={crtEnabledOn ? "ON" : "OFF"}
            active={crtEnabledOn}
            onPress={() => setCrtEnabled(!crtEnabledOn)}
          />
        </View>
      </View>

      <View className="mb-6">
        <SectionHeading title="GENERAL" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Currency: ${currentCurrency}`}
          accessibilityHint="Opens currency selection"
          onPress={() => navigation.navigate("CurrencySelection")}
          className="flex-row items-center justify-between border-t-2 border-terminal-border px-4 py-3 min-h-[48px]"
        >
          <View className="flex-1 pr-3">
            <TerminalText>CURRENCY: [{currentCurrency}]</TerminalText>
            <TerminalText className="text-terminal-muted text-sm">
              Select the currency used for prices.
            </TerminalText>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
};
