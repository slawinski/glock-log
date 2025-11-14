import React from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import { TerminalDirectory } from "../../components";
import { DirectoryItem } from "../../components/terminal-directory/TerminalDirectory";

type MenuScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Menu"
>;

export const Menu = () => {
  const navigation = useNavigation<MenuScreenNavigationProp>();

  const menuItems: DirectoryItem[] = [
    {
      label: "STATISTICS",
      onPress: () => navigation.navigate("Stats"),
    },
    {
      label: "SETTINGS",
      onPress: () => navigation.navigate("Settings"),
    },
    {
      label: "EXPORT",
      onPress: () => {
        // TODO: Export functionality
      },
    },
    {
      label: "ABOUT",
      onPress: () => {
        Alert.alert(
          "About",
          "Glock Log is a simple application to track your shooting hobby."
        );
      },
    },
  ];

  return <TerminalDirectory title="SYSTEM/" items={menuItems} />;
};
