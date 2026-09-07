import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../app/App";
import { handleError } from "../../services/error-handler";
import { storage } from "../../services/storage-new";
import {
  findReconciliation,
  CandidateUsage,
  UsageConflict,
} from "../../services/accessory-reconciliation";
import {
  DetailSection,
  EmptyState,
  ErrorDisplay,
  LoadingScreen,
  StickyActionBar,
  TerminalButton,
  TerminalInput,
  TerminalText,
} from "../../components";
import {
  AccessoryStorage,
  FirearmStorage,
  RangeVisitStorage,
} from "../../validation/storageSchemas";
import { formatDate } from "../../utils";

type AccessoryReconciliationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AccessoryReconciliation"
>;
type AccessoryReconciliationScreenRouteProp = RouteProp<
  RootStackParamList,
  "AccessoryReconciliation"
>;

type CandidateDecision = { action: "full" | "exclude" | "custom"; rounds: string };
type ConflictDecision = "keep" | "remove";

export const AccessoryReconciliation = () => {
  const navigation = useNavigation<AccessoryReconciliationScreenNavigationProp>();
  const route = useRoute<AccessoryReconciliationScreenRouteProp>();
  const [accessory, setAccessory] = useState<AccessoryStorage | null>(null);
  const [missing, setMissing] = useState<CandidateUsage[]>([]);
  const [ambiguous, setAmbiguous] = useState<CandidateUsage[]>([]);
  const [conflicts, setConflicts] = useState<UsageConflict[]>([]);
  const [decisions, setDecisions] = useState<Record<string, CandidateDecision>>({});
  const [conflictDecisions, setConflictDecisions] = useState<Record<string, ConflictDecision>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [accessories, visits] = await Promise.all([
        storage.getAccessories(),
        storage.getRangeVisits(),
      ]);
      const found = accessories.find((a) => a.id === route.params.accessoryId);
      if (!found) {
        setError("Accessory not found");
        return;
      }
      setAccessory(found);
      const reconciliation = findReconciliation(found, visits);
      setMissing(reconciliation.missingUsage);
      setAmbiguous(reconciliation.ambiguousUsage);
      setConflicts(reconciliation.outsideMountUsage);

      const initial: Record<string, CandidateDecision> = {};
      for (const c of reconciliation.missingUsage) {
        initial[key(c)] = { action: "full", rounds: String(c.firearmRounds) };
      }
      for (const c of reconciliation.ambiguousUsage) {
        initial[key(c)] = { action: "exclude", rounds: String(c.firearmRounds) };
      }
      setDecisions(initial);
    } catch (e) {
      handleError(e, "AccessoryReconciliation.fetch", { isUserFacing: true, userMessage: "Failed to load reconciliation." });
      setError("Failed to load reconciliation.");
    } finally {
      setLoading(false);
    }
  }, [route.params.accessoryId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const apply = async () => {
    try {
      setSaving(true);
      const backfill = [...missing, ...ambiguous]
        .filter((c) => {
          const d = decisions[key(c)];
          return d && d.action !== "exclude";
        })
        .map((c) => {
          const d = decisions[key(c)];
          if (d.action === "custom") {
            return {
              visitId: c.visitId,
              firearmId: c.firearmId,
              action: "add_manual" as const,
              rounds: Number(d.rounds),
            };
          }
          return {
            visitId: c.visitId,
            firearmId: c.firearmId,
            action: "add_full_visit" as const,
          };
        });

      const conflictDecisionsList = conflicts
        .filter((c) => conflictDecisions[key(c)] === "remove")
        .map((c) => ({
          visitId: c.visitId,
          accessoryId: c.accessoryId,
          firearmId: c.firearmId,
          action: "remove" as const,
        }));

      if (backfill.length > 0) {
        await storage.applyBackfill(route.params.accessoryId, backfill);
      }
      if (conflictDecisionsList.length > 0) {
        await storage.resolveConflicts(route.params.accessoryId, conflictDecisionsList);
      }
      navigation.goBack();
    } catch (e) {
      handleError(e, "AccessoryReconciliation.apply", { isUserFacing: true, userMessage: "Failed to reconcile historical usage." });
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (error || !accessory) {
    return <ErrorDisplay errorMessage={error || "Accessory not found"} onRetry={fetch} />;
  }

  const candidates = [...missing, ...ambiguous];
  const hasAnything = candidates.length > 0 || conflicts.length > 0;

  if (!hasAnything) {
    return (
      <EmptyState
        title="NOTHING TO REVIEW"
        message="No historical usage needs review for this accessory."
        primaryAction={{ caption: "Done", onPress: () => navigation.goBack() }}
      />
    );
  }

  const renderCandidate = (c: CandidateUsage) => {
    const d = decisions[key(c)] ?? { action: "exclude", rounds: String(c.firearmRounds) };
    return (
      <View key={`${c.visitId}:${c.firearmId}`} className="py-3 border-b border-terminal-border/30">
        <TerminalText>{formatDate(c.visitDate, "dd MMM yyyy")}</TerminalText>
        <TerminalText className="text-terminal-muted">
          {c.firearmNameSnapshot} · {c.firearmRounds} rounds
          {c.confidence === "same_day_ambiguous" ? " · TIMING UNCLEAR" : ""}
        </TerminalText>
        <View className="flex-row flex-wrap mt-2">
          {(
            [
              ["full", "FULL VISIT"],
              ["custom", "CUSTOM"],
              ["exclude", "EXCLUDE"],
            ] as const
          ).map(([action, label]) => (
            <Pressable
              key={action}
              onPress={() =>
                setDecisions((prev) => ({
                  ...prev,
                  [key(c)]: { action, rounds: d.rounds },
                }))
              }
              className={`border px-2 py-1 mr-2 mb-1 ${
                d.action === action ? "bg-terminal-green border-terminal-green" : "border-terminal-border"
              }`}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              <TerminalText className={`text-sm ${d.action === action ? "text-terminal-bg" : ""}`}>
                {label}
              </TerminalText>
            </Pressable>
          ))}
        </View>
        {d.action === "custom" && (
          <TerminalInput
            value={d.rounds}
            onChangeText={(text) =>
              setDecisions((prev) => ({
                ...prev,
                [key(c)]: { action: "custom", rounds: text },
              }))
            }
            keyboardType="numeric"
            placeholder="Accessory rounds"
          />
        )}
      </View>
    );
  };

  const renderConflict = (c: UsageConflict) => {
    const decision = conflictDecisions[key(c)] ?? "keep";
    return (
      <View key={`${c.visitId}:${c.firearmId}`} className="py-3 border-b border-terminal-border/30">
        <TerminalText>{formatDate(c.visitDate, "dd MMM yyyy")}</TerminalText>
        <TerminalText className="text-terminal-muted">
          {c.rounds} rounds now outside mount history
        </TerminalText>
        <View className="flex-row flex-wrap mt-2">
          {(["keep", "remove"] as const).map((action) => (
            <Pressable
              key={action}
              onPress={() =>
                setConflictDecisions((prev) => ({ ...prev, [key(c)]: action }))
              }
              className={`border px-2 py-1 mr-2 mb-1 ${
                decision === action ? "bg-terminal-green border-terminal-green" : "border-terminal-border"
              }`}
              accessibilityRole="button"
              accessibilityLabel={action.toUpperCase()}
            >
              <TerminalText className={`text-sm ${decision === action ? "text-terminal-bg" : ""}`}>
                {action === "keep" ? "KEEP" : "REMOVE"}
              </TerminalText>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-4 pb-24">
          <TerminalText className="text-2xl mb-1">HISTORICAL USAGE</TerminalText>
          <TerminalText className="text-terminal-muted text-lg mb-4">
            {accessory.modelName}
          </TerminalText>

          {candidates.length > 0 && (
            <DetailSection title={`${candidates.length} CANDIDATE VISIT${candidates.length === 1 ? "" : "S"}`}>
              {candidates.map(renderCandidate)}
            </DetailSection>
          )}

          {conflicts.length > 0 && (
            <DetailSection title={`${conflicts.length} CONFLICT${conflicts.length === 1 ? "" : "S"}`}>
              {conflicts.map(renderConflict)}
            </DetailSection>
          )}
        </View>
      </ScrollView>

      <StickyActionBar
        secondaryActions={[
          { caption: "SKIP", onPress: () => navigation.goBack(), variant: "secondary" },
        ]}
        primaryAction={{
          caption: saving ? "Saving…" : "ADD SELECTED",
          onPress: apply,
          disabled: saving,
          loading: saving,
        }}
      />
    </View>
  );
};

const key = (c: { visitId: string; firearmId: string }): string =>
  `${c.visitId}:${c.firearmId}`;
