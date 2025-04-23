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
      className="bg-white p-4 mb-2 rounded-lg shadow-sm"
    >
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-lg font-bold text-gray-800">
            {item.modelName}
          </Text>
          <Text className="text-gray-600">{item.caliber}</Text>
        </View>
        <View className="items-end">
          <Text className="text-gray-600">
            Rounds: {item.totalRoundsInInventory}
          </Text>
          <Text className="text-gray-600">Fired: {item.roundsFired}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-100">
      <View className="flex-row justify-between p-4 bg-white shadow-sm">
        <TouchableOpacity
          onPress={() => navigation.navigate("Stats")}
          className="bg-primary px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-semibold">Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("AddFirearm")}
          className="bg-accent px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-semibold">Add Firearm</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0284c7" />
          <Text className="mt-4 text-gray-600">Loading firearms...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 text-center mb-4">{error}</Text>
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={fetchFirearms}
              className="bg-accent px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={useSampleData}
              className="bg-primary px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-semibold">Use Sample Data</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : firearms.length === 0 ? (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-gray-500 text-center text-lg mb-2">
            No firearms added yet
          </Text>
          <Text className="text-gray-400 text-center mb-6">
            Start by adding your first firearm to your collection
          </Text>
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => navigation.navigate("AddFirearm")}
              className="bg-accent px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold text-lg">
                Add Your First Firearm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={useSampleData}
              className="bg-primary px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold text-lg">
                Use Sample Data
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={firearms}
          renderItem={renderFirearmItem}
          keyExtractor={(item) => item.id}
          className="flex-1 p-4"
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
