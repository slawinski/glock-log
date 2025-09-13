import React from "react";
import { View, TouchableOpacity } from "react-native";
import { TerminalText } from "../terminal-text/TerminalText";

export interface ChartToggleConfig {
  id: string;
  title: string;
}

type ChartToggleProps = {
  title: string;
  active: boolean;
  onPress: () => void;
};

const ChartToggle = ({
  title,
  active,
  onPress,
}: ChartToggleProps) => (
  <TouchableOpacity onPress={onPress} className="mr-2 mb-2">
    {active ? (
      <TerminalText className="bg-terminal-green text-terminal-bg px-1">
        {title}
      </TerminalText>
    ) : (
      <TerminalText className="text-terminal-green px-1">{title}</TerminalText>
    )}
  </TouchableOpacity>
);

type Props = {
  items: ChartToggleConfig[];
  visibleItems: Set<string>;
  onToggleItem: (id: string) => void;
  onToggleAll: () => void;
  isAllSelected: boolean;
};

export const ChartToggles = ({
  items,
  visibleItems,
  onToggleItem,
  onToggleAll,
  isAllSelected,
}: Props) => (
  <View className="flex-row flex-wrap">
    <ChartToggle title="ALL" active={isAllSelected} onPress={onToggleAll} />
    {items.map((item) => (
      <ChartToggle
        key={item.id}
        title={item.title}
        active={visibleItems.has(item.id)}
        onPress={() => onToggleItem(item.id)}
      />
    ))}
  </View>
);
