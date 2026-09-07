import React, { useCallback, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
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
  TerminalButton,
  TerminalText,
} from "../../components";
import {
  FirearmStorage,
  PartInstance,
  PartInstallationPeriod,
  PartSlot,
  RangeVisitStorage,
} from "../../validation/storageSchemas";

type FirearmPartsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "FirearmParts"
>;
type FirearmPartsScreenRouteProp = RouteProp<RootStackParamList, "FirearmParts">;

export const FirearmParts = () => {
  const navigation = useNavigation<FirearmPartsScreenNavigationProp>();
  const route = useRoute<FirearmPartsScreenRouteProp>();
  const [firearm, setFirearm] = useState<FirearmStorage | null>(null);
  const [results, setResults] = useState<PartLifeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [firearms, slots, instances, periods, visits] = await Promise.all([
        storage.getFirearms(),
        storage.getPartSlots(route.params.firearmId),
        storage.getAllPartInstances(),
        storage.getAllPartPeriods(),
        storage.getRangeVisits(),
      ]);
      setFirearm(firearms.find((f) => f.id === route.params.firearmId) ?? null);

      const computed = slots.map((slot) => {
        const currentInstance = findCurrentInstance(instances, periods, slot.id);
        return calculatePartStatus(slot, currentInstance, periods, visits);
      });
      setResults(computed);
    } catch (e) {
      handleError(e, "FirearmParts.fetch", { isUserFacing: true, userMessage: "Failed to load parts." });
      setError("Failed to load parts.");
    } finally {
      setLoading(false);
    }
  }, [route.params.firearmId]);

  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [fetch])
  );

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorDisplay errorMessage={error} onRetry={fetch} />;

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-4 pb-8">
          <TerminalText className="text-2xl mb-1">
            {firearm?.modelName ?? "PARTS LIFE"}
          </TerminalText>
          <TerminalText className="text-terminal-muted text-lg mb-4">
            {firearm ? `${firearm.roundsFired.toLocaleString("en-US")} firearm rounds` : ""}
          </TerminalText>

          {results.length === 0 ? (
            <EmptyState
              title="NO PARTS TRACKED"
              message="Track the round life of springs, barrels, extractors and other components."
              primaryAction={{
                caption: "Add part",
                onPress: () =>
                  navigation.navigate("AddPart", { firearmId: route.params.firearmId }),
              }}
            />
          ) : (
            <DetailSection title={`${results.length} TRACKED PART${results.length === 1 ? "" : "S"}`}>
              {results.map((result) => (
                <Pressable
                  key={result.slot?.id}
                  onPress={() =>
                    result.slot &&
                    navigation.navigate("PartDetails", { slotId: result.slot.id })
                  }
                  className="py-3 border-b border-terminal-border/30"
                  accessibilityRole="button"
                  accessibilityLabel={result.slot?.name}
                  testID={`part-row-${result.slot?.id}`}
                >
                  <View className="flex-row justify-between items-center">
                    <TerminalText>{result.slot?.name}</TerminalText>
                    <StatusBadgeForStatus status={result.status} />
                  </View>
                  <TerminalText className="text-terminal-muted">
                    {formatResult(result)}
                  </TerminalText>
                </Pressable>
              ))}
            </DetailSection>
          )}

          <TerminalButton
            caption="Add part"
            variant="primary"
            onPress={() =>
              navigation.navigate("AddPart", { firearmId: route.params.firearmId })
            }
          />
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

const formatResult = (result: PartLifeResult): string => {
  if (result.status === "baseline_unknown") {
    return `${result.trackedUsage}+ rounds tracked`;
  }
  if (result.currentUsage === null) return "no part installed";
  if (!result.slot?.serviceIntervalRounds) {
    return `${result.currentUsage} rounds · no interval`;
  }
  const interval = result.slot.serviceIntervalRounds;
  if (result.currentUsage >= interval) {
    return `${result.currentUsage} / ${interval} · ${result.currentUsage - interval} over`;
  }
  return `${result.currentUsage} / ${interval} · ${interval - result.currentUsage} remaining`;
};

const StatusBadgeForStatus = ({ status }: { status: PartLifeResult["status"] }) => {
  if (status === "due") return <StatusBadge label="DUE" variant="due" />;
  if (status === "due_soon") return <StatusBadge label="DUE SOON" variant="due_soon" />;
  return null;
};
