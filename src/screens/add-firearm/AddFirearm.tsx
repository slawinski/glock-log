import React, { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import * as ImagePicker from "react-native-image-picker";
import { storage } from "../../services/storage-new";
import {
  TerminalText,
  TerminalInput,
  TerminalDatePicker,
  ImageGallery,
  PlaceholderImagePicker,
  TerminalButton,
} from "../../components";
import { PlaceholderImageKey } from "../../services/image-source-manager";
import {
  firearmInputSchema,
  FirearmInput,
} from "../../validation/inputSchemas";

type AddFirearmScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddFirearm"
>;

type FirearmFormData = Omit<FirearmInput, "amountPaid"> & {
  amountPaid: number | null;
};

export default function AddFirearmScreen() {
  const navigation = useNavigation<AddFirearmScreenNavigationProp>();
  const [formData, setFormData] = useState<FirearmFormData>({
    modelName: "",
    caliber: "",
    datePurchased: new Date().toISOString(),
    amountPaid: null,
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
        <TerminalButton
          onPress={handleImagePick}
          className="mb-4"
          caption="ADD PHOTOS"
        />

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
          value={formData.amountPaid}
          onChangeText={(text) => {
            const amount = parseFloat(text);
            setFormData((prev) => ({
              ...prev,
              amountPaid: isNaN(amount) ? null : amount,
            }));
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
        <TerminalButton onPress={() => navigation.goBack()} caption="CANCEL" />
        <TerminalButton
          onPress={handleSubmit}
          disabled={saving}
          caption={saving ? "SAVING..." : "SAVE FIREARM"}
        />
      </View>
    </ScrollView>
  );
}
