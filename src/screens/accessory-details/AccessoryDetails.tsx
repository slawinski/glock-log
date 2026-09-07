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
import { computeAccessoryStats, getCurrentMount } from "../../services/accessory-service";
import { findReconciliation } from "../../services/accessory-reconciliation";
import {
  DetailRow,
  DetailSection,
  ErrorDisplay,
  LoadingScreen,
  MetricHero,
  TerminalButton,
  TerminalText,
} from "../../components";
import {
  AccessoryStorage,
  FirearmStorage,
  RangeVisitStorage,
} from "../../validation/storageSchemas";
import { formatDate, ACCESSORY_CATEGORY_LABELS } from "../../utils";
import { useDeleteEntity } from "../../hooks";

type AccessoryDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AccessoryDetails"
>;
type AccessoryDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "AccessoryDetails"
>;

export const AccessoryDetails = () => {
  const navigation = useNavigation<AccessoryDetailsScreenNavigationProp>();
  const route = useRoute<AccessoryDetailsScreenRouteProp>();
  const [accessory, setAccessory] = useState<AccessoryStorage | null>(null);
  const [firearms, setFirearms] = useState<FirearmStorage[]>([]);
  const [visits, setVisits] = useState<RangeVisitStorage[]>([]);
  const [showPicker, setShowPicker] = useState<"move" | "mount" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [accessories, loadedFirearms, loadedVisits] = await Promise.all([
        storage.getAccessories(),
        storage.getFirearms(),
        storage.getRangeVisits(),
      ]);
      const found = accessories.find((a) => a.id === route.params.id);
      setAccessory(found ?? null);
      setFirearms(loadedFirearms);
      setVisits(loadedVisits);
      if (!found) setError("Accessory not found");
    } catch (e) {
      handleError(e, "AccessoryDetails.fetch", { isUserFacing: true, userMessage: "Failed to load accessory." });
      setError("Failed to load accessory.");
    } finally {
      setLoading(false);
    }
  }, [route.params.id]);

  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [fetch])
  );

  const { confirmDelete } = useDeleteEntity(
    async () => {
      await storage.deleteAccessory(route.params.id);
    },
    {
      label: "Accessory",
      confirmTitle: "DELETE ACCESSORY?",
      confirmMessage: "This permanently removes the accessory.",
      errorContext: "AccessoryDetails.handleDelete",
      errorUserMessage: "Failed to delete accessory.",
    },
    () => navigation.goBack()
  );

  const archive = async () => {
    try {
      await storage.archiveAccessory(route.params.id);
      fetch();
    } catch (e) {
      handleError(e, "AccessoryDetails.archive", { isUserFacing: true, userMessage: "Failed to archive accessory." });
    }
  };

  const restore = async () => {
    try {
      await storage.restoreAccessory(route.params.id);
      fetch();
    } catch (e) {
      handleError(e, "AccessoryDetails.restore", { isUserFacing: true, userMessage: "Failed to restore accessory." });
    }
  };

  const unmount = async () => {
    try {
      await storage.unmountAccessory(route.params.id, new Date().toISOString());
      setShowPicker(null);
      fetch();
    } catch (e) {
      handleError(e, "AccessoryDetails.unmount", { isUserFacing: true, userMessage: "Failed to unmount accessory." });
    }
  };

  const pickFirearm = async (firearmId: string) => {
    try {
      const now = new Date().toISOString();
      if (showPicker === "move") {
        await storage.moveAccessory(route.params.id, firearmId, now);
      } else {
        await storage.mountAccessory(route.params.id, firearmId, now);
      }
      setShowPicker(null);
      fetch();
    } catch (e) {
      handleError(e, "AccessoryDetails.pickFirearm", { isUserFacing: true, userMessage: "Failed to update accessory setup." });
    }
  };

  if (loading) return <LoadingScreen />;
  if (error || !accessory) {
    return <ErrorDisplay errorMessage={error || "Accessory not found"} onRetry={fetch} />;
  }

  const stats = computeAccessoryStats(accessory, visits);
  const mount = getCurrentMount(accessory);
  const mountedFirearm = mount
    ? firearms.find((f) => f.id === mount.firearmId)
    : undefined;
  const reconciliation = findReconciliation(accessory, visits);
  const needsReview =
    reconciliation.missingUsage.length > 0 ||
    reconciliation.ambiguousUsage.length > 0 ||
    reconciliation.outsideMountUsage.length > 0;

  const firearmById = new Map(firearms.map((f) => [f.id, f]));

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-4 pb-8">
          <TerminalText className="text-2xl mb-1">{accessory.modelName}</TerminalText>
          <TerminalText className="text-terminal-muted text-lg mb-4">
            {ACCESSORY_CATEGORY_LABELS[accessory.category].toUpperCase()}
            {accessory.status === "archived" ? " · ARCHIVED" : ""}
          </TerminalText>

          <MetricHero
            value={stats.totalExposure.toLocaleString("en-US")}
            label="rounds exposure"
            className="mb-6"
          />

          <DetailSection title="CURRENT SETUP">
            {mount ? (
              <>
                <DetailRow
                  label="Mounted on"
                  value={mountedFirearm?.modelName ?? mount.firearmNameSnapshot}
                />
                <DetailRow
                  label="Mounted since"
                  value={formatDate(mount.mountedAt, "dd MMM yyyy")}
                />
                <View className="mt-3 flex-row flex-wrap">
                  <TerminalButton
                    caption="Move"
                    className="mr-2 mb-2"
                    onPress={() => setShowPicker("move")}
                  />
                  <TerminalButton
                    caption="Unmount"
                    className="mb-2"
                    onPress={unmount}
                  />
                </View>
              </>
            ) : (
              <TerminalButton
                caption="Mount on firearm"
                variant="primary"
                onPress={() => setShowPicker("mount")}
              />
            )}
          </DetailSection>

          {showPicker && (
            <DetailSection title={showPicker === "move" ? "MOVE TO" : "MOUNT ON"}>
              {firearms.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => pickFirearm(f.id)}
                  className="py-3 border-b border-terminal-border/30"
                  accessibilityRole="button"
                  accessibilityLabel={f.modelName}
                >
                  <TerminalText>{f.modelName}</TerminalText>
                </Pressable>
              ))}
            </DetailSection>
          )}

          {needsReview && (
            <DetailSection title="RECONCILIATION">
              <TerminalText className="text-terminal-muted mb-2">
                Historical usage needs review.
              </TerminalText>
              <TerminalButton
                caption="Review"
                onPress={() =>
                  navigation.navigate("AccessoryReconciliation", {
                    accessoryId: accessory.id,
                  })
                }
              />
            </DetailSection>
          )}

          <DetailSection title="OVERVIEW">
            {accessory.manufacturer ? (
              <DetailRow label="Manufacturer" value={accessory.manufacturer} />
            ) : null}
            <DetailRow label="Model" value={accessory.modelName} />
            {accessory.serialNumber ? (
              <DetailRow label="Serial number" value={accessory.serialNumber} />
            ) : null}
            {accessory.datePurchased ? (
              <DetailRow
                label="Purchased"
                value={formatDate(accessory.datePurchased, "dd MMM yyyy")}
              />
            ) : null}
          </DetailSection>

          <DetailSection title="USAGE">
            <DetailRow
              label="Total exposure"
              value={stats.totalExposure.toLocaleString("en-US")}
            />
            <DetailRow
              label="Tracked by TriggerNote"
              value={stats.trackedExposure.toLocaleString("en-US")}
            />
            <DetailRow
              label="Previous rounds"
              value={accessory.initialRounds.toLocaleString("en-US")}
            />
          </DetailSection>

          {stats.usageByFirearm.length > 0 && (
            <DetailSection title="USAGE BY FIREARM">
              {stats.usageByFirearm.map((row) => (
                <DetailRow
                  key={row.firearmId}
                  label={firearmById.get(row.firearmId)?.modelName ?? row.firearmId}
                  value={`${row.rounds.toLocaleString("en-US")} rounds`}
                />
              ))}
            </DetailSection>
          )}

          {accessory.mountHistory.length > 0 && (
            <DetailSection title="MOUNT HISTORY">
              {accessory.mountHistory.map((m) => (
                <DetailRow
                  key={m.id}
                  label={m.firearmNameSnapshot}
                  value={
                    m.unmountedAt
                      ? `${formatDate(m.mountedAt, "dd MMM yyyy")} → ${formatDate(m.unmountedAt, "dd MMM yyyy")}`
                      : `${formatDate(m.mountedAt, "dd MMM yyyy")} → current`
                  }
                />
              ))}
            </DetailSection>
          )}

          {accessory.notes ? (
            <DetailSection title="NOTES">
              <TerminalText className="flex-shrink">{accessory.notes}</TerminalText>
            </DetailSection>
          ) : null}

          <View className="mb-6">
            <TerminalButton
              caption="Edit accessory"
              variant="primary"
              onPress={() => navigation.navigate("EditAccessory", { id: accessory.id })}
            />
          </View>

          <DetailSection title="DANGER ZONE">
            <TerminalButton
              caption={accessory.status === "archived" ? "Restore accessory" : "Archive accessory"}
              onPress={accessory.status === "archived" ? restore : archive}
            />
            <View className="mt-2">
              <TerminalButton
                caption="Delete accessory"
                variant="destructive"
                onPress={confirmDelete}
              />
            </View>
          </DetailSection>
        </View>
      </ScrollView>
    </View>
  );
};
