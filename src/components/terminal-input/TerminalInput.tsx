import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from "react-native";
import { COLORS } from "../../services/constants";

type Props = {
  value: string | number | null | undefined;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  multiline?: boolean;
  className?: string;
  testID?: string;
};

export const TerminalInput = ({
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  className = "",
  testID,
}: Props) => {
  const displayValue =
    value === null || value === undefined ? "" : value.toString();
  const [isFocused, setIsFocused] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(displayValue.length);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    let cursorInterval: ReturnType<typeof setInterval>;
    if (isFocused) {
      // Start with cursor visible
      setShowCursor(true);
      cursorInterval = setInterval(() => {
        setShowCursor((prev) => !prev);
      }, 530); // Slightly slower blinking for better UX
    } else {
      setShowCursor(false);
    }

    return () => {
      if (cursorInterval) {
        clearInterval(cursorInterval);
      }
    };
  }, [isFocused]);

  // Reset cursor to start when value becomes empty
  useEffect(() => {
    if (displayValue.length === 0) {
      setCursorPosition(0);
    }
  }, [displayValue.length]);

  const handleSelectionChange = (
    event: NativeSyntheticEvent<TextInputSelectionChangeEventData>
  ) => {
    const { start } = event.nativeEvent.selection;
    setCursorPosition(start);
    // Make cursor immediately visible when position changes
    if (isFocused) {
      setShowCursor(true);
    }
  };

  return (
    <View
      className={`flex-row ${
        multiline ? "items-start" : "items-center"
      } border-2 p-1 rounded-md border-transparent`}
    >
      <Text
        className="text-terminal-green font-terminal mr-2"
        style={{ fontSize: 24, lineHeight: 28 }}
      >
        {">"}
      </Text>
      <Pressable
        className="flex-1"
        onPress={() => textInputRef.current?.focus()}
      >
        <View className="flex-row items-baseline min-h-[28px]">
          {/* Show placeholder when no value and not focused */}
          {!displayValue && !isFocused && placeholder && (
            <Text
              className="font-terminal"
              style={{
                color: COLORS.PLACEHOLDER,
                fontSize: 24,
                lineHeight: 28,
              }}
            >
              {placeholder}
            </Text>
          )}

          {/* Show text content with cursor positioned correctly */}
          {isFocused || displayValue ? (
            <View className="flex-row items-baseline">
              {/* Text before cursor */}
              {cursorPosition > 0 && (
                <Text
                  className={`text-terminal-green font-terminal ${className}`}
                  style={{ fontSize: 24, lineHeight: 28 }}
                >
                  {displayValue.slice(0, cursorPosition)}
                </Text>
              )}

              {/* Character at cursor position - highlighted when focused */}
              {cursorPosition < displayValue.length ? (
                <Text
                  className="text-terminal-green font-terminal"
                  style={
                    {
                      fontSize: 24,
                      lineHeight: 28,
                      backgroundColor:
                        isFocused && showCursor ? "#00ff00" : "transparent",
                      color: isFocused && showCursor ? "#0a0a0a" : "#00ff00",
                    } as any
                  }
                >
                  {displayValue.charAt(cursorPosition)}
                </Text>
              ) : (
                /* Show cursor at end of text when no character to highlight */
                isFocused && (
                  <Text
                    className="text-terminal-green font-terminal"
                    style={{
                      fontSize: 24,
                      lineHeight: 28,
                      opacity: showCursor ? 1 : 0,
                    }}
                  >
                    ▋
                  </Text>
                )
              )}

              {/* Text after cursor */}
              {cursorPosition < displayValue.length - 1 && (
                <Text
                  className={`text-terminal-green font-terminal ${className}`}
                  style={{ fontSize: 24, lineHeight: 28 }}
                >
                  {displayValue.slice(cursorPosition + 1)}
                </Text>
              )}
            </View>
          ) : null}
        </View>

        <TextInput
          ref={textInputRef}
          value={displayValue}
          onChangeText={onChangeText}
          onSelectionChange={handleSelectionChange}
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
            color: COLORS.TRANSPARENT, // Make text invisible
            backgroundColor: COLORS.TRANSPARENT,
            fontSize: 24,
            lineHeight: 28,
            paddingVertical: 0,
            paddingHorizontal: 0,
            margin: 0,
            textAlignVertical: multiline ? "top" : "center",
            fontFamily: "VT323_400Regular", // Match the terminal font
          }}
          testID={testID}
        />
      </Pressable>
    </View>
  );
};
