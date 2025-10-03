import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../app/App";
import * as ImagePicker from "react-native-image-picker";
import { storage } from "../../services/storage-new";
import { useFormChangeHandler } from "../../hooks";

import {
  TerminalText,
  TerminalInput,
  TerminalDatePicker,
  BottomButtonGroup,
  ImageGallery,
  TerminalButton,
} from "../../components";
import {
  firearmInputSchema,
  FirearmInput,
} from "../../validation/inputSchemas";

type EditFirearmScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditFirearm"
>;
type EditFirearmScreenRouteProp = RouteProp<RootStackParamList, "EditFirearm">;

type FirearmFormData = Omit<FirearmInput, "amountPaid"> & {
  amountPaid: number | null;
};

export const EditFirearm = () => {
  const navigation = useNavigation<EditFirearmScreenNavigationProp>();
  const route = useRoute<EditFirearmScreenRouteProp>();
  const [formData, setFormData] = useState<FirearmFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const handleFormChange = useFormChangeHandler(formData, setFormData);

  const fetchFirearm = useCallback(async () => {
    try {
      setLoading(true);
      const firearms = await storage.getFirearms();
      const firearm = firearms.find((f) => f.id === route.params!.id);
      if (firearm) {
        setFormData({
          ...firearm,
          photos: firearm.photos || [],
        });
        setThumbnailIndex(0); // Reset thumbnail index when loading firearm
      } else {
        setError("Firearm not found");
      }
    } catch (error) {
      console.error("Error fetching firearm:", error);
      Alert.alert("Error", "Failed to load firearm data");
    } finally {
      setLoading(false);
    }
  }, [route.params]);

  useEffect(() => {
    if (route.params?.id) {
      fetchFirearm();
    }
  }, [route.params?.id, fetchFirearm]);

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

      // Reorder photos to put thumbnail first
      let reorderedPhotos = [...(formData.photos || [])];
      if (thumbnailIndex > 0 && thumbnailIndex < reorderedPhotos.length) {
        const thumbnailPhoto = reorderedPhotos[thumbnailIndex];
        reorderedPhotos.splice(thumbnailIndex, 1);
        reorderedPhotos.unshift(thumbnailPhoto);
      }

      const dataToValidate = {
        ...formData,
        amountPaid: formData.amountPaid || 0,
        photos: reorderedPhotos,
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

    // Adjust thumbnail index if needed
    if (index === thumbnailIndex) {
      setThumbnailIndex(0); // Reset to first image
    } else if (index < thumbnailIndex) {
      setThumbnailIndex(thumbnailIndex - 1); // Shift thumbnail index down
    }

    setFormData({
      ...formData,
      photos: (formData.photos || []).filter((_, i: number) => i !== index),
    });
  };

  const handleSelectThumbnail = (index: number) => {
    setThumbnailIndex(index);
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
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
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
            <TerminalText>PHOTOS:</TerminalText>
            <TerminalText className="text-sm text-gray-400 mb-2">
              Tap an image to set as thumbnail for Home screen
            </TerminalText>
            <TerminalButton
              onPress={handleImagePick}
              className="p-3 mb-2"
              caption="ADD PHOTO"
            />
            {formData.photos && formData.photos.length > 0 && (
              <ImageGallery
                images={formData.photos}
                onDeleteImage={handleDeletePhoto}
                size="medium"
                showDeleteButton={true}
                thumbnailIndex={thumbnailIndex}
                onSelectThumbnail={handleSelectThumbnail}
                allowThumbnailSelection={true}
              />
            )}
          </View>

          <View className="flex-1" />

          <BottomButtonGroup
            buttons={[
              {
                caption: "CANCEL",
                onPress: () => navigation.goBack(),
              },
              {
                caption: saving ? "SAVING..." : "SAVE CHANGES",
                onPress: handleSubmit,
                disabled: saving,
              },
            ]}
          />
        </View>
      </ScrollView>
    </View>
  );
};
