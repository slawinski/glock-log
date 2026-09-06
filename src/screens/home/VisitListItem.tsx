import { View, Pressable } from "react-native";
import { RangeVisitStorage } from "../../validation/storageSchemas";
import { TerminalText } from "../../components";
import { formatDate } from "../../utils";

type Props = {
  rangeVisit: RangeVisitStorage;
  onPress: (rangeVisitId: string) => void;
  firearmsById?: Record<string, string>;
};

export const VisitListItem = ({
  rangeVisit,
  onPress,
  firearmsById,
}: Props) => {
  const location = rangeVisit.location?.trim();
  const firearmsUsed = rangeVisit.firearmsUsed ?? [];

  const totalRounds = Object.values(rangeVisit.ammunitionUsed || {}).reduce(
    (sum, usage) => sum + (usage.rounds || 0),
    0
  );

  const firearmSummary =
    firearmsUsed.length === 1
      ? firearmsById?.[firearmsUsed[0]] ?? "1 firearm"
      : `${firearmsUsed.length} firearms`;

  return (
    <Pressable
      onPress={() => onPress(rangeVisit.id)}
      className="bg-terminal-bg border-2 border-terminal-border p-4 mb-2"
      style={({ pressed }) => pressed && { opacity: 0.7 }}
      accessibilityRole="button"
      accessibilityLabel={location || "Untitled visit"}
      testID={`visit-list-item-${rangeVisit.id}`}
    >
      <View>
        <TerminalText className="text-lg" numberOfLines={2}>
          {location || "Untitled visit"}
        </TerminalText>
        <TerminalText>{formatDate(rangeVisit.date)}</TerminalText>
        <TerminalText>
          {totalRounds} rounds • {firearmSummary}
        </TerminalText>
      </View>
    </Pressable>
  );
};
