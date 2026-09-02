import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from "react-native";
import { COLORS } from "../../theme";

type Props = {
  value: string | number | null | undefined;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  multiline?: boolean;
  className?: string;
  testID?: string;
  label?: string;
  disabled?: boolean;
  error?: string;
  ref?: React.Ref<TextInput>;
};

export const TerminalInput = ({
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  className = "",
  testID,
  label,
  disabled = false,
  error,
  ref,
}: Props) => {
  const displayValue =
    value === null || value === undefined ? "" : value.toString();
  const [isFocused, setIsFocused] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(displayValue.length);
  const textInputRef = useRef<TextInput>(null);

  // Merge the forwarded ref (React 19 ref-as-prop) with the internal ref so
  // both callers and the focus handler can reach the native TextInput.
  const setTextInputRef = useCallback(
    (node: TextInput | null) => {
      textInputRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

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
      <Text className="text-terminal-green font-terminal mr-2 text-[24px] leading-[28px]">
        {">"}
      </Text>
      <Pressable
        className="flex-1"
        accessible={false}
        onPress={() => textInputRef.current?.focus()}
      >
        <View
          className="flex-row items-baseline min-h-[28px]"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          {/* Show placeholder when no value and not focused */}
          {!displayValue && !isFocused && placeholder && (
            <Text
              className="font-terminal text-[24px] leading-[28px]"
              style={{ color: COLORS.PLACEHOLDER }}
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
                  className={`text-terminal-green font-terminal text-[24px] leading-[28px] ${className}`}
                >
                  {displayValue.slice(0, cursorPosition)}
                </Text>
              )}

              {/* Character at cursor position - highlighted when focused */}
              {cursorPosition < displayValue.length ? (
                <Text
                  className="text-terminal-green font-terminal text-[24px] leading-[28px]"
                  style={{
                    backgroundColor:
                      isFocused && showCursor
                        ? COLORS.TERMINAL_GREEN
                        : COLORS.TRANSPARENT,
                    color:
                      isFocused && showCursor
                        ? COLORS.TERMINAL_BG
                        : COLORS.TERMINAL_GREEN,
                  }}
                >
                  {displayValue.charAt(cursorPosition)}
                </Text>
              ) : (
                /* Show cursor at end of text when no character to highlight */
                isFocused && (
                  <Text
                    className={`text-terminal-green font-terminal text-[24px] leading-[28px] ${
                      showCursor ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    ▋
                  </Text>
                )
              )}

              {/* Text after cursor */}
              {cursorPosition < displayValue.length - 1 && (
                <Text
                  className={`text-terminal-green font-terminal text-[24px] leading-[28px] ${className}`}
                >
                  {displayValue.slice(cursorPosition + 1)}
                </Text>
              )}
            </View>
          ) : null}
        </View>

        <TextInput
          ref={setTextInputRef}
          value={displayValue}
          onChangeText={onChangeText}
          onSelectionChange={handleSelectionChange}
          placeholder=""
          keyboardType={keyboardType}
          multiline={multiline}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          caretHidden
          accessibilityLabel={label ?? placeholder}
          accessibilityState={{ disabled }}
          accessibilityHint={error}
          className="absolute top-0 left-0 right-0 bottom-0 m-0 p-0 text-[24px] leading-[28px]"
          style={{
            color: COLORS.TRANSPARENT, // Make text invisible
            backgroundColor: COLORS.TRANSPARENT,
            textAlignVertical: multiline ? "top" : "center",
            fontFamily: "VT323_400Regular", // Match the terminal font
          }}
          testID={testID}
        />
      </Pressable>
    </View>
  );
};
