import React from "react";
import { View, Text, TextInput } from "react-native";

interface TerminalInputProps {
  value: string | number;
  // eslint-disable-next-line
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  multiline?: boolean;
  className?: string;
  testID?: string;
}

export const TerminalInput: React.FC<TerminalInputProps> = ({
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  className = "",
  testID,
}) => (
  <View className="flex-row items-center">
    <Text className="text-terminal-text font-terminal mr-2">{">"}</Text>
    <TextInput
      value={value.toString()}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#666"
      keyboardType={keyboardType}
      multiline={multiline}
      className={`flex-1 text-terminal-text font-terminal bg-transparent ${className}`}
      style={{ minHeight: multiline ? 100 : undefined }}
      testID={testID}
    />
  </View>
);
