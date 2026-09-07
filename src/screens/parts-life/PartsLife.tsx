import React, { useCallback, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import {
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import { handleError } from "../../services/error-handler";
import { storage } from "../../services/storage-new";
import { calculatePartStatus, PartLifeResult } from "../../services/parts-life-calculation";
import {
  DetailSection,
  EmptyState,
  ErrorDisplay,
  LoadingScreen,
  StatusBadge,
  TerminalText,
} from "../../components";
import {
  FirearmStorage,
  PartInstance,
  PartInstallationPeriod,
  PartSlot,
  RangeVisitStorage,
} from "../../validation/storageSchemas";

type PartsLifeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PartsLife"
>;

type Row = PartLifeResult & { firearmName: string };

export const PartsLife = () => {
  const navigation = useNavigation<PartsLifeScreenNavigationProp>();
  const [due, setDue] = useState<Row[]>([]);
  const [dueSoon, setDueSoon] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [firearms, slots, instances, periods, visits] = await Promise.all([
        storage.getFirearms(),
        storage.getAllPartSlots(),
        storage.getAllPartInstances(),
        storage.getAllPartPeriods(),
        storage.getRangeVisits(),
      ]);

      const firearmById = new Map(firearms.map((f) => [f.id, f]));
      const dueRows: Row[] = [];
      const dueSoonRows: Row[] = [];

      for (const slot of slots) {
        const currentInstance = findCurrentInstance(instances, periods, slot.id);
        const result = calculatePartStatus(slot, currentInstance, periods, visits);
        if (result.status === "due" || result.status === "due_soon") {
          const row: Row = {
            ...result,
            firearmName: firearmById.get(slot.firearmId)?.modelName ?? slot.firearmId,
          };
          if (result.status === "due") dueRows.push(row);
          else dueSoonRows.push(row);
        }
      }

      const sortRows = (rows: Row[]) =>
        rows.sort((a, b) => {
          const remA = a.remainingRounds ?? 0;
          const remB = b.remainingRounds ?? 0;
          return remA - remB;
        });

      setDue(sortRows(dueRows));
      setDueSoon(sortRows(dueSoonRows));
    } catch (e) {
      handleError(e, "PartsLife.fetch", { isUserFacing: true, userMessage: "Failed to load parts life." });
      setError("Failed to load parts life.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [fetch])
  );

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorDisplay errorMessage={error} onRetry={fetch} />;

  if (due.length === 0 && dueSoon.length === 0) {
    return (
      <EmptyState
        title="NO PARTS LIFE DATA"
        message="Tracked firearm components will appear here. Add a component from a firearm's details screen."
      />
    );
  }

  const renderRow = (row: Row) => (
    <Pressable
      key={row.slot?.id}
      onPress={() =>
        row.slot && navigation.navigate("PartDetails", { slotId: row.slot.id })
      }
      className="py-3 border-b border-terminal-border/30"
      accessibilityRole="button"
      accessibilityLabel={`${row.firearmName} ${row.slot?.name}`}
      testID={`parts-life-row-${row.slot?.id}`}
    >
      <TerminalText className="text-terminal-muted">{row.firearmName}</TerminalText>
      <TerminalText>{row.slot?.name}</TerminalText>
      <View className="flex-row justify-between items-center mt-1">
        <TerminalText className="text-terminal-muted">
          {formatUsage(row)}
        </TerminalText>
        <StatusBadge
          label={row.status === "due" ? "DUE" : "DUE SOON"}
          variant={row.status === "due" ? "due" : "due_soon"}
        />
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-4 pb-8">
          {due.length > 0 && (
            <DetailSection title="DUE">{due.map(renderRow)}</DetailSection>
          )}
          {dueSoon.length > 0 && (
            <DetailSection title="DUE SOON">{dueSoon.map(renderRow)}</DetailSection>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const findCurrentInstance = (
  instances: PartInstance[],
  periods: PartInstallationPeriod[],
  slotId: string
): PartInstance | null => {
  const slotInstances = instances.filter((i) => i.partSlotId === slotId);
  const active = periods.find(
    (p) =>
      p.removedAt === undefined &&
      slotInstances.some((i) => i.id === p.partInstanceId)
  );
  if (!active) return null;
  return slotInstances.find((i) => i.id === active.partInstanceId) ?? null;
};

const formatUsage = (row: Row): string => {
  if (row.currentUsage === null) return "usage unknown";
  if (!row.slot?.serviceIntervalRounds) {
    return `${row.currentUsage} rounds · no interval`;
  }
  const interval = row.slot.serviceIntervalRounds;
  if (row.currentUsage >= interval) {
    return `${row.currentUsage} / ${interval} · ${row.currentUsage - interval} over`;
  }
  return `${row.currentUsage} / ${interval} · ${interval - row.currentUsage} remaining`;
};
