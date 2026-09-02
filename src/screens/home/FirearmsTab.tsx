import React, { useCallback } from "react";
import { View, FlatList, ListRenderItemInfo } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FirearmStorage } from "../../validation/storageSchemas";
import { TerminalText } from "../../components";
import { FirearmListItem } from "./FirearmListItem";
import { HomeScreenNavigationProp } from "../../types/navigation";

type Props = {
  firearms: FirearmStorage[];
  onRefresh: () => void;
  refreshing: boolean;
};

// Item layout: border-2 (2px top + bottom) + p-4 (16px top + bottom)
// + content 60px (FirearmImage container, taller than the two 20px text lines
// + 4px mt-1) = 96px, plus mb-4 (16px) spacing = 112px stride between items.
const FIREARM_ITEM_HEIGHT = 112;

const getFirearmItemLayout = (
  _data: ArrayLike<FirearmStorage> | null | undefined,
  index: number
) => ({
  length: FIREARM_ITEM_HEIGHT,
  offset: FIREARM_ITEM_HEIGHT * index,
  index,
});

export const FirearmsTab = ({
  firearms,
  onRefresh,
  refreshing,
}: Props) => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleFirearmPress = useCallback(
    (firearmId: string) => {
      navigation.navigate("FirearmDetails", { id: firearmId });
    },
    [navigation]
  );

  const renderFirearmItem = useCallback(
    ({ item }: ListRenderItemInfo<FirearmStorage>) => (
      <FirearmListItem firearm={item} onPress={handleFirearmPress} />
    ),
    [handleFirearmPress]
  );

  return (
    <FlatList
      data={firearms}
      renderItem={renderFirearmItem}
      keyExtractor={(item) => item.id}
      onRefresh={onRefresh}
      refreshing={refreshing}
      getItemLayout={getFirearmItemLayout}
      ListEmptyComponent={
        <View className="flex-1 justify-center items-center mt-8">
          <TerminalText>NO FIREARMS FOUND</TerminalText>
        </View>
      }
    />
  );
};
