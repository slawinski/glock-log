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
import * as ImagePicker from "react-native-image-picker";
import { FirearmStorage } from "../validation/storageSchemas";
import { storage } from "../services/storage";
import { TerminalText } from "../components/TerminalText";
import { TerminalInput } from "../components/TerminalInput";
import TerminalDatePicker from "../components/TerminalDatePicker";
import { firearmInputSchema, FirearmInput } from "../validation/inputSchemas";

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
    datePurchased: new Date().toISOString(),
    amountPaid: 0,
    photos: [],
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (route.params?.id) {
      fetchFirearm();
    }
  }, [route.params?.id]);

  const fetchFirearm = async () => {
    try {
      setLoading(true);
      const firearms = await storage.getFirearms();
      const firearm = firearms.find((f) => f.id === route.params!.id);
      if (firearm) {
        // Convert storage data to input data
        const { id, createdAt, updatedAt, roundsFired, ...firearmData } =
          firearm;
        setFormData({
          ...firearmData,
          photos: firearmData.photos || [],
        });
      } else {
        setError("Firearm not found");
      }
    } catch (error) {
      console.error("Error fetching firearm:", error);
      Alert.alert("Error", "Failed to load firearm data");
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
      console.error("Error updating firearm:", error);
      Alert.alert("Error", "Failed to update firearm. Please try again.");
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

  return (
    <ScrollView className="flex-1 bg-terminal-bg p-4">
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
        <TerminalDatePicker
          value={new Date(formData.datePurchased)}
          onChange={(date) =>
            setFormData((prev) => ({
              ...prev,
              datePurchased: date.toISOString(),
            }))
          }
          label="PURCHASE DATE"
          maxDate={new Date()}
          placeholder="Select purchase date"
        />
      </View>

      <View className="mb-4">
        <TerminalText>PHOTOS</TerminalText>
        <TouchableOpacity
          onPress={handleImagePick}
          className="border border-terminal-border p-3 mb-2"
        >
          <TerminalText>ADD PHOTO</TerminalText>
        </TouchableOpacity>
        <ScrollView horizontal className="flex-row">
          {formData.photos?.map((photo, index) => (
            <View key={index} className="relative">
              <Image source={{ uri: photo }} className="w-40 h-40 m-1" />
              <TouchableOpacity
                onPress={() => handleDeletePhoto(index)}
                className="absolute top-0 right-0 bg-terminal-error p-1"
              >
                <TerminalText className="text-xs">X</TerminalText>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
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
          <TerminalText>{saving ? "SAVING..." : "SAVE CHANGES"}</TerminalText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
