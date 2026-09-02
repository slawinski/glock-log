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
import { AmmunitionStorage } from "../../validation/storageSchemas";
import { storage } from "../../services/storage-new";
import { BottomButtonGroup, ErrorDisplay, LoadingScreen, TerminalText } from "../../components";
import { handleError } from "../../services/error-handler";
import { formatCurrency } from "../../utils";
import { useDeleteEntity } from "../../hooks";

type AmmunitionDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AmmunitionDetails"
>;

type AmmunitionDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "AmmunitionDetails"
>;

export const AmmunitionDetails = () => {
  const navigation = useNavigation<AmmunitionDetailsScreenNavigationProp>();
  const route = useRoute<AmmunitionDetailsScreenRouteProp>();
  const [ammunition, setAmmunition] = useState<AmmunitionStorage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>("USD");

  const fetchAmmunition = useCallback(async () => {
    try {
      setLoading(true);
      const [ammunitionList, currentCurrency] = await Promise.all([
        storage.getAmmunition(),
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

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          <View className="mb-4">
            <View className="flex-row">
              <TerminalText className="text-lg">BRAND: </TerminalText>
              <TerminalText className="text-lg">
                {ammunition.brand}
              </TerminalText>
            </View>
            <View className="flex-row">
              <TerminalText>DETAILS: </TerminalText>
              <TerminalText>
                {ammunition.caliber} - {ammunition.grain}gr
              </TerminalText>
            </View>
          </View>

          <View className="mb-4 flex-row">
            <TerminalText>QUANTITY: </TerminalText>
            <TerminalText>{ammunition.quantity} rounds</TerminalText>
          </View>

          <View className="mb-4 flex-row">
            <TerminalText>AMOUNT PAID: </TerminalText>
            <TerminalText>
              {formatCurrency(ammunition.amountPaid, currency)}
            </TerminalText>
          </View>

          {ammunition.pricePerRound && (
            <View className="mb-4 flex-row">
              <TerminalText>PRICE PER ROUND: </TerminalText>
              <TerminalText>
                {formatCurrency(ammunition.pricePerRound, currency)}
              </TerminalText>
            </View>
          )}

          <View className="mb-4 flex-row">
            <TerminalText>DATE PURCHASED: </TerminalText>
            <TerminalText>
              {new Date(ammunition.datePurchased).toLocaleDateString()}
            </TerminalText>
          </View>

          {ammunition.notes && (
            <View className="mb-4 flex-row">
              <TerminalText>NOTES: </TerminalText>
              <TerminalText className="flex-shrink">
                {ammunition.notes}
              </TerminalText>
            </View>
          )}

          <View className="flex-1" />

          <BottomButtonGroup
            className="mt-4"
            buttons={[
              {
                caption: "EDIT",
                onPress: () =>
                  navigation.navigate("EditAmmunition", { id: ammunition.id }),
              },
              {
                caption: "DELETE",
                onPress: confirmDelete,
              },
              {
                caption: "BACK",
                onPress: () => navigation.goBack(),
              },
            ]}
          />
        </View>
      </ScrollView>
    </View>
  );
};
