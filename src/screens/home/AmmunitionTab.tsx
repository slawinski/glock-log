import React, { useCallback, useMemo } from "react";
import { View, FlatList, ListRenderItemInfo } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AmmunitionStorage } from "../../validation/storageSchemas";
import { TerminalText } from "../../components";
import { AmmunitionListItem } from "./AmmunitionListItem";
import { HomeScreenNavigationProp } from "../../types/navigation";

type Props = {
  ammunition: AmmunitionStorage[];
  onRefresh: () => void;
  refreshing: boolean;
  currency?: string;
};

export const AmmunitionTab = ({
  ammunition,
  onRefresh,
  refreshing,
  currency,
}: Props) => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const activeAmmunition = useMemo(
    () => ammunition.filter((item) => item.quantity > 0),
    [ammunition]
  );

  const handleAmmunitionPress = useCallback(
    (ammunitionId: string) => {
      navigation.navigate("AmmunitionDetails", { id: ammunitionId });
    },
    [navigation]
  );

  const renderAmmunitionItem = useCallback(
    ({ item }: ListRenderItemInfo<AmmunitionStorage>) => (
      <AmmunitionListItem
        ammunition={item}
        onPress={handleAmmunitionPress}
        currency={currency}
      />
    ),
    [handleAmmunitionPress, currency]
  );

  // Note: getItemLayout intentionally omitted. Item height varies because the
  // price-per-round row renders an empty Text when pricePerRound is falsy,
  // which collapses that row's height.
  return (
    <FlatList
      data={activeAmmunition}
      renderItem={renderAmmunitionItem}
      keyExtractor={(item) => item.id}
      onRefresh={onRefresh}
      refreshing={refreshing}
      ListEmptyComponent={
        <View className="flex-1 justify-center items-center mt-8">
          <TerminalText>NO AMMUNITION IN STOCK</TerminalText>
        </View>
      }
    />
  );
};
