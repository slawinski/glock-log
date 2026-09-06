import { View, Pressable } from "react-native";
import { AmmunitionStorage } from "../../validation/storageSchemas";
import { TerminalText } from "../../components";
import { formatCurrency } from "../../utils/currency";

type Props = {
  ammunition: AmmunitionStorage;
  onPress: (ammunitionId: string) => void;
  currency?: string;
};

export const AmmunitionListItem = ({
  ammunition,
  onPress,
  currency = "USD",
}: Props) => {
  const isDepleted = ammunition.quantity === 0;

  return (
    <Pressable
      onPress={() => onPress(ammunition.id)}
      className="bg-terminal-bg border-2 border-terminal-border p-4 mb-2"
      style={({ pressed }) => pressed && { opacity: 0.7 }}
      accessibilityRole="button"
      accessibilityLabel={`${ammunition.brand} ${ammunition.caliber}`}
      testID={`ammunition-list-item-${ammunition.id}`}
    >
      <View>
        <TerminalText className="text-lg" numberOfLines={2}>
          {ammunition.brand}
        </TerminalText>
        <TerminalText>
          {ammunition.caliber} • {ammunition.grain}
        </TerminalText>
        {isDepleted ? (
          <TerminalText>0 rounds • Depleted</TerminalText>
        ) : (
          <View className="flex-row flex-wrap">
            <TerminalText>{ammunition.quantity} rounds remaining</TerminalText>
            {ammunition.pricePerRound ? (
              <TerminalText>
                {` • ${formatCurrency(ammunition.pricePerRound, currency)} / round`}
              </TerminalText>
            ) : null}
          </View>
        )}
      </View>
    </Pressable>
  );
};
