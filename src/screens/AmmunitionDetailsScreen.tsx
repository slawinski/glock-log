import React, { useState, useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { Terminal, TerminalText } from "../components/Terminal";
import { api } from "../services/api";
import { Ammunition } from "../types/ammunition";

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
  const [ammunition, setAmmunition] = useState<Ammunition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAmmunition();
  }, []);

  const fetchAmmunition = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAmmunition();
      const foundAmmunition = data.find((item) => item.id === route.params.id);
      if (foundAmmunition) {
        setAmmunition(foundAmmunition);
      } else {
        setError("Ammunition not found");
      }
    } catch (error) {
      console.error("Error fetching ammunition:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch ammunition"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-terminal-bg p-4 justify-center items-center">
        <TerminalText>LOADING...</TerminalText>
      </View>
    );
  }

  if (error || !ammunition) {
    return (
      <View className="flex-1 bg-terminal-bg p-4 justify-center items-center">
        <TerminalText className="text-terminal-error mb-4">
          {error || "Ammunition not found"}
        </TerminalText>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>GO BACK</TerminalText>
        </TouchableOpacity>
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
        <TerminalText>DATE PURCHASED</TerminalText>
        <TerminalText className="text-terminal-dim">
          {new Date(ammunition.datePurchased).toLocaleDateString()}
        </TerminalText>
      </View>

      <View className="mb-4">
        <TerminalText>AMOUNT PAID</TerminalText>
        <TerminalText className="text-terminal-dim">
          ${ammunition.amountPaid.toFixed(2)}
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
          onPress={() => navigation.goBack()}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>BACK</TerminalText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
