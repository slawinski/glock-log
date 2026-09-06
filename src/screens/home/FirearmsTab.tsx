import React, { useCallback } from "react";
import { FlatList, ListRenderItemInfo } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FirearmStorage } from "../../validation/storageSchemas";
import { EmptyState } from "../../components";
import { FirearmListItem } from "./FirearmListItem";
import { HomeScreenNavigationProp } from "../../types/navigation";

type Props = {
  firearms: FirearmStorage[];
  onRefresh: () => void;
  refreshing: boolean;
};

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
      ListEmptyComponent={
        <EmptyState
          title="No firearms yet"
          message="Add your first firearm to start tracking round counts, range visits and history."
          primaryAction={{
            caption: "Add firearm",
            onPress: () => navigation.navigate("AddFirearm"),
          }}
        />
      }
    />
  );
};
