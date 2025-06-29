import React from "react";
import { View, Text, TextInput } from "react-native";

interface TerminalInputProps {
  value: string | number | null | undefined;
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
}) => {
  const displayValue =
    value === null || value === undefined ? "" : value.toString();

  return (
    <View
      className={`flex-row ${
        multiline ? "items-start" : "items-center"
      } border-2 p-1 rounded-md border-transparent`}
    >
      <Text
        className="text-terminal-text font-terminal mr-2"
        style={{ fontSize: 18, lineHeight: 20 }}
      >
        {">"}
      </Text>
      <TextInput
        value={displayValue}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#666"
        keyboardType={keyboardType}
        multiline={multiline}
        className={`flex-1 text-terminal-text font-terminal bg-transparent ${className}`}
        style={{
          minHeight: multiline ? 100 : undefined,
          paddingVertical: 0,
          textAlignVertical: multiline ? "top" : "center",
          fontSize: 18,
          lineHeight: 20,
        }}
        testID={testID}
      />
    </View>
  );
};
