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
import { Firearm } from "../services/storage";
import { storage } from "../services/storage";
import { Terminal, TerminalText, TerminalInput } from "../components/Terminal";
import FirearmImage from "../components/FirearmImage";

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
      const firearms = await storage.getFirearms();
      const foundFirearm = firearms.find((f) => f.id === route.params.id);
      if (foundFirearm) {
        setFirearm(foundFirearm);
      } else {
        setError("Firearm not found");
      }
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
              await storage.deleteFirearm(firearm.id);
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
      <View className="items-center p-4">
        <FirearmImage size={300} className="mb-8" />
      </View>

      <View className="px-4">
        <View className="mb-4">
          <TerminalText className="text-lg">{firearm.modelName}</TerminalText>
          <TerminalText className="text-terminal-dim">
            {firearm.caliber}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText>ROUNDS FIRED</TerminalText>
          <TerminalText className="text-terminal-dim">
            {firearm.roundsFired} rounds
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText>DATE PURCHASED</TerminalText>
          <TerminalText className="text-terminal-dim">
            {new Date(firearm.purchaseDate).toLocaleDateString()}
          </TerminalText>
        </View>

        {firearm.notes && (
          <View className="mb-4">
            <TerminalText className="text-lg mb-2">PHOTOS</TerminalText>
            <ScrollView horizontal className="flex-row">
              {firearm.notes.split("\n").map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  className="w-32 h-32 m-1 border border-terminal-border"
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View className="flex-row justify-between mt-4">
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("EditFirearm", { id: firearm.id })
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
    </ScrollView>
  );
}
