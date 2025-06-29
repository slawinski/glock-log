import React from "react";
import { Text } from "react-native";

interface TerminalTextProps {
  children: React.ReactNode;
  className?: string;
  numberOfLines?: number;
}

export const TerminalText: React.FC<TerminalTextProps> = ({
  children,
  className = "",
  numberOfLines,
}) => (
  <Text
    className={`text-terminal-text font-terminal text-lg ${className}`}
    numberOfLines={numberOfLines}
  >
    {children}
  </Text>
);
