import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { RangeVisit, Firearm } from "../services/storage";
import { storage } from "../services/storage";
import { TerminalText } from "../components/Terminal";

type RangeVisitDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "RangeVisitDetails"
>;

type RangeVisitDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "RangeVisitDetails"
>;

export default function RangeVisitDetailsScreen() {
  const navigation = useNavigation<RangeVisitDetailsScreenNavigationProp>();
  const route = useRoute<RangeVisitDetailsScreenRouteProp>();
  const [visit, setVisit] = useState<RangeVisit | null>(null);
  const [firearms, setFirearms] = useState<Record<string, Firearm>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVisit();
  }, [route.params?.id]);

  const fetchVisit = async () => {
    try {
      setLoading(true);
      const visits = await storage.getRangeVisits();
      const foundVisit = visits.find((v) => v.id === route.params!.id);
      if (!foundVisit) {
        setError("Range visit not found");
        return;
      }
      setVisit(foundVisit);

      // Fetch details for each firearm used
      const firearmDetails: Record<string, Firearm> = {};
      const allFirearms = await storage.getFirearms();
      for (const firearmId of Object.keys(foundVisit.roundsPerFirearm)) {
        const firearm = allFirearms.find((f) => f.id === firearmId);
        if (firearm) {
          firearmDetails[firearmId] = firearm;
        }
      }
      setFirearms(firearmDetails);
    } catch (error) {
      console.error("Error fetching range visit:", error);
      setError("Failed to load range visit data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this range visit?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await storage.deleteRangeVisit(route.params.id);
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting range visit:", error);
              Alert.alert("Error", "Failed to delete range visit");
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

  if (error || !visit) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <TerminalText className="text-terminal-error text-lg">
          {error || "Failed to load range visit"}
        </TerminalText>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-terminal-bg p-4">
      <TerminalText className="text-2xl mb-6">RANGE VISIT DETAILS</TerminalText>

      <View className="mb-4">
        <TerminalText className="text-lg mb-2">LOCATION</TerminalText>
        <TerminalText className="text-terminal-dim">
          {visit.location}
        </TerminalText>
      </View>

      <View className="mb-4">
        <TerminalText className="text-lg mb-2">DATE</TerminalText>
        <TerminalText className="text-terminal-dim">
          {new Date(visit.date).toLocaleDateString()}
        </TerminalText>
      </View>

      <View className="mb-4">
        <TerminalText className="text-lg mb-2">FIREARMS USED</TerminalText>
        {Object.entries(visit.roundsPerFirearm).map(
          ([firearmId, roundsFired]) => {
            const firearm = firearms[firearmId];
            return (
              <View key={firearmId} className="mb-2">
                <TerminalText>
                  {firearm?.modelName} ({firearm?.caliber})
                </TerminalText>
                <TerminalText className="text-terminal-dim">
                  Rounds Fired: {roundsFired}
                </TerminalText>
              </View>
            );
          }
        )}
        <View className="mt-4">
          <TerminalText className="text-lg">
            TOTAL ROUNDS FIRED:{" "}
            {Object.values(visit.roundsPerFirearm).reduce(
              (total, rounds) => total + rounds,
              0
            )}
          </TerminalText>
        </View>
      </View>

      {visit.notes && (
        <View className="mb-4">
          <TerminalText className="text-lg mb-2">NOTES</TerminalText>
          <TerminalText className="text-terminal-dim">
            {visit.notes}
          </TerminalText>
        </View>
      )}

      {visit.notes && (
        <View className="mb-4">
          <TerminalText className="text-lg mb-2">PHOTOS</TerminalText>
          <ScrollView horizontal className="flex-row">
            {visit.notes.split("\n").map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                className="w-40 h-40 m-1"
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View className="flex-row justify-between mb-4">
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("EditRangeVisit", { id: visit.id })
          }
          className="border border-terminal-border p-3 flex-1 mr-2"
        >
          <TerminalText>EDIT</TerminalText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          className="border border-terminal-border p-3 flex-1 ml-2"
        >
          <TerminalText className="text-terminal-error">DELETE</TerminalText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
