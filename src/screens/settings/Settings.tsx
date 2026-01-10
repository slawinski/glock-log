import React, { useState, useEffect } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import { TerminalDirectory } from "../../components";
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

  const loadCurrency = async () => {
    try {
      const currency = await storage.getCurrency();
      setCurrentCurrency(currency);
    } catch (error) {
      handleError(error, "Settings.loadCurrency", {
        userMessage: "Failed to load currency.",
      });
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
  ];

  return <TerminalDirectory title="SETTINGS/" items={settingsItems} />;
};
