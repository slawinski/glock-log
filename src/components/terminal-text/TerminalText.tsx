import React from "react";
import { Text, TextStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  className?: string;
  numberOfLines?: number;
  style?: TextStyle;
};

export const TerminalText = ({
  children,
  className = "",
  numberOfLines,
  style,
}: Props) => (
  <Text
    className={`font-terminal text-lg text-terminal-green ${className}`}
    numberOfLines={numberOfLines}
    style={style}
  >
    {children}
  </Text>
);
