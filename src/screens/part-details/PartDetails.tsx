import React, { useCallback, useState } from "react";
import { View, ScrollView } from "react-native";
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
import {
  calculatePartInstanceUsage,
  calculatePartStatus,
  PartLifeResult,
} from "../../services/parts-life-calculation";
import {
  DetailRow,
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
import { formatDate, REPLACEMENT_REASON_LABELS } from "../../utils";
import { useDeleteEntity } from "../../hooks";

type PartDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PartDetails"
>;
type PartDetailsScreenRouteProp = RouteProp<RootStackParamList, "PartDetails">;

export const PartDetails = () => {
  const navigation = useNavigation<PartDetailsScreenNavigationProp>();
  const route = useRoute<PartDetailsScreenRouteProp>();
  const [slot, setSlot] = useState<PartSlot | null>(null);
  const [firearm, setFirearm] = useState<FirearmStorage | null>(null);
  const [result, setResult] = useState<PartLifeResult | null>(null);
  const [history, setHistory] = useState<
    { instance: PartInstance; period: PartInstallationPeriod | undefined; usage: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [slots, firearms, instances, periods, visits] = await Promise.all([
        storage.getAllPartSlots(),
        storage.getFirearms(),
        storage.getPartInstances(route.params.slotId),
        storage.getAllPartPeriods(),
        storage.getRangeVisits(),
      ]);
      const found = slots.find((s) => s.id === route.params.slotId);
      if (!found) {
        setError("Part not found");
        return;
      }
      setSlot(found);
      setFirearm(firearms.find((f) => f.id === found.firearmId) ?? null);

      const currentInstance = findCurrentInstance(instances, periods, found.id);
      setResult(calculatePartStatus(found, currentInstance, periods, visits));

      const historyRows = instances
        .map((instance) => ({
          instance,
          period: periods.find((p) => p.partInstanceId === instance.id),
          usage: calculatePartInstanceUsage(instance, periods, visits),
        }))
        .sort((a, b) => {
          const aStart = a.period ? new Date(a.period.installedAt).getTime() : 0;
          const bStart = b.period ? new Date(b.period.installedAt).getTime() : 0;
          return bStart - aStart;
        });
      setHistory(historyRows);
    } catch (e) {
      handleError(e, "PartDetails.fetch", { isUserFacing: true, userMessage: "Failed to load part." });
      setError("Failed to load part.");
    } finally {
      setLoading(false);
    }
  }, [route.params.slotId]);

  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [fetch])
  );

  const { confirmDelete } = useDeleteEntity(
    async () => {
      await storage.removePartSlot(route.params.slotId);
    },
    {
      label: "Tracked Part",
      confirmTitle: "DELETE TRACKED PART?",
      confirmMessage: "This removes the part and its full replacement history.",
      errorContext: "PartDetails.handleDelete",
      errorUserMessage: "Failed to delete tracked part.",
    },
    () => navigation.goBack()
  );

  const { confirmDelete: confirmRemove } = useDeleteEntity(
    async () => {
      await storage.removeInstalledPart(route.params.slotId);
    },
    {
      label: "Part",
      confirmTitle: "REMOVE PART?",
      confirmMessage: "Remove the currently installed part without installing a replacement.",
      errorContext: "PartDetails.handleRemove",
      errorUserMessage: "Failed to remove part.",
    },
    () => fetch()
  );

  if (loading) return <LoadingScreen />;
  if (error || !slot) {
    return <ErrorDisplay errorMessage={error || "Part not found"} onRetry={fetch} />;
  }

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-4 pb-8">
          <TerminalText className="text-2xl mb-1">{slot.name}</TerminalText>
          <TerminalText className="text-terminal-muted text-lg mb-4">
            {firearm?.modelName ?? ""}
          </TerminalText>

          {result && (
            <DetailSection title="CURRENT PART">
              {result.currentInstance ? (
                <>
                  <DetailRow
                    label="Installed"
                    value={formatDate(
                      findCurrentPeriod(history, result.currentInstance)?.installedAt,
                      "dd MMM yyyy"
                    )}
                  />
                  <DetailRow
                    label="Usage"
                    value={formatCurrentUsage(result)}
                  />
                  {result.slot?.serviceIntervalRounds ? (
                    <DetailRow
                      label="Service interval"
                      value={`${result.slot.serviceIntervalRounds} rounds`}
                    />
                  ) : null}
                  {result.remainingRounds !== null ? (
                    <DetailRow
                      label="Remaining"
                      value={
                        result.remainingRounds >= 0
                          ? `${result.remainingRounds} rounds`
                          : `${Math.abs(result.remainingRounds)} rounds overdue`
                      }
                    />
                  ) : null}
                  {result.status === "due" || result.status === "due_soon" ? (
                    <View className="mt-2">
                      <StatusBadge
                        label={result.status === "due" ? "DUE" : "DUE SOON"}
                        variant={result.status === "due" ? "due" : "due_soon"}
                      />
                    </View>
                  ) : null}
                </>
              ) : (
                <TerminalText className="text-terminal-muted">
                  No part currently installed.
                </TerminalText>
              )}
            </DetailSection>
          )}

          <View className="mb-6 flex-row flex-wrap">
            <TerminalButton
              caption="Replace part"
              variant="primary"
              className="mr-2 mb-2"
              onPress={() => navigation.navigate("ReplacePart", { slotId: slot.id })}
            />
            <TerminalButton
              caption="Remove part"
              className="mb-2"
              onPress={confirmRemove}
            />
          </View>

          <DetailSection title="PART HISTORY">
            {history.length === 0 ? (
              <TerminalText className="text-terminal-muted">
                No previous parts.
              </TerminalText>
            ) : (
              history.map((row, index) => (
                <View key={row.instance.id} className="py-3 border-b border-terminal-border/30">
                  <TerminalText>
                    {row.instance.manufacturer || row.instance.model
                      ? `${row.instance.manufacturer ?? ""} ${row.instance.model ?? ""}`.trim()
                      : `Part #${history.length - index}`}
                  </TerminalText>
                  <TerminalText className="text-terminal-muted">
                    {formatDate(row.period?.installedAt, "dd MMM yyyy")}
                    {" → "}
                    {row.period?.removedAt
                      ? formatDate(row.period.removedAt, "dd MMM yyyy")
                      : "current"}
                    {` · ${row.usage} rounds`}
                  </TerminalText>
                  {row.instance.replacementReason ? (
                    <TerminalText className="text-terminal-muted text-sm">
                      {REPLACEMENT_REASON_LABELS[row.instance.replacementReason]}
                    </TerminalText>
                  ) : null}
                </View>
              ))
            )}
          </DetailSection>

          <DetailSection title="DANGER ZONE">
            <TerminalButton
              caption="Delete tracked part"
              variant="destructive"
              onPress={confirmDelete}
            />
          </DetailSection>
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
  const active = periods.find(
    (p) => p.removedAt === undefined && instances.some((i) => i.id === p.partInstanceId)
  );
  if (!active) return null;
  return instances.find((i) => i.id === active.partInstanceId) ?? null;
};

const findCurrentPeriod = (
  history: { instance: PartInstance; period: PartInstallationPeriod | undefined; usage: number }[],
  instance: PartInstance
): PartInstallationPeriod | undefined => history.find((h) => h.instance.id === instance.id)?.period;

const formatCurrentUsage = (result: PartLifeResult): string => {
  if (result.status === "baseline_unknown") return `${result.trackedUsage}+ rounds`;
  if (result.currentUsage === null) return "—";
  return `${result.currentUsage} rounds`;
};
