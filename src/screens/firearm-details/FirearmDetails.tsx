import React, { useState, useCallback } from "react";
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
import { calculateCleaningStatus } from "../../services/cleaning-calculation";
import { getCurrentMount } from "../../services/accessory-service";
import { FirearmArtwork } from "../../features/firearm-visuals";
import {
  DetailRow,
  DetailSection,
  ErrorDisplay,
  ImageGallery,
  LoadingScreen,
  MetricHero,
  StatusBadge,
  TerminalButton,
  TerminalText,
} from "../../components";
import {
  AccessoryStorage,
  CleaningEvent,
  CleaningSettings,
  FirearmStorage,
  RangeVisitStorage,
} from "../../validation/storageSchemas";
import { PartLifeResult } from "../../services/parts-life-calculation";
import { formatCurrency, formatDate, ACCESSORY_CATEGORY_LABELS } from "../../utils";
import { useDeleteEntity } from "../../hooks";

type FirearmDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "FirearmDetails"
>;
type FirearmDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "FirearmDetails"
>;

type FirearmActivity = {
  id: string;
  date: string;
  rounds: number;
};

export const FirearmDetails = () => {
  const navigation = useNavigation<FirearmDetailsScreenNavigationProp>();
  const route = useRoute<FirearmDetailsScreenRouteProp>();
  const [firearm, setFirearm] = useState<FirearmStorage | null>(null);
  const [rangeVisits, setRangeVisits] = useState<RangeVisitStorage[]>([]);
  const [cleaningSettings, setCleaningSettings] = useState<CleaningSettings | undefined>();
  const [cleaningEvents, setCleaningEvents] = useState<CleaningEvent[]>([]);
  const [partsStatus, setPartsStatus] = useState<PartLifeResult[]>([]);
  const [accessories, setAccessories] = useState<AccessoryStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>("USD");

  const fetchFirearm = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [firearms, visits, settings, events, allAccessories, currentCurrency] =
        await Promise.all([
          storage.getFirearms(),
          storage.getRangeVisits(),
          storage.getCleaningSettings(route.params.id),
          storage.getCleaningEvents(route.params.id),
          storage.getAccessories(),
          storage.getCurrency(),
        ]);
      const foundFirearm = firearms.find((f) => f.id === route.params.id);
      if (foundFirearm) {
        setFirearm(foundFirearm);
      } else {
        setError("Firearm not found");
      }
      setRangeVisits(visits);
      setCleaningSettings(settings);
      setCleaningEvents(events);
      setAccessories(
        allAccessories.filter((a) => a.status === "active")
      );
      const parts = await storage.getFirearmPartsStatus(route.params.id, visits);
      setPartsStatus(parts);
      setCurrency(currentCurrency);
    } catch (error) {
      handleError(error, "FirearmDetails.fetchFirearm", { isUserFacing: true, userMessage: "Failed to load firearm details." });
      setError("Failed to load firearm details.");
    } finally {
      setLoading(false);
    }
  }, [route.params.id]);

  useFocusEffect(
    useCallback(() => {
      fetchFirearm();
    }, [fetchFirearm])
  );

  const { confirmDelete } = useDeleteEntity(
    async () => {
      if (!firearm) return;
      await Promise.all([
        storage.deleteFirearm(firearm.id),
        storage.deleteCleaningForFirearm(firearm.id),
        storage.deletePartsForFirearm(firearm.id),
        storage.handleFirearmDeletion(firearm.id),
      ]);
    },
    {
      label: "Firearm",
      errorContext: "FirearmDetails.handleDelete",
      errorUserMessage: "Failed to delete firearm. Please try again.",
    },
    () => navigation.goBack()
  );

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !firearm) {
    return (
      <ErrorDisplay
        errorMessage={error || "ENTRY NOT FOUND"}
        onRetry={fetchFirearm}
      />
    );
  }

  const recentActivity: FirearmActivity[] = rangeVisits
    .filter((visit) => visit.firearmsUsed.includes(firearm.id))
    .map((visit) => ({
      id: visit.id,
      date: visit.date,
      rounds: visit.ammunitionUsed?.[firearm.id]?.rounds ?? 0,
    }))
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 5);

  const cleaningStatus = calculateCleaningStatus(
    cleaningSettings,
    cleaningEvents,
    rangeVisits,
    firearm.id
  );

  const partsNeedingAttention = partsStatus.filter(
    (p) => p.status === "due" || p.status === "due_soon"
  );

  const mountedAccessories = accessories.filter(
    (a) => getCurrentMount(a)?.firearmId === firearm.id
  );

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-4 pb-8">
          <TerminalText className="text-2xl">{firearm.modelName}</TerminalText>
          <View className="mb-4">
            <TerminalText className="text-terminal-muted text-lg">
              {firearm.caliber}
            </TerminalText>
            {firearm.ownership === "borrowed" && (
              <TerminalText className="text-terminal-muted text-sm">
                BORROWED
              </TerminalText>
            )}
          </View>

          {firearm.photos && firearm.photos.length > 0 ? (
            <View className="mb-6">
              <ImageGallery
                images={firearm.photos}
                size="large"
                showDeleteButton={false}
              />
            </View>
          ) : (
            <View className="mb-6 items-center">
              <FirearmArtwork
                firearmType={firearm.firearmType ?? "other"}
                mountedAccessories={mountedAccessories}
                size={220}
                testID="firearm-artwork"
              />
            </View>
          )}

          <MetricHero
            value={firearm.roundsFired.toLocaleString("en-US")}
            label="rounds fired"
            className="mb-6"
          />

          <DetailSection title="CLEANING">
            {!cleaningStatus.fieldStrip.enabled && !cleaningStatus.completeDisassembly.enabled ? (
              <TerminalText className="text-terminal-muted mb-3">
                Cleaning intervals are not configured.
              </TerminalText>
            ) : (
              <>
                {cleaningStatus.fieldStrip.enabled && (
                  <CleaningIntervalRow
                    label="FIELD STRIP"
                    roundsSince={cleaningStatus.fieldStrip.roundsSinceCleaning}
                    interval={cleaningStatus.fieldStrip.interval}
                    remaining={cleaningStatus.fieldStrip.remainingRounds}
                    status={cleaningStatus.fieldStrip.status}
                    lastCleanedAt={cleaningStatus.fieldStrip.lastCleaningEvent?.performedAt}
                  />
                )}
                {cleaningStatus.completeDisassembly.enabled && (
                  <CleaningIntervalRow
                    label="COMPLETE"
                    roundsSince={cleaningStatus.completeDisassembly.roundsSinceCleaning}
                    interval={cleaningStatus.completeDisassembly.interval}
                    remaining={cleaningStatus.completeDisassembly.remainingRounds}
                    status={cleaningStatus.completeDisassembly.status}
                    lastCleanedAt={cleaningStatus.completeDisassembly.lastCleaningEvent?.performedAt}
                  />
                )}
              </>
            )}
            <View className="mt-3">
              <TerminalButton
                caption="Manage cleaning"
                variant="primary"
                onPress={() =>
                  navigation.navigate("CleaningHistory", { firearmId: firearm.id })
                }
              />
            </View>
          </DetailSection>

          <DetailSection title="PARTS LIFE">
            {partsStatus.length === 0 ? (
              <TerminalText className="text-terminal-muted mb-3">
                No components are being tracked.
              </TerminalText>
            ) : (
              <>
                {partsNeedingAttention.length > 0 && (
                  <TerminalText className="text-terminal-muted mb-2">
                    {partsNeedingAttention.length} PART
                    {partsNeedingAttention.length === 1 ? "" : "S"} NEEDS ATTENTION
                  </TerminalText>
                )}
                {partsStatus.map((part) => (
                  <View key={part.slot?.id} className="py-2 border-b border-terminal-border/30">
                    <View className="flex-row justify-between items-center">
                      <TerminalText>{part.slot?.name}</TerminalText>
                      {part.status === "due" && <StatusBadge label="DUE" variant="due" />}
                      {part.status === "due_soon" && (
                        <StatusBadge label="DUE SOON" variant="due_soon" />
                      )}
                    </View>
                    <TerminalText className="text-terminal-muted">
                      {formatPartUsage(part)}
                    </TerminalText>
                  </View>
                ))}
              </>
            )}
            <View className="mt-3">
              <TerminalButton
                caption="Manage parts"
                onPress={() =>
                  navigation.navigate("FirearmParts", { firearmId: firearm.id })
                }
              />
            </View>
          </DetailSection>

          <DetailSection title="ACCESSORIES">
            {mountedAccessories.length === 0 ? (
              <TerminalText className="text-terminal-muted mb-3">
                No accessories mounted.
              </TerminalText>
            ) : (
              mountedAccessories.map((accessory) => (
                <View key={accessory.id} className="py-2 border-b border-terminal-border/30">
                  <TerminalText>{accessory.modelName}</TerminalText>
                  <TerminalText className="text-terminal-muted">
                    {ACCESSORY_CATEGORY_LABELS[accessory.category]}
                  </TerminalText>
                </View>
              ))
            )}
            <View className="mt-3">
              <TerminalButton
                caption="Manage accessories"
                onPress={() =>
                  navigation.navigate("ManageFirearmAccessories", { firearmId: firearm.id })
                }
              />
            </View>
          </DetailSection>

          <DetailSection title="OVERVIEW">
            {firearm.ownership !== "borrowed" && (
              <>
                <DetailRow
                  label="Purchased"
                  value={formatDate(firearm.datePurchased, "dd MMM yyyy")}
                />
                <DetailRow
                  label="Amount paid"
                  value={formatCurrency(firearm.amountPaid, currency)}
                />
              </>
            )}
            <DetailRow
              label="Added"
              value={formatDate(firearm.createdAt, "dd MMM yyyy")}
            />
          </DetailSection>

          {recentActivity.length > 0 && (
            <DetailSection title="RECENT ACTIVITY">
              {recentActivity.map((activity) => (
                <DetailRow
                  key={activity.id}
                  label={formatDate(activity.date, "dd MMM yyyy")}
                  value={`${activity.rounds} rounds`}
                />
              ))}
            </DetailSection>
          )}

          {firearm.notes && (
            <DetailSection title="NOTES">
              <TerminalText className="flex-shrink">{firearm.notes}</TerminalText>
            </DetailSection>
          )}

          <View className="mb-6">
            <TerminalButton
              caption="Edit firearm"
              variant="primary"
              onPress={() =>
                navigation.navigate("EditFirearm", { id: firearm.id })
              }
            />
          </View>

          <DetailSection title="DANGER ZONE">
            <TerminalButton
              caption="Delete firearm"
              variant="destructive"
              onPress={confirmDelete}
            />
          </DetailSection>
        </View>
      </ScrollView>
    </View>
  );
};

type CleaningIntervalRowProps = {
  label: string;
  roundsSince: number | null;
  interval: number | null;
  remaining: number | null;
  status: string;
  lastCleanedAt?: string;
};

const CleaningIntervalRow = ({
  label,
  roundsSince,
  interval,
  remaining,
  status,
  lastCleanedAt,
}: CleaningIntervalRowProps) => (
  <View className="py-3 border-b border-terminal-border/30">
    <View className="flex-row justify-between items-center">
      <TerminalText>{label}</TerminalText>
      {status === "due" && <StatusBadge label="DUE" variant="due" />}
      {status === "due_soon" && <StatusBadge label="DUE SOON" variant="due_soon" />}
    </View>
    <TerminalText className="text-terminal-muted">
      {roundsSince === null
        ? "Tracking not initialized"
        : interval !== null && remaining !== null && remaining >= 0
          ? `${roundsSince} / ${interval} RDS · ${remaining} remaining`
          : interval !== null && remaining !== null
            ? `${roundsSince} / ${interval} RDS · ${Math.abs(remaining)} overdue`
            : `${roundsSince} rounds`}
    </TerminalText>
    {lastCleanedAt && (
      <TerminalText className="text-terminal-muted text-sm">
        Last cleaned {formatDate(lastCleanedAt, "dd MMM yyyy")}
      </TerminalText>
    )}
  </View>
);

const formatPartUsage = (part: PartLifeResult): string => {
  if (part.status === "baseline_unknown") return `${part.trackedUsage}+ rounds tracked`;
  if (part.currentUsage === null) return "no part installed";
  if (!part.slot?.serviceIntervalRounds) return `${part.currentUsage} rounds · no interval`;
  const interval = part.slot.serviceIntervalRounds;
  if (part.currentUsage >= interval) return `${part.currentUsage} / ${interval} · ${part.currentUsage - interval} over`;
  return `${part.currentUsage} / ${interval} · ${interval - part.currentUsage} remaining`;
};
