import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import { TerminalText } from "../../components";

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Settings"
>;

export const Settings = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  return (
    <View className="flex-1 bg-terminal-bg p-4">
      <TerminalText className="mb-4">SETTINGS/</TerminalText>

      <TouchableOpacity
        className="px-2 py-3"
        onPress={() => {
          // TODO: Implement language selection
        }}
      >
        <TerminalText>├── LANGUAGE: [EN]</TerminalText>
      </TouchableOpacity>

      <TouchableOpacity
        className="px-2 py-3"
        onPress={() => {
          // TODO: Implement currency selection
        }}
      >
        <TerminalText>├── CURRENCY: [USD]</TerminalText>
      </TouchableOpacity>

      <TouchableOpacity
        className="px-2 py-3"
        onPress={() => {
          // TODO: Implement date format selection
        }}
      >
        <TerminalText>├── DATE_FORMAT: [MM/DD/YYYY]</TerminalText>
      </TouchableOpacity>

      <TouchableOpacity
        className="px-2 py-3"
        onPress={() => {
          // TODO: Implement measurement unit selection
        }}
      >
        <TerminalText>├── UNITS: [IMPERIAL]</TerminalText>
      </TouchableOpacity>

      <TouchableOpacity
        className="px-2 py-3"
        onPress={() => {
          // TODO: Implement theme settings
        }}
      >
        <TerminalText>└── THEME: [CLASSIC]</TerminalText>
      </TouchableOpacity>
    </View>
  );
};
