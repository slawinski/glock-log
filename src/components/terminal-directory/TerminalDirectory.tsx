import React, { FC } from "react";
import { View, Pressable } from "react-native";
import { TerminalText } from "../terminal-text/TerminalText";

export type DirectoryItem = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

type Props = {
  title: string;
  items: DirectoryItem[];
  className?: string;
};

export const TerminalDirectory: FC<Props> = ({ title, items, className }) => {
  return (
    <View className={`flex-1 bg-terminal-bg p-4 ${className || ""}`}>
      <TerminalText className="mb-4">{title}</TerminalText>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const prefix = isLast ? "└──" : "├──";

        return (
          <Pressable
            key={index}
            className="px-2 py-3"
            onPress={item.onPress}
            disabled={item.disabled}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ disabled: !!item.disabled }}
          >
            <TerminalText className={item.disabled ? "opacity-50" : ""}>
              {prefix} {item.label}
            </TerminalText>
          </Pressable>
        );
      })}
    </View>
  );
};
