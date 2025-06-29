import { FC } from "react";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";

import { TerminalText } from "../terminal-text/TerminalText";

type Props = {
  caption: string;
} & Omit<TouchableOpacityProps, "children">;

export const HeaderButton: FC<Props> = ({ caption, className, ...props }) => {
  return (
    <TouchableOpacity
      className="border border-terminal-border px-3 py-1"
      {...props}
    >
      <TerminalText className={className}>{caption}</TerminalText>
    </TouchableOpacity>
  );
};
