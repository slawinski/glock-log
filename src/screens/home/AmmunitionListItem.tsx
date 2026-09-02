import React from "react";
import { View, Pressable } from "react-native";
import { AmmunitionStorage } from "../../validation/storageSchemas";
import { TerminalText } from "../../components";
import { formatCurrency } from "../../utils/currency";

type Props = {
  ammunition: AmmunitionStorage;
  onPress: (ammunitionId: string) => void;
  currency?: string;
};

export const AmmunitionListItem = React.memo(function AmmunitionListItem({
  ammunition,
  onPress,
  currency = "USD",
}: Props) {
  return (
    <Pressable
      onPress={() => onPress(ammunition.id)}
      className="bg-terminal-bg border-2 border-terminal-border p-4 mb-2"
    >
      <View className="flex-row flex-wrap">
        <View className="w-1/2 pr-2">
          <TerminalText className="text-lg" numberOfLines={1}>
            {ammunition.brand} ({ammunition.caliber})
          </TerminalText>
        </View>
        <View className="w-1/2 items-end">
          <TerminalText>{ammunition.quantity} rounds</TerminalText>
        </View>
        <View className="w-1/2 pr-2 mt-1">
          <TerminalText>
            {ammunition.pricePerRound &&
              `${formatCurrency(ammunition.pricePerRound, currency)}/rd`}
          </TerminalText>
        </View>
        <View className="w-1/2 items-end justify-end">
          <TerminalText className="text-lg">{">"}</TerminalText>
        </View>
      </View>
    </Pressable>
  );
});
