import React, { useCallback, useMemo, useState } from "react";
import { View, FlatList, ListRenderItemInfo } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AmmunitionStorage } from "../../validation/storageSchemas";
import { EmptyState, TerminalTabs } from "../../components";
import { AmmunitionListItem } from "./AmmunitionListItem";
import { HomeScreenNavigationProp } from "../../types/navigation";

type Props = {
  ammunition: AmmunitionStorage[];
  onRefresh: () => void;
  refreshing: boolean;
  currency?: string;
};

type AmmoFilter = "in-stock" | "depleted" | "all";

const FILTER_OPTIONS: { id: AmmoFilter; title: string }[] = [
  { id: "in-stock", title: "In stock" },
  { id: "depleted", title: "Depleted" },
  { id: "all", title: "All" },
];

export const AmmunitionTab = ({
  ammunition,
  onRefresh,
  refreshing,
  currency,
}: Props) => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [filter, setFilter] = useState<AmmoFilter>("in-stock");

  const filteredAmmunition = useMemo(() => {
    if (filter === "depleted") {
      return ammunition.filter((item) => item.quantity === 0);
    }
    if (filter === "all") {
      return ammunition;
    }
    return ammunition.filter((item) => item.quantity > 0);
  }, [ammunition, filter]);

  const depletedCount = useMemo(
    () => ammunition.filter((item) => item.quantity === 0).length,
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

  const renderEmptyState = useCallback(() => {
    if (filter === "depleted") {
      return (
        <EmptyState
          title="No depleted ammunition"
          message="None of your ammunition records currently have zero stock."
          secondaryAction={{
            caption: "Show all ammunition",
            onPress: () => setFilter("all"),
          }}
        />
      );
    }
    if (depletedCount > 0) {
      return (
        <EmptyState
          title="No ammunition in stock"
          message={`${depletedCount} ammunition records are depleted.`}
          primaryAction={{
            caption: "Add ammunition",
            onPress: () => navigation.navigate("AddAmmunition"),
          }}
          secondaryAction={{
            caption: "View depleted",
            onPress: () => setFilter("depleted"),
          }}
        />
      );
    }
    return (
      <EmptyState
        title="No ammunition in stock"
        message="Add ammunition to track purchases and automatically deduct rounds after visits."
        primaryAction={{
          caption: "Add ammunition",
          onPress: () => navigation.navigate("AddAmmunition"),
        }}
      />
    );
  }, [filter, navigation, depletedCount]);

  return (
    <View className="flex-1">
      <TerminalTabs
        variant="secondary"
        tabs={FILTER_OPTIONS}
        activeTab={filter}
        onTabPress={(id) => setFilter(id as AmmoFilter)}
        testIDPrefix="ammo-filter-"
      />
      <FlatList
        data={filteredAmmunition}
        renderItem={renderAmmunitionItem}
        keyExtractor={(item) => item.id}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={renderEmptyState()}
      />
    </View>
  );
};
