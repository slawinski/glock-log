import { View } from "react-native";
import { TerminalText } from "../terminal-text/TerminalText";

export type StatusVariant = "due" | "due_soon";

type Props = {
  label: string;
  variant: StatusVariant;
};

/**
 * Terminal-styled prominence badge for exceptional maintenance states.
 *
 * "Normal" (OK) state is intentionally never passed here — only DUE and
 * DUE SOON deserve visual prominence on lists and detail screens.
 */
export const StatusBadge = ({ label, variant }: Props) => (
  <View className="self-start">
    <TerminalText
      className={
        variant === "due"
          ? "bg-terminal-green text-terminal-bg px-1"
          : "border border-terminal-border px-1"
      }
      testID={`status-badge-${variant}`}
    >
      {label}
    </TerminalText>
  </View>
);
