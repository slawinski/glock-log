import { Pressable, PressableProps } from "react-native";

import { TerminalText } from "../terminal-text/TerminalText";

export type TerminalButtonVariant = "primary" | "secondary" | "destructive";

type Props = {
  caption: string;
  variant?: TerminalButtonVariant;
} & Omit<PressableProps, "children">;

const containerClass: Record<TerminalButtonVariant, string> = {
  primary: "bg-terminal-green",
  secondary: "border-2 border-terminal-border",
  destructive: "border-2 border-dashed border-terminal-green",
};

const captionClass: Record<TerminalButtonVariant, string> = {
  primary: "text-terminal-bg",
  secondary: "text-terminal-green",
  destructive: "text-terminal-green",
};

export const TerminalButton = ({
  caption,
  variant = "secondary",
  className,
  accessibilityLabel,
  style,
  disabled,
  ...props
}: Props) => {
  return (
    <Pressable
      testID="terminal-button"
      className={`min-h-[48px] justify-center px-4 py-2 ${containerClass[variant]} ${
        className || ""
      }`}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? caption}
      disabled={disabled}
      style={({ pressed }) => [
        typeof style === "function" ? style({ pressed }) : style,
        pressed && !disabled && { opacity: 0.2 },
        disabled && { opacity: 0.4 },
      ]}
      {...props}
    >
      <TerminalText className={captionClass[variant]}>{caption}</TerminalText>
    </Pressable>
  );
};
