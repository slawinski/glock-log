import React from "react";
import { Text, TextStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  className?: string;
  numberOfLines?: number;
  style?: TextStyle;
  testID?: string;
};

export const TerminalText = ({
  children,
  className = "",
  numberOfLines,
  style,
  testID,
}: Props) => (
  <Text
    testID={testID}
    className={`font-terminal text-lg text-terminal-green ${className}`}
    numberOfLines={numberOfLines}
    style={style}
  >
    {children}
  </Text>
);
