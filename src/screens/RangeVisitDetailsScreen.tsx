import React, { useState, useEffect } from "react";
import {
  View,
  Text,
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
import { RangeVisit } from "../types/rangeVisit";
import { Firearm } from "../types/firearm";
import { api } from "../services/api";
import { Terminal, TerminalText } from "../components/Terminal";

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
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVisit();
    fetchFirearms();
  }, [route.params.id]);

  const fetchVisit = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRangeVisit(route.params.id);
      setVisit(data);
    } catch (error) {
      console.error("Error fetching range visit:", error);
      setError("Failed to load range visit details");
    } finally {
      setLoading(false);
    }
  };

  const fetchFirearms = async () => {
    try {
      const data = await api.getFirearms();
      setFirearms(data);
    } catch (error) {
      console.error("Error fetching firearms:", error);
    }
  };

  const handleDelete = async () => {
    if (!visit) return;

    Alert.alert(
      "Delete Range Visit",
      "Are you sure you want to delete this range visit? This action cannot be undone.",
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
              await api.deleteRangeVisit(visit.id);
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting range visit:", error);
              Alert.alert(
                "Error",
                "Failed to delete range visit. Please try again."
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

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <TerminalText className="text-terminal-error text-lg">
          {error}
        </TerminalText>
      </View>
    );
  }

  if (!visit) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <TerminalText className="text-lg">NO DATA AVAILABLE</TerminalText>
      </View>
    );
  }

  const getFirearmDetails = (id: string) => {
    return firearms.find((f) => f.id === id);
  };

  return (
    <ScrollView className="flex-1 bg-terminal-bg">
      <View className="p-4">
        <Terminal title="RANGE VISIT DETAILS">
          <View className="mb-4">
            <TerminalText className="text-2xl mb-4">
              {visit.location}
            </TerminalText>

            <View className="flex-row justify-between mb-2">
              <TerminalText className="text-terminal-dim">DATE:</TerminalText>
              <TerminalText>
                {new Date(visit.date).toLocaleDateString()}
              </TerminalText>
            </View>

            <View className="flex-row justify-between mb-2">
              <TerminalText className="text-terminal-dim">
                ROUNDS FIRED:
              </TerminalText>
              <TerminalText>{visit.roundsFired}</TerminalText>
            </View>

            {visit.notes && (
              <View className="mb-4">
                <TerminalText className="text-terminal-dim mb-2">
                  NOTES:
                </TerminalText>
                <TerminalText>{visit.notes}</TerminalText>
              </View>
            )}
          </View>

          <View className="mb-4">
            <TerminalText className="text-lg mb-2">FIREARMS USED</TerminalText>
            {visit.firearmsUsed.map((firearmId) => {
              const firearm = getFirearmDetails(firearmId);
              return (
                <View
                  key={firearmId}
                  className="border border-terminal-border p-2 mb-2"
                >
                  <TerminalText>
                    {firearm
                      ? `${firearm.modelName} (${firearm.caliber})`
                      : "Unknown Firearm"}
                  </TerminalText>
                </View>
              );
            })}
          </View>

          <View className="mb-4">
            <TerminalText className="text-lg mb-2">PHOTOS</TerminalText>
            <View className="flex-row flex-wrap">
              {visit.photos.length > 0 ? (
                visit.photos.map((photo, index) => (
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
                navigation.navigate("EditRangeVisit", { id: visit.id })
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
