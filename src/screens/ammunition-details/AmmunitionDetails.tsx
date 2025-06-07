import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../app/App";
import { TerminalText } from "../../components/TerminalText";
import { AmmunitionStorage } from "../../validation/storageSchemas";
import { storage } from "../../services/storage";

type AmmunitionDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AmmunitionDetails"
>;

type AmmunitionDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "AmmunitionDetails"
>;

export default function AmmunitionDetailsScreen() {
  const navigation = useNavigation<AmmunitionDetailsScreenNavigationProp>();
  const route = useRoute<AmmunitionDetailsScreenRouteProp>();
  const [ammunition, setAmmunition] = useState<AmmunitionStorage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAmmunition();
  }, [route.params?.id]);

  const fetchAmmunition = async () => {
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
      console.error("Error fetching ammunition:", error);
      setError("Failed to load ammunition details");
    } finally {
      setLoading(false);
    }
  };

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
              console.error("Error deleting ammunition:", error);
              Alert.alert(
                "Error",
                "Failed to delete ammunition. Please try again."
              );
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
    <View className="flex-1 bg-terminal-bg p-4">
      <View className="mb-4">
        <TerminalText className="text-lg">{ammunition.brand}</TerminalText>
        <TerminalText className="text-terminal-dim">
          {ammunition.caliber} - {ammunition.grain}gr
        </TerminalText>
      </View>

      <View className="mb-4">
        <TerminalText>QUANTITY</TerminalText>
        <TerminalText className="text-terminal-dim">
          {ammunition.quantity} rounds
        </TerminalText>
      </View>

      <View className="mb-4">
        <TerminalText>AMOUNT PAID</TerminalText>
        <TerminalText className="text-terminal-dim">
          ${ammunition.amountPaid.toFixed(2)}
        </TerminalText>
      </View>

      <View className="mb-4">
        <TerminalText>DATE PURCHASED</TerminalText>
        <TerminalText className="text-terminal-dim">
          {new Date(ammunition.datePurchased).toLocaleDateString()}
        </TerminalText>
      </View>

      {ammunition.notes && (
        <View className="mb-4">
          <TerminalText>NOTES</TerminalText>
          <TerminalText className="text-terminal-dim">
            {ammunition.notes}
          </TerminalText>
        </View>
      )}

      <View className="flex-row justify-between mt-4">
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("EditAmmunition", { id: ammunition.id })
          }
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>EDIT</TerminalText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>DELETE</TerminalText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>BACK</TerminalText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
