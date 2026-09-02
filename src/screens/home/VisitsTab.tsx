import React, { useCallback } from "react";
import { View, FlatList, ListRenderItemInfo } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { RangeVisitStorage } from "../../validation/storageSchemas";
import { TerminalText } from "../../components";
import { VisitListItem } from "./VisitListItem";
import { HomeScreenNavigationProp } from "../../types/navigation";

type Props = {
  rangeVisits: RangeVisitStorage[];
  onRefresh: () => void;
  refreshing: boolean;
};

// Item layout: border-2 (2px top + bottom) + p-4 (16px top + bottom)
// + content 44px (two 20px text lines + 4px mt-1) = 80px,
// plus mb-2 (8px) spacing = 88px stride between items.
const VISIT_ITEM_HEIGHT = 88;

const getVisitItemLayout = (
  _data: ArrayLike<RangeVisitStorage> | null | undefined,
  index: number
) => ({
  length: VISIT_ITEM_HEIGHT,
  offset: VISIT_ITEM_HEIGHT * index,
  index,
});

export const VisitsTab = ({
  rangeVisits,
  onRefresh,
  refreshing,
}: Props) => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleVisitPress = useCallback(
    (rangeVisitId: string) => {
      navigation.navigate("RangeVisitDetails", { id: rangeVisitId });
    },
    [navigation]
  );

  const renderVisitItem = useCallback(
    ({ item }: ListRenderItemInfo<RangeVisitStorage>) => (
      <VisitListItem rangeVisit={item} onPress={handleVisitPress} />
    ),
    [handleVisitPress]
  );

  return (
    <FlatList
      data={rangeVisits}
      renderItem={renderVisitItem}
      keyExtractor={(item) => item.id}
      onRefresh={onRefresh}
      refreshing={refreshing}
      getItemLayout={getVisitItemLayout}
      ListEmptyComponent={
        <View className="flex-1 justify-center items-center mt-8">
          <TerminalText>NO RANGE VISITS FOUND</TerminalText>
        </View>
      }
    />
  );
};
