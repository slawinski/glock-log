import React from "react";
import { View, TouchableOpacity } from "react-native";
import { TerminalText } from "../terminal-text/TerminalText";

export interface ChartToggleConfig {
  id: string;
  title: string;
}

interface ChartToggleProps {
  title: string;
  active: boolean;
  onPress: () => void;
}

const ChartToggle: React.FC<ChartToggleProps> = ({
  title,
  active,
  onPress,
}) => (
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

interface ChartTogglesProps {
  items: ChartToggleConfig[];
  visibleItems: Set<string>;
  onToggleItem: (id: string) => void;
  onToggleAll: () => void;
  isAllSelected: boolean;
}

export const ChartToggles: React.FC<ChartTogglesProps> = ({
  items,
  visibleItems,
  onToggleItem,
  onToggleAll,
  isAllSelected,
}) => (
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
