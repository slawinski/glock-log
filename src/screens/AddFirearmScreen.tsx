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
import { Terminal, TerminalText, TerminalInput } from "../components/Terminal";

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
    <ScrollView className="flex-1 bg-terminal-bg">
      <View className="p-4">
        <Terminal title="NEW ENTRY FORM">
          <View className="mb-4">
            <TerminalText className="text-lg mb-2">
              MODEL INFORMATION
            </TerminalText>
            <TextInput
              className="bg-terminal-bg border border-terminal-border p-2 mb-2 text-terminal-text font-terminal"
              placeholder="Model Name"
              placeholderTextColor="#003300"
              value={formData.modelName}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, modelName: text }))
              }
            />
            <TextInput
              className="bg-terminal-bg border border-terminal-border p-2 text-terminal-text font-terminal"
              placeholder="Caliber"
              placeholderTextColor="#003300"
              value={formData.caliber}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, caliber: text }))
              }
            />
          </View>

          <View className="mb-4">
            <TerminalText className="text-lg mb-2">
              PURCHASE DETAILS
            </TerminalText>
            <TextInput
              className="bg-terminal-bg border border-terminal-border p-2 mb-2 text-terminal-text font-terminal"
              placeholder="Amount Paid ($)"
              placeholderTextColor="#003300"
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
              className="bg-terminal-bg border border-terminal-border p-2 text-terminal-text font-terminal"
              placeholder="Date Purchased (YYYY-MM-DD)"
              placeholderTextColor="#003300"
              value={formData.datePurchased.toISOString().split("T")[0]}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  datePurchased: new Date(text),
                }))
              }
            />
          </View>

          <View className="mb-4">
            <TerminalText className="text-lg mb-2">AMMUNITION</TerminalText>
            <TextInput
              className="bg-terminal-bg border border-terminal-border p-2 mb-2 text-terminal-text font-terminal"
              placeholder="Rounds Fired"
              placeholderTextColor="#003300"
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
              className="bg-terminal-bg border border-terminal-border p-2 text-terminal-text font-terminal"
              placeholder="Total Rounds in Inventory"
              placeholderTextColor="#003300"
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

          <View className="mb-4">
            <TerminalText className="text-lg mb-2">PHOTOS</TerminalText>
            <TouchableOpacity
              onPress={handleImagePick}
              className="border border-terminal-border p-3 mb-2"
            >
              <TerminalText>ADD PHOTO</TerminalText>
            </TouchableOpacity>
            <View className="flex-row flex-wrap">
              {formData.photos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  className="w-20 h-20 m-1 border border-terminal-border"
                />
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`border border-terminal-border p-4 ${
              loading ? "opacity-50" : ""
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#00ff00" />
            ) : (
              <TerminalText>SAVE ENTRY</TerminalText>
            )}
          </TouchableOpacity>
        </Terminal>
      </View>
    </ScrollView>
  );
}
