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
import { calculateCleaningTimeline } from "../../services/cleaning-calculation";
import {
  DetailRow,
  DetailSection,
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
import { useDeleteEntity } from "../../hooks";

type CleaningEventDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CleaningEventDetails"
>;
type CleaningEventDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "CleaningEventDetails"
>;

export const CleaningEventDetails = () => {
  const navigation = useNavigation<CleaningEventDetailsScreenNavigationProp>();
  const route = useRoute<CleaningEventDetailsScreenRouteProp>();
  const [event, setEvent] = useState<CleaningEvent | null>(null);
  const [firearm, setFirearm] = useState<FirearmStorage | null>(null);
  const [stats, setStats] = useState<{
    roundsSince: number;
    mileageAtEvent: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [firearms, events, visits] = await Promise.all([
        storage.getFirearms(),
        storage.getCleaningEvents(route.params.firearmId),
        storage.getRangeVisits(),
      ]);
      const found = events.find((e) => e.id === route.params.id);
      if (!found) {
        setError("Cleaning event not found");
        return;
      }
      setEvent(found);
      setFirearm(firearms.find((f) => f.id === found.firearmId) ?? null);

      const timeline = calculateCleaningTimeline(
        events,
        visits,
        found.firearmId
      );
      const stat = timeline.find((s) => s.event.id === found.id);
      if (stat) {
        setStats({
          roundsSince:
            found.type === "complete_disassembly"
              ? stat.roundsSincePreviousComplete
              : stat.roundsSincePreviousFieldStrip,
          mileageAtEvent: stat.mileageAtEvent,
        });
      }
    } catch (e) {
      handleError(e, "CleaningEventDetails.fetch", { isUserFacing: true, userMessage: "Failed to load cleaning event." });
      setError("Failed to load cleaning event.");
    } finally {
      setLoading(false);
    }
  }, [route.params]);

  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [fetch])
  );

  const { confirmDelete } = useDeleteEntity(
    async () => {
      await storage.deleteCleaningEvent(route.params.id);
    },
    {
      label: "Cleaning Event",
      confirmTitle: "DELETE CLEANING EVENT?",
      confirmMessage:
        "Removing this event may change the firearm's cleaning interval status.",
      errorContext: "CleaningEventDetails.handleDelete",
      errorUserMessage: "Failed to delete cleaning event.",
    },
    () => navigation.goBack()
  );

  if (loading) return <LoadingScreen />;
  if (error || !event) {
    return <ErrorDisplay errorMessage={error || "Cleaning event not found"} onRetry={fetch} />;
  }

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-4 pb-8">
          <TerminalText className="text-2xl mb-1">
            {CLEANING_TYPE_LABELS[event.type].toUpperCase()}
          </TerminalText>
          <TerminalText className="text-terminal-muted text-lg mb-4">
            {firearm?.modelName ?? ""}
          </TerminalText>

          <DetailSection title="DETAILS">
            <DetailRow
              label="Date"
              value={formatDate(event.performedAt, "dd MMM yyyy")}
            />
            {stats && (
              <>
                <DetailRow
                  label={
                    event.type === "complete_disassembly"
                      ? "Rounds since previous complete cleaning"
                      : "Rounds since previous field-strip cleaning"
                  }
                  value={`${stats.roundsSince}`}
                />
                <DetailRow
                  label="Firearm mileage at event"
                  value={`${stats.mileageAtEvent} rounds`}
                />
              </>
            )}
          </DetailSection>

          {event.notes ? (
            <DetailSection title="NOTES">
              <TerminalText className="flex-shrink">{event.notes}</TerminalText>
            </DetailSection>
          ) : null}

          <View className="mb-6">
            <TerminalButton
              caption="Edit"
              variant="primary"
              onPress={() =>
                navigation.navigate("LogCleaning", {
                  firearmId: route.params.firearmId,
                  eventId: event.id,
                })
              }
            />
          </View>

          <DetailSection title="DANGER ZONE">
            <TerminalButton
              caption="Delete cleaning event"
              variant="destructive"
              onPress={confirmDelete}
            />
          </DetailSection>
        </View>
      </ScrollView>
    </View>
  );
};
