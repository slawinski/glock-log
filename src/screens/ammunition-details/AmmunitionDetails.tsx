import React, { useState, useEffect, useCallback } from "react";
import { View, Alert, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../app/App";
import { AmmunitionStorage } from "../../validation/storageSchemas";
import { storage } from "../../services/storage-new";
import { TerminalText, BottomButtonGroup } from "../../components";
import { logAndGetUserError } from "../../services/error-handler";

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

  const fetchAmmunition = useCallback(async () => {
    try {
      setLoading(true);
      const ammunitionList = await storage.getAmmunition();
      const foundAmmunition = ammunitionList.find(
        (a) => a.id === route.params!.id
      );
      if (foundAmmunition) {
        setAmmunition(foundAmmunition);
      } else {
        setError("Ammunition not found");
      }
    } catch (error) {
      const userMessage = logAndGetUserError(
        error,
        "AmmunitionDetails.fetchAmmunition",
        "Failed to load ammunition details. Please try again."
      );
      setError(userMessage);
    } finally {
      setLoading(false);
    }
  }, [route.params?.id]);

  useEffect(() => {
    fetchAmmunition();
  }, [fetchAmmunition]);

  const handleDelete = async () => {
    if (!ammunition) return;

    Alert.alert(
      "Delete Ammunition",
      "Are you sure you want to delete this ammunition? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await storage.deleteAmmunition(ammunition.id);
              navigation.goBack();
            } catch (error) {
              const userMessage = logAndGetUserError(
                error,
                "AmmunitionDetails.handleDelete",
                "Failed to delete ammunition. Please try again."
              );
              Alert.alert("Error", userMessage);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <ActivityIndicator size="large" color="#00ff00" />
        <TerminalText className="mt-4">LOADING DATABASE...</TerminalText>
      </View>
    );
  }

  if (error || !ammunition) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <TerminalText className="text-terminal-error text-lg">
          {error || "ENTRY NOT FOUND"}
        </TerminalText>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          <View className="mb-4">
            <View className="flex-row">
              <TerminalText className="text-lg">BRAND: </TerminalText>
              <TerminalText className="text-lg">{ammunition.brand}</TerminalText>
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
            <TerminalText>${ammunition.amountPaid.toFixed(2)}</TerminalText>
          </View>

          {ammunition.pricePerRound && (
            <View className="mb-4 flex-row">
              <TerminalText>PRICE PER ROUND: </TerminalText>
              <TerminalText>${ammunition.pricePerRound.toFixed(2)}</TerminalText>
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
                onPress: () => navigation.navigate("EditAmmunition", { id: ammunition.id }),
              },
              {
                caption: "DELETE",
                onPress: handleDelete,
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
}
