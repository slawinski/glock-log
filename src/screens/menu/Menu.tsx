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
      <TouchableOpacity
        className="p-4 border-b border-terminal-border"
        onPress={() => navigation.navigate("Stats")}
      >
        <TerminalText>📊 STATISTICS</TerminalText>
      </TouchableOpacity>
      
      <TouchableOpacity
        className="p-4 border-b border-terminal-border"
        onPress={() => {
          // TODO: Navigate to Settings when implemented
        }}
      >
        <TerminalText>⚙️ SETTINGS</TerminalText>
      </TouchableOpacity>
      
      <TouchableOpacity
        className="p-4 border-b border-terminal-border"
        onPress={() => {
          // TODO: Export functionality
        }}
      >
        <TerminalText>📤 EXPORT DATA</TerminalText>
      </TouchableOpacity>
      
      <TouchableOpacity
        className="p-4"
        onPress={() => {
          // TODO: About screen
        }}
      >
        <TerminalText>ℹ️ ABOUT</TerminalText>
      </TouchableOpacity>
    </View>
  );
};