import { View } from "react-native";

import { TerminalText } from "../terminal-text/TerminalText";

type Props = {
  label: string;
  value: string;
  className?: string;
};

export const DetailRow = ({ label, value, className = "" }: Props) => (
  <View
    className={`flex-row justify-between items-center min-h-[40px] py-2 border-b border-terminal-border/30 ${className}`}
  >
    <TerminalText className="text-terminal-muted flex-shrink-0 mr-4">
      {label}
    </TerminalText>
    <TerminalText className="flex-1 flex-shrink text-right">{value}</TerminalText>
  </View>
);
