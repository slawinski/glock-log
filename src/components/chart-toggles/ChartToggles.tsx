import React from "react";
import { View } from "react-native";
import { ToggleButton } from "./ToggleButton";

export interface ChartToggleConfig {
  id: string;
  title: string;
}

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
    <ToggleButton title="ALL" active={isAllSelected} onPress={onToggleAll} />
    {items.map((item) => (
      <ToggleButton
        key={item.id}
        title={item.title}
        active={visibleItems.has(item.id)}
        onPress={() => onToggleItem(item.id)}
      />
    ))}
  </View>
);
