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
import {
  AmmunitionStorage,
  RangeVisitStorage,
} from "../../validation/storageSchemas";
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
import { handleError } from "../../services/error-handler";
import { formatCurrency, formatDate } from "../../utils";
import { useDeleteEntity } from "../../hooks";

type AmmunitionDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AmmunitionDetails"
>;

type AmmunitionDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "AmmunitionDetails"
>;

type AmmunitionUsage = {
  id: string;
  date: string;
  location: string;
  rounds: number;
};

export const AmmunitionDetails = () => {
  const navigation = useNavigation<AmmunitionDetailsScreenNavigationProp>();
  const route = useRoute<AmmunitionDetailsScreenRouteProp>();
  const [ammunition, setAmmunition] = useState<AmmunitionStorage | null>(null);
  const [rangeVisits, setRangeVisits] = useState<RangeVisitStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>("USD");

  const fetchAmmunition = useCallback(async () => {
    try {
      setLoading(true);
      const [ammunitionList, visits, currentCurrency] = await Promise.all([
        storage.getAmmunition(),
        storage.getRangeVisits(),
        storage.getCurrency(),
      ]);
      const foundAmmunition = ammunitionList.find(
        (a) => a.id === route.params!.id
      );
      if (foundAmmunition) {
        setAmmunition(foundAmmunition);
      } else {
        setError("Ammunition not found");
      }
      setRangeVisits(visits);
      setCurrency(currentCurrency);
    } catch (error) {
      handleError(error, "AmmunitionDetails.fetchAmmunition", { isUserFacing: true, userMessage: "Failed to load ammunition details. Please try again." });
      setError("Failed to load ammunition details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [route.params]);

  useFocusEffect(
    useCallback(() => {
      fetchAmmunition();
    }, [fetchAmmunition])
  );

  const { confirmDelete } = useDeleteEntity(
    async () => {
      if (!ammunition) return;
      await storage.deleteAmmunition(ammunition.id);
    },
    {
      label: "Ammunition",
      errorContext: "AmmunitionDetails.handleDelete",
      errorUserMessage: "Failed to delete ammunition. Please try again.",
    },
    () => navigation.goBack()
  );

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !ammunition) {
    return (
      <ErrorDisplay
        errorMessage={error || "ENTRY NOT FOUND"}
        onRetry={fetchAmmunition}
      />
    );
  }

  const usageEntries: AmmunitionUsage[] = rangeVisits
    .map((visit) => {
      const rounds = Object.values(visit.ammunitionUsed ?? {}).reduce(
        (sum, usage) =>
          usage.ammunitionId === ammunition.id ? sum + usage.rounds : sum,
        0
      );
      return {
        id: visit.id,
        date: visit.date,
        location: visit.location,
        rounds,
      };
    })
    .filter((entry) => entry.rounds > 0)
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

  const usedRounds = usageEntries.reduce((sum, entry) => sum + entry.rounds, 0);
  const initialQuantity = ammunition.quantity + usedRounds;
  const recentUsage = usageEntries.slice(0, 5);
  const isDepleted = ammunition.quantity === 0;

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-4 pb-8">
          <TerminalText className="text-2xl">{ammunition.brand}</TerminalText>
          <TerminalText className="text-terminal-muted text-lg mb-4">
            {ammunition.caliber} • {ammunition.grain}
          </TerminalText>

          {ammunition.photos && ammunition.photos.length > 0 && (
            <View className="mb-6">
              <ImageGallery
                images={ammunition.photos}
                size="large"
                showDeleteButton={false}
              />
            </View>
          )}

          <MetricHero
            value={ammunition.quantity.toLocaleString("en-US")}
            label="rounds remaining"
            className="mb-6"
          />

          <DetailSection title="INVENTORY">
            <DetailRow label="Initial quantity" value={String(initialQuantity)} />
            <DetailRow
              label="Remaining"
              value={String(ammunition.quantity)}
            />
            <DetailRow label="Used" value={String(usedRounds)} />
            {isDepleted && <DetailRow label="Status" value="Depleted" />}
          </DetailSection>

          <DetailSection title="PURCHASE">
            <DetailRow
              label="Total paid"
              value={formatCurrency(ammunition.amountPaid, currency)}
            />
            {ammunition.pricePerRound !== undefined && (
              <DetailRow
                label="Price / round"
                value={formatCurrency(ammunition.pricePerRound, currency)}
              />
            )}
            <DetailRow
              label="Purchase date"
              value={formatDate(ammunition.datePurchased, "dd MMM yyyy")}
            />
          </DetailSection>

          {recentUsage.length > 0 && (
            <DetailSection title="USAGE">
              {recentUsage.map((entry) => (
                <View key={entry.id}>
                  <DetailRow
                    label={formatDate(entry.date, "dd MMM yyyy")}
                    value={`${entry.rounds} rounds`}
                  />
                  <TerminalText className="text-terminal-muted text-sm mb-2">
                    {entry.location}
                  </TerminalText>
                </View>
              ))}
            </DetailSection>
          )}

          <View className="mb-6">
            <TerminalButton
              caption="Edit ammunition"
              variant="primary"
              onPress={() =>
                navigation.navigate("EditAmmunition", { id: ammunition.id })
              }
            />
          </View>

          <DetailSection title="DANGER ZONE">
            <TerminalButton
              caption="Delete ammunition"
              variant="destructive"
              onPress={confirmDelete}
            />
          </DetailSection>
        </View>
      </ScrollView>
    </View>
  );
};
