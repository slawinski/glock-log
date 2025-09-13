import { TouchableOpacity, TouchableOpacityProps } from "react-native";

import { TerminalText } from "../terminal-text/TerminalText";

type Props = {
  caption: string;
} & Omit<TouchableOpacityProps, "children">;

export const TerminalButton = ({ caption, className, ...props }: Props) => {
  return (
    <TouchableOpacity
      className={`border border-terminal-border px-4 py-2 ${className || ""}`}
      {...props}
    >
      <TerminalText>{caption}</TerminalText>
    </TouchableOpacity>
  );
};
