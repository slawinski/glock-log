import React, { useState } from "react";
import { View, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import * as ImagePicker from "react-native-image-picker";
import { storage } from "../../services/storage-new";
import { TerminalText } from "../../components/terminal-text/TerminalText";
import { TerminalInput } from "../../components/terminal-input/TerminalInput";
import TerminalDatePicker from "../../components/terminal-date-picker/TerminalDatePicker";
import { ImageGallery } from "../../components/image-gallery";
import { PlaceholderImagePicker } from "../../components/placeholder-image-picker/PlaceholderImagePicker";
import { PlaceholderImageKey } from "../../services/image-source-manager";
import {
  firearmInputSchema,
  FirearmInput,
} from "../../validation/inputSchemas";

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
  const [error] = useState<string | null>(null);

  const handleImagePick = () => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: "photo",
        quality: 0.8,
        selectionLimit: 10, // Allow multiple images
      },
      (response) => {
        if (response.assets && response.assets.length > 0) {
          const newImageUris = response.assets
            .map((asset) => asset.uri!)
            .filter(Boolean);
          setFormData((prev) => ({
            ...prev,
            photos: [...(prev.photos || []), ...newImageUris],
          }));
        }
      }
    );
  };

  const handlePlaceholderSelect = (imageName: PlaceholderImageKey) => {
    setFormData((prev) => ({
      ...prev,
      photos: [`placeholder:${imageName}`],
    }));
  };

  const handleDeleteImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index),
    }));
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
        <TouchableOpacity
          onPress={handleImagePick}
          className="border border-terminal-border px-4 py-2 mb-4"
        >
          <TerminalText>ADD PHOTOS</TerminalText>
        </TouchableOpacity>

        {/* Image Gallery */}
        {formData.photos && formData.photos.length > 0 && (
          <View className="w-full mb-4">
            <TerminalText className="mb-2">SELECTED PHOTOS</TerminalText>
            <ImageGallery
              images={formData.photos}
              onDeleteImage={handleDeleteImage}
              size="medium"
              showDeleteButton={true}
            />
          </View>
        )}

        {(!formData.photos || formData.photos.length === 0) && (
          <View className="w-full mb-4">
            <PlaceholderImagePicker onSelect={handlePlaceholderSelect} />
          </View>
        )}
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
        <TerminalText>INITIAL ROUNDS FIRED</TerminalText>
        <TerminalInput
          value={formData.initialRoundsFired?.toString() ?? ""}
          onChangeText={(text) => {
            const rounds = parseInt(text, 10);
            setFormData((prev) => ({
              ...prev,
              initialRoundsFired: isNaN(rounds) ? undefined : rounds,
            }));
          }}
          placeholder="e.g., 500"
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
        <TerminalText>NOTES</TerminalText>
        <TerminalInput
          value={formData.notes || ""}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, notes: text }))
          }
          placeholder="Add any notes about this firearm"
          multiline
        />
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
