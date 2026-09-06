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
} from "../../validation/storageSchemas";
import { formatCurrency, formatDate } from "../../utils";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>("USD");

  const fetchFirearm = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [firearms, visits, currentCurrency] = await Promise.all([
        storage.getFirearms(),
        storage.getRangeVisits(),
        storage.getCurrency(),
      ]);
      const foundFirearm = firearms.find((f) => f.id === route.params.id);
      if (foundFirearm) {
        setFirearm(foundFirearm);
      } else {
        setError("Firearm not found");
      }
      setRangeVisits(visits);
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
      await storage.deleteFirearm(firearm.id);
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

          {firearm.photos && firearm.photos.length > 0 && (
            <View className="mb-6">
              <ImageGallery
                images={firearm.photos}
                size="large"
                showDeleteButton={false}
              />
            </View>
          )}

          <MetricHero
            value={firearm.roundsFired.toLocaleString("en-US")}
            label="rounds fired"
            className="mb-6"
          />

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
