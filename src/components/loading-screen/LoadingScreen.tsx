import React from "react";
import { View, ActivityIndicator } from "react-native";
import { TerminalText } from "../terminal-text/TerminalText";

type Props = {
  className?: string;
  testID?: string;
};

/**
 * Terminal-styled full-screen loading placeholder.
 *
 * Replaces the 8 duplicated `<View>` + `ActivityIndicator` +
 * "LOADING DATABASE..." blocks previously inlined across screens.
 */
export const LoadingScreen = ({ className = "", testID }: Props) => (
  <View
    testID={testID}
    className={`flex-1 justify-center items-center bg-terminal-bg ${className}`}
  >
    <ActivityIndicator size="large" color="#00ff00" />
    <TerminalText className="mt-4">LOADING DATABASE...</TerminalText>
  </View>
);
