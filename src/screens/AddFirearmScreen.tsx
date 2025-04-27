import React, { useState } from "react";
import {
  View,
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
import { storage } from "../services/storage";
import { TerminalText } from "../components/TerminalText";
import { TerminalInput } from "../components/TerminalInput";
import DateTimePicker from "@react-native-community/datetimepicker";
import FirearmImage from "../components/FirearmImage";
import { firearmInputSchema, FirearmInput } from "../validation/inputSchemas";

type AddFirearmScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddFirearm"
>;

export default function AddFirearmScreen() {
  const navigation = useNavigation<AddFirearmScreenNavigationProp>();
  const [formData, setFormData] = useState<FirearmInput>({
    modelName: "",
    caliber: "",
    datePurchased: new Date().toISOString(),
    amountPaid: 0,
    photos: [],
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // TODO: adding files doesn't work
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
            photos: [...(prev.photos || []), response.assets![0].uri!],
          }));
        }
      }
    );
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      // Validate form data using Zod
      const validationResult = firearmInputSchema.safeParse(formData);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0].message;
        Alert.alert("Validation error", errorMessage);
        return;
      }

      await storage.saveFirearm(formData);
      navigation.goBack();
    } catch (error) {
      console.error("Error creating firearm:", error);
      Alert.alert("Error", "Failed to create firearm. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i: number) => i !== index),
    }));
  };

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <TerminalText className="text-terminal-error text-lg">
          {error}
        </TerminalText>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-terminal-bg p-4">
      <View className="items-center mb-6">
        <FirearmImage size={200} />
        <TouchableOpacity
          onPress={handleImagePick}
          className="mt-4 border border-terminal-border px-4 py-2"
        >
          <TerminalText>ADD PHOTO</TerminalText>
        </TouchableOpacity>
      </View>

      <View className="mb-4">
        <TerminalText>MODEL NAME</TerminalText>
        <TerminalInput
          value={formData.modelName}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, modelName: text }))
          }
          placeholder="e.g., Glock 19"
        />
      </View>

      <View className="mb-4">
        <TerminalText>CALIBER</TerminalText>
        <TerminalInput
          value={formData.caliber}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, caliber: text }))
          }
          placeholder="e.g., 9mm"
        />
      </View>

      <View className="mb-4">
        <TerminalText>AMOUNT PAID</TerminalText>
        <TerminalInput
          value={formData.amountPaid.toString()}
          onChangeText={(text) => {
            const amount = parseFloat(text) || 0;
            setFormData((prev) => ({ ...prev, amountPaid: amount }));
          }}
          placeholder="Enter amount paid"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-4">
        <TerminalText>DATE PURCHASED</TerminalText>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="border border-terminal-border p-2"
        >
          <TerminalText>
            {new Date(formData.datePurchased).toLocaleDateString()}
          </TerminalText>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(formData.datePurchased)}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setFormData((prev) => ({
                  ...prev,
                  datePurchased: selectedDate.toISOString(),
                }));
              }
            }}
          />
        )}
      </View>

      {error && (
        <View className="mb-4">
          <TerminalText className="text-terminal-error">{error}</TerminalText>
        </View>
      )}

      <View className="flex-row justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>CANCEL</TerminalText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={saving}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>{saving ? "SAVING..." : "SAVE FIREARM"}</TerminalText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
