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
  return (
    <View className={`flex-row justify-between ${className || ""}`}>
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