import React from "react";
import { View, Text, TextInput } from "react-native";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  testID?: string;
};

/**
 * Terminal-styled passphrase field for the data-transfer screen.
 *
 * A separate component from TerminalInput because passphrases must be masked
 * (secureTextEntry) and TerminalInput does not support that. Kept local to
 * the data-transfer screen, which is the only consumer.
 */
export const TerminalPasswordInput = ({
  value,
  onChangeText,
  placeholder,
  label,
  testID,
}: Props) => {
  return (
    <View className="flex-row items-center border-2 border-terminal-border p-1 rounded-md">
      <Text className="text-terminal-green font-terminal text-2xl mr-2">
        {">"}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#336633"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        className="flex-1 text-terminal-green font-terminal text-2xl"
        accessibilityLabel={label ?? placeholder}
        testID={testID}
      />
    </View>
  );
};
