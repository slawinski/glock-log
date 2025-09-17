import React from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import { TerminalDirectory, DirectoryItem } from "../../components";

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Settings"
>;

export const Settings = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  const settingsItems: DirectoryItem[] = [
    {
      label: "LANGUAGE: [EN]",
      onPress: () => {
        // TODO: Implement language selection
      },
    },
    {
      label: "CURRENCY: [USD]",
      onPress: () => {
        // TODO: Implement currency selection
      },
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

  return (
    <TerminalDirectory
      title="SETTINGS/"
      items={settingsItems}
    />
  );
};