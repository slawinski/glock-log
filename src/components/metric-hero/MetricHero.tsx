import { View } from "react-native";

import { TerminalText } from "../terminal-text/TerminalText";

type Props = {
  value: string;
  label: string;
  className?: string;
};

export const MetricHero = ({ value, label, className = "" }: Props) => (
  <View className={className}>
    <TerminalText className="text-4xl">{value}</TerminalText>
    <TerminalText className="text-terminal-muted text-sm">{label}</TerminalText>
  </View>
);
