import { Pressable, PressableProps } from "react-native";

import { TerminalText } from "../terminal-text/TerminalText";

type Props = {
  caption: string;
} & Omit<PressableProps, "children">;

export const HeaderButton = ({
  caption,
  className,
  accessibilityLabel,
  style,
  ...props
}: Props) => {
  return (
    <Pressable
      className="border-2 border-terminal-border px-3 py-1"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? caption}
      style={({ pressed }) => [
        typeof style === "function" ? style({ pressed }) : style,
        pressed && { opacity: 0.2 },
      ]}
      {...props}
    >
      <TerminalText className={className}>{caption}</TerminalText>
    </Pressable>
  );
};
