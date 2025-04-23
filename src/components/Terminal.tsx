import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface TerminalProps {
  children: React.ReactNode;
  title?: string;
}

export const Terminal: React.FC<TerminalProps> = ({ children, title }) => {
  return (
    <View className="bg-terminal-bg border-2 border-terminal-border p-4 rounded-lg shadow-terminal">
      {/* Terminal header */}
      {title && (
        <View className="border-b border-terminal-border pb-2 mb-4">
          <Text className="text-terminal-text font-terminal text-lg">
            {title}
          </Text>
        </View>
      )}

      {/* Terminal content */}
      <View className="relative">{children}</View>
    </View>
  );
};

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

export const TerminalInput: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <View className="flex-row items-center">
    <Text className="text-terminal-text font-terminal mr-2">{">"}</Text>
    <Text className="text-terminal-text font-terminal">{children}</Text>
  </View>
);
