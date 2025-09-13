import React from "react";
import { View, TouchableOpacity, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import { AmmunitionStorage } from "../../validation/storageSchemas";
import { TerminalText } from "../../components";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

type Props = {
  ammunition: AmmunitionStorage[];
  onRefresh: () => void;
  refreshing: boolean;
};

export const AmmunitionTab: React.FC<Props> = ({
  ammunition,
  onRefresh,
  refreshing,
}) => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const renderAmmunitionItem = ({ item }: { item: AmmunitionStorage }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("AmmunitionDetails", { id: item.id })}
      className="bg-terminal-bg border border-terminal-border p-4 mb-2"
    >
      <View className="flex-row flex-wrap">
        <View className="w-1/2 pr-2">
          <TerminalText className="text-lg" numberOfLines={1}>
            {item.brand} ({item.caliber})
          </TerminalText>
        </View>
        <View className="w-1/2 items-end">
          <TerminalText>{item.quantity} rounds</TerminalText>
        </View>
        <View className="w-1/2 pr-2 mt-1">
          <TerminalText>
            {item.pricePerRound && `$${item.pricePerRound.toFixed(2)}/rd`}
          </TerminalText>
        </View>
        <View className="w-1/2 items-end justify-end">
          <TerminalText className="text-lg">{">"}</TerminalText>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={ammunition}
      renderItem={renderAmmunitionItem}
      keyExtractor={(item) => item.id}
      onRefresh={onRefresh}
      refreshing={refreshing}
      ListEmptyComponent={
        <View className="flex-1 justify-center items-center mt-8">
          <TerminalText>NO AMMUNITION FOUND</TerminalText>
        </View>
      }
    />
  );
};