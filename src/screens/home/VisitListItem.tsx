import React from "react";
import { View, Pressable } from "react-native";
import { RangeVisitStorage } from "../../validation/storageSchemas";
import { TerminalText } from "../../components";
import { formatDate } from "../../utils";

type Props = {
  rangeVisit: RangeVisitStorage;
  onPress: (rangeVisitId: string) => void;
};

export const VisitListItem = React.memo(function VisitListItem({
  rangeVisit,
  onPress,
}: Props) {
  const totalRounds = Object.values(rangeVisit.ammunitionUsed || {}).reduce(
    (sum, usage) => sum + usage.rounds,
    0
  );

  return (
    <Pressable
      onPress={() => onPress(rangeVisit.id)}
      className="bg-terminal-bg border-2 border-terminal-border p-4 mb-2"
    >
        <View className="flex-row flex-wrap">
          <View className="w-1/2 pr-2">
            <TerminalText className="text-lg">
              {rangeVisit.location}
            </TerminalText>
          </View>
          <View className="w-1/2 items-end">
            <TerminalText>{totalRounds} rounds</TerminalText>
          </View>
          <View className="w-1/2 pr-2 mt-1">
            <TerminalText>{formatDate(rangeVisit.date)}</TerminalText>
          </View>
          <View className="w-1/2 items-end justify-end">
            <TerminalText className="text-lg">{">"}</TerminalText>
          </View>
        </View>
      </Pressable>
  );
});
