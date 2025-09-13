import React from "react";
import { View, TouchableOpacity, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import { RangeVisitStorage } from "../../validation/storageSchemas";
import { TerminalText } from "../../components";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

type Props = {
  rangeVisits: RangeVisitStorage[];
  onRefresh: () => void;
  refreshing: boolean;
};

export const VisitsTab = ({
  rangeVisits,
  onRefresh,
  refreshing,
}: Props) => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const renderVisitItem = ({ item }: { item: RangeVisitStorage }) => {
    const totalRounds = Object.values(item.ammunitionUsed || {}).reduce(
      (sum, usage) => sum + usage.rounds,
      0
    );
    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("RangeVisitDetails", { id: item.id })
        }
        className="bg-terminal-bg border border-terminal-border p-4 mb-2"
      >
        <View className="flex-row flex-wrap">
          <View className="w-1/2 pr-2">
            <TerminalText className="text-lg">{item.location}</TerminalText>
          </View>
          <View className="w-1/2 items-end">
            <TerminalText>{totalRounds} rounds</TerminalText>
          </View>
          <View className="w-1/2 pr-2 mt-1">
            <TerminalText>
              {new Date(item.date).toLocaleDateString()}
            </TerminalText>
          </View>
          <View className="w-1/2 items-end justify-end">
            <TerminalText className="text-lg">{">"}</TerminalText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={rangeVisits}
      renderItem={renderVisitItem}
      keyExtractor={(item) => item.id}
      onRefresh={onRefresh}
      refreshing={refreshing}
      ListEmptyComponent={
        <View className="flex-1 justify-center items-center mt-8">
          <TerminalText>NO RANGE VISITS FOUND</TerminalText>
        </View>
      }
    />
  );
};