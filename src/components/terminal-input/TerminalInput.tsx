import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { COLORS } from "../../services/constants";

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
  const [isFocused, setIsFocused] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    let cursorInterval: ReturnType<typeof setInterval>;
    if (isFocused) {
      cursorInterval = setInterval(() => {
        setShowCursor((prev) => !prev);
      }, 500); // Blinking interval
    } else {
      setShowCursor(false);
    }

    return () => {
      if (cursorInterval) {
        clearInterval(cursorInterval);
      }
    };
  }, [isFocused]);

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
      <Pressable
        className="flex-1 flex-row items-baseline"
        onPress={() => textInputRef.current?.focus()}
      >
        <View className="flex-row items-baseline">
          {displayValue ? (
            <Text
              className={`text-terminal-text font-terminal ${className}`}
              style={{ fontSize: 18, lineHeight: 20 }}
            >
              {displayValue}
            </Text>
          ) : !isFocused ? (
            <Text
              className="font-terminal"
              style={{
                color: COLORS.PLACEHOLDER,
                fontSize: 18,
                lineHeight: 20,
              }}
            >
              {placeholder}
            </Text>
          ) : null}
          {isFocused && (
            <Text
              className="text-terminal-text font-terminal"
              style={{
                fontSize: 18,
                lineHeight: 20,
                transform: [{ translateY: 2 }],
                opacity: showCursor ? 1 : 0,
              }}
            >
              _
            </Text>
          )}
        </View>

        <TextInput
          ref={textInputRef}
          value={displayValue}
          onChangeText={onChangeText}
          placeholder=""
          keyboardType={keyboardType}
          multiline={multiline}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          caretHidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            color: COLORS.TRANSPARENT,
            fontSize: 18,
            lineHeight: 20,
            paddingVertical: 0,
            textAlignVertical: multiline ? "top" : "center",
          }}
          testID={testID}
        />
      </Pressable>
    </View>
  );
};
