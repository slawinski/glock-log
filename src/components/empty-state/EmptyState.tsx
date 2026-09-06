import { View } from "react-native";

import { TerminalButton } from "../terminal-button/TerminalButton";
import { TerminalText } from "../terminal-text/TerminalText";

type Action = {
  caption: string;
  onPress: () => void;
};

type Props = {
  title: string;
  message: string;
  primaryAction?: Action;
  secondaryAction?: Action;
  testID?: string;
};

export const EmptyState = ({
  title,
  message,
  primaryAction,
  secondaryAction,
  testID,
}: Props) => (
  <View className="flex-1 justify-center items-center px-4" testID={testID}>
    <TerminalText className="text-xl mb-2">{title}</TerminalText>
    <TerminalText
      className="text-terminal-muted text-center max-w-[320px] mb-6"
      accessibilityLiveRegion="polite"
    >
      {message}
    </TerminalText>
    {(primaryAction || secondaryAction) && (
      <View className="flex-row flex-wrap justify-center">
        {primaryAction && (
          <TerminalButton
            variant="primary"
            caption={primaryAction.caption}
            onPress={primaryAction.onPress}
            className="mr-2 mb-2"
          />
        )}
        {secondaryAction && (
          <TerminalButton
            caption={secondaryAction.caption}
            onPress={secondaryAction.onPress}
            className="mb-2"
          />
        )}
      </View>
    )}
  </View>
);
