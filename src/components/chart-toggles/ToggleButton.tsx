import React from "react";
import { Pressable } from "react-native";
import { TerminalText } from "../terminal-text/TerminalText";

type Props = {
  title: string;
  active: boolean;
  onPress: () => void;
};

export const ToggleButton = ({
  title,
  active,
  onPress,
}: Props) => (
  <Pressable
    onPress={onPress}
    className="mr-2 mb-2"
    accessibilityRole="button"
    accessibilityLabel={title}
    accessibilityState={{ selected: active }}
  >
    {active ? (
      <TerminalText className="bg-terminal-green text-terminal-bg px-1">
        {title}
      </TerminalText>
    ) : (
      <TerminalText className="text-terminal-green px-1">{title}</TerminalText>
    )}
  </Pressable>
);