import React, { useCallback, useMemo, useState } from "react";
import { View, FlatList, ListRenderItemInfo } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FirearmStorage } from "../../validation/storageSchemas";
import { AttentionLevel } from "../../services/maintenance-attention";
import { EmptyState, TerminalTabs } from "../../components";
import { FirearmListItem } from "./FirearmListItem";
import { HomeScreenNavigationProp } from "../../types/navigation";

type Props = {
  firearms: FirearmStorage[];
  attention?: Record<string, AttentionLevel>;
  onRefresh: () => void;
  refreshing: boolean;
};

type FirearmFilter = "mine" | "borrowed" | "all";

const FILTER_OPTIONS: { id: FirearmFilter; title: string }[] = [
  { id: "mine", title: "Mine" },
  { id: "borrowed", title: "Borrowed" },
  { id: "all", title: "All" },
];

export const FirearmsTab = ({
  firearms,
  attention = {},
  onRefresh,
  refreshing,
}: Props) => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [filter, setFilter] = useState<FirearmFilter>("mine");

  const borrowedCount = useMemo(
    () => firearms.filter((item) => item.ownership === "borrowed").length,
    [firearms]
  );

  // The Mine/Borrowed/All filter is only shown once at least one firearm is
  // marked borrowed. Until then, every firearm is treated as "mine".
  const hasBorrowed = borrowedCount > 0;
  const effectiveFilter: FirearmFilter = hasBorrowed ? filter : "mine";

  const filteredFirearms = useMemo(() => {
    if (effectiveFilter === "borrowed") {
      return firearms.filter((item) => item.ownership === "borrowed");
    }
    if (effectiveFilter === "all") {
      return firearms;
    }
    return firearms.filter((item) => item.ownership !== "borrowed");
  }, [firearms, effectiveFilter]);

  const handleFirearmPress = useCallback(
    (firearmId: string) => {
      navigation.navigate("FirearmDetails", { id: firearmId });
    },
    [navigation]
  );

  const showBorrowedBadge = effectiveFilter === "all";

  const renderFirearmItem = useCallback(
    ({ item }: ListRenderItemInfo<FirearmStorage>) => (
      <FirearmListItem
        firearm={item}
        onPress={handleFirearmPress}
        showBorrowedBadge={showBorrowedBadge}
        needsAttention={!!attention[item.id]}
      />
    ),
    [handleFirearmPress, showBorrowedBadge, attention]
  );

  const renderEmptyState = useCallback(() => {
    if (effectiveFilter === "mine" && borrowedCount > 0) {
      return (
        <EmptyState
          title="No firearms"
          message={`${borrowedCount} firearms are borrowed.`}
          primaryAction={{
            caption: "Add firearm",
            onPress: () => navigation.navigate("AddFirearm"),
          }}
          secondaryAction={{
            caption: "View borrowed",
            onPress: () => setFilter("borrowed"),
          }}
        />
      );
    }
    return (
      <EmptyState
        title="No firearms yet"
        message="Add your first firearm to start tracking round counts, range visits and history."
        primaryAction={{
          caption: "Add firearm",
          onPress: () => navigation.navigate("AddFirearm"),
        }}
      />
    );
  }, [effectiveFilter, navigation, borrowedCount]);

  return (
    <View className="flex-1">
      {hasBorrowed && (
        <TerminalTabs
          variant="secondary"
          tabs={FILTER_OPTIONS}
          activeTab={effectiveFilter}
          onTabPress={(id) => setFilter(id as FirearmFilter)}
          testIDPrefix="firearm-filter-"
        />
      )}
      <FlatList
        data={filteredFirearms}
        renderItem={renderFirearmItem}
        keyExtractor={(item) => item.id}
        removeClippedSubviews={false}
        contentContainerStyle={{ flexGrow: 1 }}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={renderEmptyState()}
      />
    </View>
  );
};
