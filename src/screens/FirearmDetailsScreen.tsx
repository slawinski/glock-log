import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { format } from "date-fns";
import { api } from "../services/api";
import { Firearm } from "../types/firearm";
import { Terminal, TerminalText, TerminalInput } from "../components/Terminal";

type FirearmDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "FirearmDetails"
>;
type FirearmDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "FirearmDetails"
>;

export default function FirearmDetailsScreen() {
  const navigation = useNavigation<FirearmDetailsScreenNavigationProp>();
  const route = useRoute<FirearmDetailsScreenRouteProp>();
  const [firearm, setFirearm] = useState<Firearm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFirearm();
  }, [route.params.id]);

  const fetchFirearm = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getFirearm(route.params.id);
      setFirearm(data);
    } catch (error) {
      console.error("Error fetching firearm:", error);
      setError("Failed to load firearm details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!firearm) return;

    Alert.alert(
      "Delete Firearm",
      "Are you sure you want to delete this firearm? This action cannot be undone.",
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
              await api.deleteFirearm(firearm.id);
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting firearm:", error);
              Alert.alert(
                "Error",
                "Failed to delete firearm. Please try again."
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

  if (error || !firearm) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <TerminalText className="text-terminal-error text-lg">
          {error || "ENTRY NOT FOUND"}
        </TerminalText>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-terminal-bg">
      <View className="p-4">
        <Terminal title="DATABASE ENTRY">
          <View className="mb-4">
            <TerminalText className="text-2xl mb-2">
              {firearm.modelName}
            </TerminalText>
            <TerminalText className="text-lg text-terminal-dim mb-4">
              {firearm.caliber}
            </TerminalText>

            <View className="mb-4">
              <TerminalText className="text-lg mb-2">
                PURCHASE DETAILS
              </TerminalText>
              <View className="flex-row justify-between mb-2">
                <TerminalText className="text-terminal-dim">
                  Amount Paid:
                </TerminalText>
                <TerminalText>${firearm.amountPaid.toFixed(2)}</TerminalText>
              </View>
              <View className="flex-row justify-between">
                <TerminalText className="text-terminal-dim">
                  Date Purchased:
                </TerminalText>
                <TerminalText>
                  {new Date(firearm.datePurchased).toLocaleDateString()}
                </TerminalText>
              </View>
            </View>
          </View>

          <View className="mb-4">
            <TerminalText className="text-lg mb-2">PHOTOS</TerminalText>
            <View className="flex-row flex-wrap">
              {firearm.photos.length > 0 ? (
                firearm.photos.map((photo, index) => (
                  <Image
                    key={index}
                    source={{ uri: photo }}
                    className="w-32 h-32 m-1 border border-terminal-border"
                  />
                ))
              ) : (
                <TerminalText className="text-terminal-dim">
                  NO PHOTOS AVAILABLE
                </TerminalText>
              )}
            </View>
          </View>

          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("EditFirearm", { id: firearm.id })
              }
              className="border border-terminal-border p-4 flex-1 mr-2"
            >
              <TerminalText>EDIT</TerminalText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              className="border border-terminal-error p-4 flex-1 ml-2"
            >
              <TerminalText className="text-terminal-error">
                DELETE
              </TerminalText>
            </TouchableOpacity>
          </View>
        </Terminal>
      </View>
    </ScrollView>
  );
}
