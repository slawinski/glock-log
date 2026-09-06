import React, { useCallback, useMemo } from "react";
import { FlatList, ListRenderItemInfo } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { RangeVisitStorage, FirearmStorage } from "../../validation/storageSchemas";
import { EmptyState } from "../../components";
import { VisitListItem } from "./VisitListItem";
import { HomeScreenNavigationProp } from "../../types/navigation";

type Props = {
  rangeVisits: RangeVisitStorage[];
  firearms: FirearmStorage[];
  onRefresh: () => void;
  refreshing: boolean;
};

export const VisitsTab = ({
  rangeVisits,
  firearms,
  onRefresh,
  refreshing,
}: Props) => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const firearmsById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const firearm of firearms) {
      map[firearm.id] = firearm.modelName;
    }
    return map;
  }, [firearms]);

  const handleVisitPress = useCallback(
    (rangeVisitId: string) => {
      navigation.navigate("RangeVisitDetails", { id: rangeVisitId });
    },
    [navigation]
  );

  const renderVisitItem = useCallback(
    ({ item }: ListRenderItemInfo<RangeVisitStorage>) => (
      <VisitListItem
        rangeVisit={item}
        onPress={handleVisitPress}
        firearmsById={firearmsById}
      />
    ),
    [handleVisitPress, firearmsById]
  );

  return (
    <FlatList
      data={rangeVisits}
      renderItem={renderVisitItem}
      keyExtractor={(item) => item.id}
      onRefresh={onRefresh}
      refreshing={refreshing}
      ListEmptyComponent={
        <EmptyState
          title="No range visits yet"
          message="Log a visit to track rounds fired and update ammunition inventory."
          primaryAction={{
            caption: "Log a visit",
            onPress: () => navigation.navigate("AddRangeVisit"),
          }}
        />
      }
    />
  );
};
