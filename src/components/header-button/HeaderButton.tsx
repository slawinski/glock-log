import { TouchableOpacity, TouchableOpacityProps } from "react-native";

import { TerminalText } from "../terminal-text/TerminalText";

type Props = {
  caption: string;
} & Omit<TouchableOpacityProps, "children">;

export const HeaderButton = ({ caption, className, ...props }: Props) => {
  return (
    <TouchableOpacity
      className="border-2 border-terminal-border px-3 py-1"
      {...props}
    >
      <TerminalText className={className}>{caption}</TerminalText>
    </TouchableOpacity>
  );
};
