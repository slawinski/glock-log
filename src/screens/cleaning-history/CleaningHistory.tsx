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
import { calculateCleaningTimeline } from "../../services/cleaning-calculation";
import {
  DetailSection,
  EmptyState,
  ErrorDisplay,
  LoadingScreen,
  TerminalButton,
  TerminalText,
} from "../../components";
import {
  CleaningEvent,
  FirearmStorage,
  RangeVisitStorage,
} from "../../validation/storageSchemas";
import { formatDate, CLEANING_TYPE_LABELS } from "../../utils";

type CleaningHistoryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CleaningHistory"
>;
type CleaningHistoryScreenRouteProp = RouteProp<
  RootStackParamList,
  "CleaningHistory"
>;

export const CleaningHistory = () => {
  const navigation = useNavigation<CleaningHistoryScreenNavigationProp>();
  const route = useRoute<CleaningHistoryScreenRouteProp>();
  const [firearm, setFirearm] = useState<FirearmStorage | null>(null);
  const [events, setEvents] = useState<CleaningEvent[]>([]);
  const [visits, setVisits] = useState<RangeVisitStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [firearms, cleaningEvents, rangeVisits] = await Promise.all([
        storage.getFirearms(),
        storage.getCleaningEvents(route.params.firearmId),
        storage.getRangeVisits(),
      ]);
      setFirearm(firearms.find((f) => f.id === route.params.firearmId) ?? null);
      setEvents(cleaningEvents);
      setVisits(rangeVisits);
    } catch (e) {
      handleError(e, "CleaningHistory.fetch", { isUserFacing: true, userMessage: "Failed to load cleaning history." });
      setError("Failed to load cleaning history.");
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

  const timeline = calculateCleaningTimeline(events, visits, route.params.firearmId);
  const statsByEventId = new Map(
    timeline.map((s) => [s.event.id, s])
  );

  const sortedEvents = [...events].sort(
    (a, b) =>
      new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
  );

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-4 pb-8">
          <TerminalText className="text-2xl mb-1">
            {firearm?.modelName ?? "CLEANING HISTORY"}
          </TerminalText>
          <TerminalText className="text-terminal-muted text-lg mb-4">
            CLEANING HISTORY
          </TerminalText>

          {sortedEvents.length === 0 ? (
            <EmptyState
              title="NO CLEANING HISTORY"
              message="Cleaning events for this firearm will appear here."
              primaryAction={{
                caption: "Log cleaning",
                onPress: () =>
                  navigation.navigate("LogCleaning", {
                    firearmId: route.params.firearmId,
                  }),
              }}
              secondaryAction={{
                caption: "Intervals",
                onPress: () =>
                  navigation.navigate("CleaningSettings", {
                    firearmId: route.params.firearmId,
                  }),
              }}
            />
          ) : (
            <DetailSection title={`${sortedEvents.length} EVENT${sortedEvents.length === 1 ? "" : "S"}`}>
              {sortedEvents.map((event) => {
                const stat = statsByEventId.get(event.id);
                const roundsSince =
                  event.type === "complete_disassembly"
                    ? stat?.roundsSincePreviousComplete
                    : stat?.roundsSincePreviousFieldStrip;
                return (
                  <Pressable
                    key={event.id}
                    onPress={() =>
                      navigation.navigate("CleaningEventDetails", {
                        id: event.id,
                        firearmId: route.params.firearmId,
                      })
                    }
                    className="py-3 border-b border-terminal-border/30"
                    accessibilityRole="button"
                    accessibilityLabel={`${CLEANING_TYPE_LABELS[event.type]} on ${formatDate(event.performedAt)}`}
                    testID={`cleaning-history-item-${event.id}`}
                  >
                    <TerminalText>{formatDate(event.performedAt, "dd MMM yyyy")}</TerminalText>
                    <TerminalText className="text-terminal-muted">
                      {CLEANING_TYPE_LABELS[event.type].toUpperCase()}
                      {typeof roundsSince === "number"
                        ? ` · ${roundsSince} rounds since previous qualifying cleaning`
                        : ""}
                    </TerminalText>
                  </Pressable>
                );
              })}
            </DetailSection>
          )}

          <View className="flex-row flex-wrap">
            <TerminalButton
              caption="Log cleaning"
              variant="primary"
              className="mr-2 mb-2"
              onPress={() =>
                navigation.navigate("LogCleaning", {
                  firearmId: route.params.firearmId,
                })
              }
            />
            <TerminalButton
              caption="Intervals"
              className="mb-2"
              onPress={() =>
                navigation.navigate("CleaningSettings", {
                  firearmId: route.params.firearmId,
                })
              }
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
