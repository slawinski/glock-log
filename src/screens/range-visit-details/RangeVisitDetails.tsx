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
import {
  DetailRow,
  DetailSection,
  ErrorDisplay,
  ImageGallery,
  LoadingScreen,
  MetricHero,
  TerminalButton,
  TerminalText,
} from "../../components";
import {
  FirearmStorage,
  RangeVisitStorage,
  AmmunitionStorage,
} from "../../validation/storageSchemas";
import { formatDate } from "../../utils";
import { useDeleteEntity } from "../../hooks";

type RangeVisitDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "RangeVisitDetails"
>;

type RangeVisitDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "RangeVisitDetails"
>;

export const RangeVisitDetails = () => {
  const navigation = useNavigation<RangeVisitDetailsScreenNavigationProp>();
  const route = useRoute<RangeVisitDetailsScreenRouteProp>();
  const [visit, setVisit] = useState<RangeVisitStorage | null>(null);
  const [firearms, setFirearms] = useState<Record<string, FirearmStorage>>({});
  const [ammunition, setAmmunition] = useState<
    Record<string, AmmunitionStorage>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisit = useCallback(async () => {
    try {
      setLoading(true);
      const visits = await storage.getRangeVisits();
      const foundVisit = visits.find((v) => v.id === route.params!.id);
      if (!foundVisit) {
        setError("Range visit not found");
        return;
      }
      setVisit(foundVisit);

      const [allFirearms, allAmmunition] = await Promise.all([
        storage.getFirearms(),
        storage.getAmmunition(),
      ]);

      const firearmDetails: Record<string, FirearmStorage> = {};
      const ammunitionDetails: Record<string, AmmunitionStorage> = {};

      for (const firearmId of foundVisit.firearmsUsed) {
        const firearm = allFirearms.find((f) => f.id === firearmId);
        if (firearm) {
          firearmDetails[firearmId] = firearm;
        }
      }

      if (foundVisit.ammunitionUsed) {
        for (const usage of Object.values(foundVisit.ammunitionUsed)) {
          const ammo = allAmmunition.find((a) => a.id === usage.ammunitionId);
          if (ammo) {
            ammunitionDetails[usage.ammunitionId] = ammo;
          }
        }
      }

      setFirearms(firearmDetails);
      setAmmunition(ammunitionDetails);
    } catch (error) {
      handleError(error, "RangeVisitDetails.fetchVisit", { isUserFacing: true, userMessage: "Failed to load range visit data." });
      setError("Failed to load range visit data.");
    } finally {
      setLoading(false);
    }
  }, [route.params]);

  useFocusEffect(
    useCallback(() => {
      fetchVisit();
    }, [fetchVisit])
  );

  const { confirmDelete } = useDeleteEntity(
    async () => {
      await storage.deleteRangeVisit(route.params.id);
    },
    {
      label: "Range Visit",
      confirmTitle: "Confirm Delete",
      confirmMessage: "Are you sure you want to delete this range visit?",
      errorContext: "RangeVisitDetails.handleDelete",
      errorUserMessage: "Failed to delete range visit.",
    },
    () => navigation.goBack()
  );

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !visit) {
    return (
      <ErrorDisplay
        errorMessage={error || "Failed to load range visit"}
        onRetry={fetchVisit}
      />
    );
  }

  const totalRounds = Object.values(visit.ammunitionUsed || {}).reduce(
    (sum, usage) => sum + usage.rounds,
    0
  );

  const ammunitionConsumption: Record<string, number> = {};
  for (const usage of Object.values(visit.ammunitionUsed ?? {})) {
    ammunitionConsumption[usage.ammunitionId] =
      (ammunitionConsumption[usage.ammunitionId] ?? 0) + usage.rounds;
  }

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-4 pb-8">
          <TerminalText className="text-2xl">{visit.location}</TerminalText>
          <TerminalText className="text-terminal-muted text-lg mb-4">
            {formatDate(visit.date, "dd MMM yyyy")}
          </TerminalText>

          <MetricHero
            value={totalRounds.toLocaleString("en-US")}
            label="rounds fired"
            className="mb-6"
          />

          <DetailSection title="FIREARMS">
            {visit.firearmsUsed.map((firearmId) => {
              const firearm = firearms[firearmId];
              const rounds = visit.ammunitionUsed?.[firearmId]?.rounds ?? 0;
              return (
                <DetailRow
                  key={firearmId}
                  label={firearm?.modelName ?? firearmId}
                  value={`${rounds} rounds`}
                />
              );
            })}

            {Object.keys(ammunitionConsumption).length > 0 && (
              <View className="mt-4">
                <TerminalText className="text-terminal-muted text-sm mb-2">
                  AMMUNITION
                </TerminalText>
                {Object.entries(ammunitionConsumption).map(
                  ([ammunitionId, rounds]) => {
                    const ammo = ammunition[ammunitionId];
                    const label = ammo
                      ? `${ammo.brand} ${ammo.caliber} ${ammo.grain}`
                      : ammunitionId;
                    return (
                      <DetailRow
                        key={ammunitionId}
                        label={label}
                        value={`${rounds} rounds consumed`}
                      />
                    );
                  }
                )}
              </View>
            )}
          </DetailSection>

          {visit.photos && visit.photos.length > 0 && (
            <DetailSection title="PHOTOS">
              <ImageGallery
                images={visit.photos}
                size="large"
                showDeleteButton={false}
              />
            </DetailSection>
          )}

          {visit.notes && (
            <DetailSection title="NOTES">
              <TerminalText className="flex-shrink">{visit.notes}</TerminalText>
            </DetailSection>
          )}

          <View className="mb-6">
            <TerminalButton
              caption="Edit visit"
              variant="primary"
              onPress={() =>
                navigation.navigate("EditRangeVisit", { id: visit.id })
              }
            />
          </View>

          <DetailSection title="DANGER ZONE">
            <TerminalButton
              caption="Delete visit"
              variant="destructive"
              onPress={confirmDelete}
            />
          </DetailSection>
        </View>
      </ScrollView>
    </View>
  );
};
