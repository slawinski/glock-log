import React, { useCallback, useMemo, useState } from "react";
import { View, FlatList, ListRenderItemInfo } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  AccessoryStorage,
  FirearmStorage,
  RangeVisitStorage,
} from "../../validation/storageSchemas";
import { computeAccessoryStats, getCurrentMount } from "../../services/accessory-service";
import { EmptyState, TerminalTabs } from "../../components";
import { AccessoryListItem } from "./AccessoryListItem";
import { HomeScreenNavigationProp } from "../../types/navigation";

type Props = {
  accessories: AccessoryStorage[];
  firearms: FirearmStorage[];
  rangeVisits: RangeVisitStorage[];
  onRefresh: () => void;
  refreshing: boolean;
};

type Filter = "all" | "mounted" | "unmounted";

const FILTERS: { id: Filter; title: string }[] = [
  { id: "all", title: "ALL" },
  { id: "mounted", title: "MOUNTED" },
  { id: "unmounted", title: "UNMOUNTED" },
];

export const AccessoriesTab = ({
  accessories,
  firearms,
  rangeVisits,
  onRefresh,
  refreshing,
}: Props) => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [filter, setFilter] = useState<Filter>("all");

  const firearmById = useMemo(
    () => new Map(firearms.map((f) => [f.id, f])),
    [firearms]
  );

  const rows = useMemo(
    () =>
      accessories.map((accessory) => {
        const stats = computeAccessoryStats(accessory, rangeVisits);
        const mount = getCurrentMount(accessory);
        return {
          accessory,
          totalExposure: stats.totalExposure,
          currentFirearmName: mount
            ? firearmById.get(mount.firearmId)?.modelName ?? mount.firearmNameSnapshot
            : null,
          mounted: !!mount,
        };
      }),
    [accessories, rangeVisits, firearmById]
  );

  const filtered = useMemo(() => {
    if (filter === "mounted") return rows.filter((r) => r.mounted);
    if (filter === "unmounted") return rows.filter((r) => !r.mounted);
    return rows;
  }, [rows, filter]);

  const handlePress = useCallback(
    (id: string) => navigation.navigate("AccessoryDetails", { id }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<(typeof rows)[number]>) => (
      <AccessoryListItem
        accessory={item.accessory}
        totalExposure={item.totalExposure}
        currentFirearmName={item.currentFirearmName}
        onPress={handlePress}
      />
    ),
    [handlePress]
  );

  return (
    <View className="flex-1">
      <TerminalTabs
        variant="secondary"
        tabs={FILTERS}
        activeTab={filter}
        onTabPress={(id) => setFilter(id as Filter)}
        testIDPrefix="accessory-filter-"
      />
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.accessory.id}
        removeClippedSubviews={false}
        contentContainerStyle={{ flexGrow: 1 }}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={
          <EmptyState
            title={
              filter === "mounted"
                ? "NO MOUNTED ACCESSORIES"
                : "NO ACCESSORIES YET"
            }
            message={
              filter === "mounted"
                ? "Your accessories are currently unmounted."
                : "Track optics, lights and other firearm-mounted gear, including round exposure across multiple firearms."
            }
            primaryAction={
              filter === "all" || filter === "unmounted"
                ? {
                    caption: "Add accessory",
                    onPress: () => navigation.navigate("AddAccessory"),
                  }
                : undefined
            }
          />
        }
      />
    </View>
  );
};
