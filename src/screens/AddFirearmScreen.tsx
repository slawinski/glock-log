import React, { useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import * as ImagePicker from "react-native-image-picker";
import { FirearmInput } from "../types/firearm";
import { api } from "../services/api";

type AddFirearmScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddFirearm"
>;

export default function AddFirearmScreen() {
  const navigation = useNavigation<AddFirearmScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FirearmInput>({
    modelName: "",
    caliber: "",
    datePurchased: new Date(),
    amountPaid: 0,
    photos: [],
    roundsFired: 0,
    totalRoundsInInventory: 0,
  });

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
      setLoading(true);

      // Validate required fields
      if (!formData.modelName || !formData.caliber) {
        Alert.alert("Error", "Model name and caliber are required");
        return;
      }

      // Convert string values to appropriate types
      const firearmData = {
        ...formData,
        datePurchased: formData.datePurchased
          ? new Date(formData.datePurchased)
          : new Date(),
        amountPaid: formData.amountPaid
          ? parseFloat(formData.amountPaid.toString())
          : 0,
        roundsFired: formData.roundsFired
          ? parseInt(formData.roundsFired.toString())
          : 0,
        totalRoundsInInventory: formData.totalRoundsInInventory
          ? parseInt(formData.totalRoundsInInventory.toString())
          : 0,
      };

      await api.createFirearm(firearmData);
      navigation.goBack();
    } catch (error) {
      console.error("Error saving firearm:", error);
      Alert.alert("Error", "Failed to save firearm. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            placeholder="Amount Paid ($)"
            keyboardType="numeric"
            value={
              formData.amountPaid > 0 ? formData.amountPaid.toString() : ""
            }
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
            value={
              formData.roundsFired > 0 ? formData.roundsFired.toString() : ""
            }
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
            value={
              formData.totalRoundsInInventory > 0
                ? formData.totalRoundsInInventory.toString()
                : ""
            }
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
              <Image
                key={index}
                source={{ uri: photo }}
                className="w-20 h-20 m-1 rounded-lg"
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className={`${loading ? "bg-gray-400" : "bg-accent"} p-4 rounded-lg`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold">
              Save Firearm
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
