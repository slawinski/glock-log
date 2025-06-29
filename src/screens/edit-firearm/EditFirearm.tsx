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
import { RootStackParamList } from "../../app/App";
import * as ImagePicker from "react-native-image-picker";
import { storage } from "../../services/storage-new";
import { TerminalText } from "../../components/terminal-text/TerminalText";
import { TerminalInput } from "../../components/terminal-input/TerminalInput";
import TerminalDatePicker from "../../components/terminal-date-picker/TerminalDatePicker";
import {
  firearmInputSchema,
  FirearmInput,
} from "../../validation/inputSchemas";
import { TerminalButton } from "../../components/terminal-button/TerminalButton";

type EditFirearmScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditFirearm"
>;
type EditFirearmScreenRouteProp = RouteProp<RootStackParamList, "EditFirearm">;

type FirearmFormData = Omit<FirearmInput, "amountPaid"> & {
  amountPaid: number | null;
};

export default function EditFirearmScreen() {
  const navigation = useNavigation<EditFirearmScreenNavigationProp>();
  const route = useRoute<EditFirearmScreenRouteProp>();
  const [formData, setFormData] = useState<FirearmFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setFormData({
          ...firearm,
          photos: firearm.photos || [],
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
            ...prev!,
            photos: [...(prev!.photos || []), response.assets![0].uri!],
          }));
        }
      }
    );
  };

  const handleSubmit = async () => {
    if (!formData) return;

    try {
      setSaving(true);

      const dataToValidate = {
        ...formData,
        amountPaid: formData.amountPaid || 0,
      };

      // Validate form data using Zod
      const validationResult = firearmInputSchema.safeParse(dataToValidate);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0].message;
        Alert.alert("Validation error", errorMessage);
        setSaving(false);
        return;
      }

      await storage.saveFirearm(validationResult.data);
      navigation.goBack();
    } catch (error) {
      console.error("Error updating firearm:", error);
      Alert.alert("Error", "Failed to update firearm. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      photos: (formData.photos || []).filter((_, i: number) => i !== index),
    });
  };

  const handleFormChange = (
    field: keyof FirearmFormData,
    value: string | number | null
  ) => {
    if (formData) {
      setFormData({ ...formData, [field]: value });
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <ActivityIndicator size="large" color="#00ff00" />
        <TerminalText className="mt-4">LOADING DATABASE...</TerminalText>
      </View>
    );
  }

  if (error || !formData) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <TerminalText className="text-terminal-error text-lg">
          {error || "Firearm data could not be loaded."}
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
          onChangeText={(text) => handleFormChange("modelName", text)}
          placeholder="e.g., Glock 19"
        />
      </View>

      <View className="mb-4">
        <TerminalText>CALIBER</TerminalText>
        <TerminalInput
          value={formData.caliber}
          onChangeText={(text) => handleFormChange("caliber", text)}
          placeholder="e.g., 9mm"
        />
      </View>

      <View className="mb-4">
        <TerminalText>AMOUNT PAID</TerminalText>
        <TerminalInput
          value={formData.amountPaid}
          onChangeText={(text) => {
            const amount = parseFloat(text);
            handleFormChange("amountPaid", isNaN(amount) ? null : amount);
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
            handleFormChange("datePurchased", date.toISOString())
          }
          label="PURCHASE DATE"
          maxDate={new Date()}
          placeholder="Select purchase date"
        />
      </View>

      <View className="mb-4">
        <TerminalText>PHOTOS</TerminalText>
        <TerminalButton
          onPress={handleImagePick}
          className="p-3 mb-2"
          caption="ADD PHOTO"
        />
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

      <View className="flex-row justify-between">
        <TerminalButton onPress={() => navigation.goBack()} caption="CANCEL" />
        <TerminalButton
          onPress={handleSubmit}
          disabled={saving}
          caption={saving ? "SAVING..." : "SAVE CHANGES"}
        />
      </View>
    </ScrollView>
  );
}
