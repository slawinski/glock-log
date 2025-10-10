import React, { useState, useEffect } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import { TerminalDirectory } from "../../components";
import { storage } from "../../services/storage-new";
import { DirectoryItem } from "../../components/terminal-directory/TerminalDirectory";

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Settings"
>;

export const Settings = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [currentCurrency, setCurrentCurrency] = useState<string>("USD");

  const loadCurrency = async () => {
    try {
      const currency = await storage.getCurrency();
      setCurrentCurrency(currency);
    } catch (error) {
      console.error("Error loading currency:", error);
    }
  };

  useEffect(() => {
    loadCurrency();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadCurrency();
    }, [])
  );

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
    {
      label: "DATE_FORMAT: [MM/DD/YYYY]",
      onPress: () => {
        // TODO: Implement date format selection
      },
    },
    {
      label: "UNITS: [IMPERIAL]",
      onPress: () => {
        // TODO: Implement measurement unit selection
      },
    },
    {
      label: "BACKUP: [DISABLED]",
      onPress: () => {
        // TODO: Implement backup settings
      },
    },
    {
      label: "THEME: [CLASSIC]",
      onPress: () => {
        // TODO: Implement theme settings
      },
    },
  ];

  return <TerminalDirectory title="SETTINGS/" items={settingsItems} />;
};
