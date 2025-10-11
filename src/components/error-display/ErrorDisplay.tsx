
import React, { FC } from "react";
import { View } from "react-native";
import { TerminalButton } from "../terminal-button/TerminalButton";
import { TerminalText } from "../terminal-text/TerminalText";

type Props = {
  errorMessage: string;
  onRetry?: () => void;
};

export const ErrorDisplay: FC<Props> = ({ errorMessage, onRetry }) => {
  return (
    <View className="flex-1 justify-center items-center">
      <TerminalText className="text-terminal-error text-lg mb-4">
        {errorMessage}
      </TerminalText>
      {onRetry && <TerminalButton onPress={onRetry} caption="Retry" />}
    </View>
  );
};
