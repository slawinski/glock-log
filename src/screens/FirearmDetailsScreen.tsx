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
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error || !firearm) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-red-500 text-lg">
          {error || "Firearm not found"}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-4">
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-2xl font-bold mb-2">{firearm.modelName}</Text>
          <Text className="text-lg text-gray-600 mb-4">{firearm.caliber}</Text>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Date Purchased:</Text>
            <Text className="font-semibold">
              {format(firearm.datePurchased, "MMM dd, yyyy")}
            </Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Amount Paid:</Text>
            <Text className="font-semibold">
              ${firearm.amountPaid.toFixed(2)}
            </Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Rounds Fired:</Text>
            <Text className="font-semibold">{firearm.roundsFired}</Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-gray-600">Rounds in Inventory:</Text>
            <Text className="font-semibold">
              {firearm.totalRoundsInInventory}
            </Text>
          </View>
        </View>

        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-semibold mb-2">Photos</Text>
          <View className="flex-row flex-wrap">
            {firearm.photos.length > 0 ? (
              firearm.photos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  className="w-32 h-32 m-1 rounded-lg"
                />
              ))
            ) : (
              <Text className="text-gray-500">No photos available</Text>
            )}
          </View>
        </View>

        <View className="flex-row justify-between">
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("EditFirearm", { id: firearm.id })
            }
            className="bg-accent p-4 rounded-lg flex-1 mr-2"
          >
            <Text className="text-white text-center font-semibold">Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            className="bg-red-500 p-4 rounded-lg flex-1 ml-2"
          >
            <Text className="text-white text-center font-semibold">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
