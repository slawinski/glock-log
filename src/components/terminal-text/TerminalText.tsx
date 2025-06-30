import React from "react";
import { Text, TextStyle } from "react-native";

interface TerminalTextProps {
  children: React.ReactNode;
  className?: string;
  numberOfLines?: number;
  style?: TextStyle;
}

export const TerminalText: React.FC<TerminalTextProps> = ({
  children,
  className = "",
  numberOfLines,
  style,
}) => (
  <Text
    className={`font-terminal text-lg text-terminal-green ${className}`}
    numberOfLines={numberOfLines}
    style={style}
  >
    {children}
  </Text>
);
