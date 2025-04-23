import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
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
import * as ImagePicker from "react-native-image-picker";
import { FirearmInput } from "../types/firearm";
import { api } from "../services/api";

type EditFirearmScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditFirearm"
>;
type EditFirearmScreenRouteProp = RouteProp<RootStackParamList, "EditFirearm">;

export default function EditFirearmScreen() {
  const navigation = useNavigation<EditFirearmScreenNavigationProp>();
  const route = useRoute<EditFirearmScreenRouteProp>();
  const [formData, setFormData] = useState<FirearmInput>({
    modelName: "",
    caliber: "",
    datePurchased: new Date(),
    amountPaid: 0,
    photos: [],
    roundsFired: 0,
    totalRoundsInInventory: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFirearm();
  }, [route.params.id]);

  const fetchFirearm = async () => {
    try {
      setLoading(true);
      setError(null);
      const firearm = await api.getFirearm(route.params.id);
      setFormData({
        modelName: firearm.modelName,
        caliber: firearm.caliber,
        datePurchased: firearm.datePurchased,
        amountPaid: firearm.amountPaid,
        photos: firearm.photos,
        roundsFired: firearm.roundsFired,
        totalRoundsInInventory: firearm.totalRoundsInInventory,
      });
    } catch (error) {
      console.error("Error fetching firearm:", error);
      setError("Failed to load firearm details");
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = () => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: "photo",
        quality: 0.8,
      },
      (response) => {
        if (response.assets && response.assets[0].uri) {
          setFormData((prev) => ({
            ...prev,
            photos: [...prev.photos, response.assets![0].uri!],
          }));
        }
      }
    );
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!formData.modelName || !formData.caliber) {
        Alert.alert("Error", "Model name and caliber are required");
        return;
      }

      await api.updateFirearm(route.params.id, formData);
      navigation.goBack();
    } catch (error) {
      console.error("Error updating firearm:", error);
      Alert.alert("Error", "Failed to update firearm. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-red-500 text-lg">{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-4">
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-semibold mb-2">Model Information</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-2 mb-2"
            placeholder="Model Name"
            value={formData.modelName}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, modelName: text }))
            }
          />
          <TextInput
            className="border border-gray-300 rounded-lg p-2"
            placeholder="Caliber"
            value={formData.caliber}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, caliber: text }))
            }
          />
        </View>

        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-semibold mb-2">Purchase Details</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-2 mb-2"
            placeholder="Amount Paid"
            keyboardType="numeric"
            value={formData.amountPaid.toString()}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                amountPaid: parseFloat(text) || 0,
              }))
            }
          />
          <TextInput
            className="border border-gray-300 rounded-lg p-2"
            placeholder="Date Purchased (YYYY-MM-DD)"
            value={formData.datePurchased.toISOString().split("T")[0]}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                datePurchased: new Date(text),
              }))
            }
          />
        </View>

        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-semibold mb-2">Ammunition</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-2 mb-2"
            placeholder="Rounds Fired"
            keyboardType="numeric"
            value={formData.roundsFired.toString()}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                roundsFired: parseInt(text) || 0,
              }))
            }
          />
          <TextInput
            className="border border-gray-300 rounded-lg p-2"
            placeholder="Total Rounds in Inventory"
            keyboardType="numeric"
            value={formData.totalRoundsInInventory.toString()}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                totalRoundsInInventory: parseInt(text) || 0,
              }))
            }
          />
        </View>

        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-semibold mb-2">Photos</Text>
          <TouchableOpacity
            onPress={handleImagePick}
            className="bg-accent p-3 rounded-lg mb-2"
          >
            <Text className="text-white text-center">Add Photo</Text>
          </TouchableOpacity>
          <View className="flex-row flex-wrap">
            {formData.photos.map((photo, index) => (
              <View key={index} className="relative">
                <Image
                  source={{ uri: photo }}
                  className="w-20 h-20 m-1 rounded-lg"
                />
                <TouchableOpacity
                  onPress={() => handleDeletePhoto(index)}
                  className="absolute top-0 right-0 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                >
                  <Text className="text-white">×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={saving}
          className={`${saving ? "bg-gray-400" : "bg-primary"} p-4 rounded-lg`}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold">
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
