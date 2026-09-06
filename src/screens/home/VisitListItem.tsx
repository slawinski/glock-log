import React from "react";
import { View, Pressable } from "react-native";
import { RangeVisitStorage } from "../../validation/storageSchemas";
import { TerminalText } from "../../components";
import { formatDate } from "../../utils";

type Props = {
  rangeVisit: RangeVisitStorage;
  onPress: (rangeVisitId: string) => void;
  firearmsById?: Record<string, string>;
};

export const VisitListItem = React.memo(function VisitListItem({
  rangeVisit,
  onPress,
  firearmsById,
}: Props) {
  const totalRounds = Object.values(rangeVisit.ammunitionUsed || {}).reduce(
    (sum, usage) => sum + usage.rounds,
    0
  );

  const firearmSummary =
    rangeVisit.firearmsUsed.length === 1
      ? firearmsById?.[rangeVisit.firearmsUsed[0]] ?? "1 firearm"
      : `${rangeVisit.firearmsUsed.length} firearms`;

  return (
    <Pressable
      onPress={() => onPress(rangeVisit.id)}
      className="bg-terminal-bg border-2 border-terminal-border p-4 mb-2"
      style={({ pressed }) => pressed && { opacity: 0.7 }}
      accessibilityRole="button"
      accessibilityLabel={rangeVisit.location}
      testID={`visit-list-item-${rangeVisit.id}`}
    >
      <View className="flex-1">
        <TerminalText className="text-lg" numberOfLines={2}>
          {rangeVisit.location}
        </TerminalText>
        <TerminalText>{formatDate(rangeVisit.date)}</TerminalText>
        <TerminalText>
          {totalRounds} rounds • {firearmSummary}
        </TerminalText>
      </View>
    </Pressable>
  );
});
