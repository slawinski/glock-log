import React, { FC } from "react";
import { View } from "react-native";
import { TerminalButton } from "../terminal-button/TerminalButton";

export type ButtonConfig = {
  caption: string;
  onPress: () => void;
  disabled?: boolean;
};

type Props = {
  buttons: ButtonConfig[];
  className?: string;
};

export const BottomButtonGroup: FC<Props> = ({ buttons, className }) => {
  // If only one button, align it to the right
  const justifyClass = buttons.length === 1 ? "justify-end" : "justify-between";
  
  return (
    <View className={`flex-row ${justifyClass} p-4 ${className || ""}`}>
      {buttons.map((button, index) => (
        <TerminalButton
          key={index}
          caption={button.caption}
          onPress={button.onPress}
          disabled={button.disabled}
        />
      ))}
    </View>
  );
};