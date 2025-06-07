import React from "react";
import { Text } from "react-native";

interface TerminalTextProps {
  children: React.ReactNode;
  className?: string;
}

export const TerminalText: React.FC<TerminalTextProps> = ({
  children,
  className = "",
}) => (
  <Text className={`text-terminal-text font-terminal ${className}`}>
    {children}
  </Text>
);
