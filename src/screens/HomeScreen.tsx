import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { Firearm } from "../types/firearm";
import { api } from "../services/api";
import { Terminal, TerminalText, TerminalInput } from "../components/Terminal";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

// Mock data for testing
const mockFirearms: Firearm[] = [
  {
    id: "1",
    modelName: "Glock 19",
    caliber: "9mm",
    datePurchased: new Date("2023-01-15"),
    amountPaid: 599.99,
    roundsFired: 500,
    totalRoundsInInventory: 1000,
    photos: [],
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2023-01-15"),
  },
  {
    id: "2",
    modelName: "Glock 17",
    caliber: "9mm",
    datePurchased: new Date("2023-03-20"),
    amountPaid: 549.99,
    roundsFired: 750,
    totalRoundsInInventory: 1500,
    photos: [],
    createdAt: new Date("2023-03-20"),
    updatedAt: new Date("2023-03-20"),
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  // Fetch firearms when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchFirearms();
    }, [])
  );

  const fetchFirearms = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching firearms...");

      const data = await api.getFirearms();
      console.log("Received firearms data:", data);

      if (data.length === 0) {
        // If API returns empty array, show empty state
        setFirearms([]);
      } else {
        setFirearms(data);
      }
    } catch (error) {
      console.error("Error in fetchFirearms:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load firearms"
      );
    } finally {
      setLoading(false);
    }
  };

  const useSampleData = () => {
    setFirearms(mockFirearms);
    setError(null);
  };

  const renderFirearmItem = ({ item }: { item: Firearm }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("FirearmDetails", { id: item.id })}
      className="bg-terminal-bg border border-terminal-border p-4 mb-2"
    >
      <View className="flex-row justify-between items-center">
        <View>
          <TerminalText className="text-lg">{item.modelName}</TerminalText>
          <TerminalText className="text-terminal-dim">
            {item.caliber}
          </TerminalText>
        </View>
        <View className="items-end">
          <TerminalText className="text-terminal-dim">
            Rounds: {item.totalRoundsInInventory}
          </TerminalText>
          <TerminalText className="text-terminal-dim">
            Fired: {item.roundsFired}
          </TerminalText>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-terminal-bg p-4">
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity
          onPress={() => navigation.navigate("Stats")}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>STATS</TerminalText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("AddFirearm")}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>ADD FIREARM</TerminalText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#00ff00" size="large" />
          <TerminalText className="mt-4">LOADING DATABASE...</TerminalText>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-4">
          <TerminalText className="text-terminal-error text-center mb-4">
            {error}
          </TerminalText>
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={fetchFirearms}
              className="border border-terminal-border px-4 py-2"
            >
              <TerminalText>RETRY</TerminalText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={useSampleData}
              className="border border-terminal-border px-4 py-2"
            >
              <TerminalText>USE SAMPLE DATA</TerminalText>
            </TouchableOpacity>
          </View>
        </View>
      ) : firearms.length === 0 ? (
        <View className="flex-1 justify-center items-center p-4">
          <TerminalText className="text-center text-lg mb-2">
            NO FIREARMS DETECTED
          </TerminalText>
          <TerminalText className="text-terminal-dim text-center mb-6">
            INITIALIZE DATABASE WITH NEW ENTRY
          </TerminalText>
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => navigation.navigate("AddFirearm")}
              className="border border-terminal-border px-6 py-3"
            >
              <TerminalText>ADD FIREARM</TerminalText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={useSampleData}
              className="border border-terminal-border px-6 py-3"
            >
              <TerminalText>LOAD SAMPLE DATA</TerminalText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={firearms}
          renderItem={renderFirearmItem}
          keyExtractor={(item) => item.id}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
