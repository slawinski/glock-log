import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TerminalButton } from "../terminal-button/TerminalButton";

type SecondaryAction = {
  caption: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "destructive";
};

type Props = {
  primaryAction?: {
    caption: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryActions?: SecondaryAction[];
  className?: string;
};

export const StickyActionBar = ({
  primaryAction,
  secondaryActions = [],
  className = "",
}: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`flex-row justify-end items-center border-t-2 border-terminal-border bg-terminal-bg px-4 py-3 ${className}`}
      style={{ paddingBottom: insets.bottom }}
    >
      {secondaryActions.map((action, index) => (
        <TerminalButton
          key={index}
          caption={action.caption}
          onPress={action.onPress}
          variant={action.variant ?? "secondary"}
          className="mr-2"
        />
      ))}
      {primaryAction && (
        <TerminalButton
          caption={primaryAction.loading ? "Saving…" : primaryAction.caption}
          onPress={primaryAction.onPress}
          disabled={primaryAction.disabled}
          variant="primary"
        />
      )}
    </View>
  );
};
