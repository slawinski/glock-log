import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import { TerminalText } from "../../components";

type MenuScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Menu"
>;

export const Menu = () => {
  const navigation = useNavigation<MenuScreenNavigationProp>();

  return (
    <View className="flex-1 bg-terminal-bg p-4">
      <TerminalText className="mb-4">SYSTEM/</TerminalText>

      <TouchableOpacity
        className="px-2 py-1"
        onPress={() => navigation.navigate("Stats")}
      >
        <TerminalText>├── STATISTICS</TerminalText>
      </TouchableOpacity>

      <TouchableOpacity
        className="px-2 py-1"
        onPress={() => {
          // TODO: Navigate to Settings when implemented
        }}
      >
        <TerminalText>├── SETTINGS</TerminalText>
      </TouchableOpacity>

      <TouchableOpacity
        className="px-2 py-1"
        onPress={() => {
          // TODO: Export functionality
        }}
      >
        <TerminalText>├── EXPORT</TerminalText>
      </TouchableOpacity>

      <TouchableOpacity
        className="px-2 py-1"
        onPress={() => {
          // TODO: About screen
        }}
      >
        <TerminalText>└── ABOUT</TerminalText>
      </TouchableOpacity>
    </View>
  );
};
