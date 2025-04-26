import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

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

interface TerminalInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  multiline?: boolean;
  className?: string;
}

export const TerminalInput: React.FC<TerminalInputProps> = ({
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  className = "",
}) => (
  <View className="flex-row items-center">
    <Text className="text-terminal-text font-terminal mr-2">{">"}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#666"
      keyboardType={keyboardType}
      multiline={multiline}
      className={`flex-1 text-terminal-text font-terminal bg-transparent ${className}`}
      style={{ minHeight: multiline ? 100 : undefined }}
    />
  </View>
);
