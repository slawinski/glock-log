import { Pressable, PressableProps } from "react-native";

import { TerminalText } from "../terminal-text/TerminalText";

type Props = {
  caption: string;
} & Omit<PressableProps, "children">;

export const TerminalButton = ({
  caption,
  className,
  accessibilityLabel,
  style,
  ...props
}: Props) => {
  return (
    <Pressable
      testID="terminal-button"
      className={`border-2 border-terminal-border px-4 py-2 ${className || ""}`}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? caption}
      style={({ pressed }) => [
        typeof style === "function" ? style({ pressed }) : style,
        pressed && { opacity: 0.2 },
      ]}
      {...props}
    >
      <TerminalText>{caption}</TerminalText>
    </Pressable>
  );
};
