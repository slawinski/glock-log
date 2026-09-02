import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Controller } from "react-hook-form";
import { RootStackParamList } from "../../app/App";
import { handleError } from "../../services/error-handler";
import { storage } from "../../services/storage-new";
import { useEntityForm, useImagePicker } from "../../hooks";
import { normalizeImagePath } from "../../services/image-source-manager";

import {
  BottomButtonGroup,
  ErrorDisplay,
  ImageGallery,
  LoadingScreen,
  TerminalButton,
  TerminalDatePicker,
  TerminalInput,
  TerminalText,
} from "../../components";
import { firearmInputSchema, FirearmFormData, FirearmInput } from "../../validation/inputSchemas";

type EditFirearmScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditFirearm"
>;
type EditFirearmScreenRouteProp = RouteProp<RootStackParamList, "EditFirearm">;

export const EditFirearm = () => {
  const navigation = useNavigation<EditFirearmScreenNavigationProp>();
  const route = useRoute<EditFirearmScreenRouteProp>();
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const { pickImages, isPicking } = useImagePicker();

  const saveFirearm = async (data: FirearmInput) => {
    // Reorder photos to put thumbnail first
    const reorderedPhotos = [...photos];
    if (thumbnailIndex > 0 && thumbnailIndex < reorderedPhotos.length) {
      const thumbnailPhoto = reorderedPhotos[thumbnailIndex];
      reorderedPhotos.splice(thumbnailIndex, 1);
      reorderedPhotos.unshift(thumbnailPhoto);
    }

    await storage.saveFirearm({ ...data, photos: reorderedPhotos });
    navigation.goBack();
  };

  const { form, isSaving, onSubmit } = useEntityForm<
    FirearmInput,
    FirearmFormData
  >(firearmInputSchema, saveFirearm, {
      defaultValues: {
        modelName: "",
        caliber: "",
        datePurchased: new Date().toISOString(),
        amountPaid: null,
        notes: "",
      },
      entityName: "update firearm",
    }
  );
  const {
    control,
    reset,
    formState: { errors },
  } = form;

  const fetchFirearm = useCallback(async () => {
    try {
      setLoading(true);
      const firearms = await storage.getFirearms();
      const firearm = firearms.find((f) => f.id === route.params!.id);
      if (firearm) {
        reset({
          id: firearm.id,
          modelName: firearm.modelName,
          caliber: firearm.caliber,
          datePurchased: firearm.datePurchased,
          amountPaid: firearm.amountPaid,
          notes: firearm.notes ?? "",
        });
        setPhotos((firearm.photos || []).map(normalizeImagePath));
        setThumbnailIndex(0); // Reset thumbnail index when loading firearm
      } else {
        setError("Firearm not found");
      }
    } catch (error) {
      handleError(error, "EditFirearm.fetchFirearm", { isUserFacing: true, userMessage: "Failed to load firearm data." });
      setError("Failed to load firearm data.");
    } finally {
      setLoading(false);
    }
  }, [route.params, reset]);

  useEffect(() => {
    if (route.params?.id) {
      fetchFirearm();
    }
  }, [route.params?.id, fetchFirearm]);

  const handleImagePick = async () => {
    const assets = await pickImages();
    if (assets.length > 0 && assets[0].uri) {
      setPhotos((prev) => [...prev, assets[0].uri!]);
    }
  };

  const handleDeletePhoto = (index: number) => {
    // Adjust thumbnail index if needed
    if (index === thumbnailIndex) {
      setThumbnailIndex(0); // Reset to first image
    } else if (index < thumbnailIndex) {
      setThumbnailIndex(thumbnailIndex - 1); // Shift thumbnail index down
    }

    setPhotos((prev) => prev.filter((_, i: number) => i !== index));
  };

  const handleSelectThumbnail = (index: number) => {
    setThumbnailIndex(index);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <ErrorDisplay
        errorMessage={error}
        onRetry={fetchFirearm}
      />
    );
  }

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          <View className="mb-4">
            <TerminalText>MODEL NAME</TerminalText>
            <Controller
              control={control}
              name="modelName"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TerminalInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g., Glock 19"
                  error={error?.message}
                />
              )}
            />
            {errors.modelName && (
              <TerminalText className="text-terminal-error text-sm mt-1">
                {errors.modelName.message}
              </TerminalText>
            )}
          </View>

          <View className="mb-4">
            <TerminalText>CALIBER</TerminalText>
            <Controller
              control={control}
              name="caliber"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TerminalInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g., 9mm"
                  error={error?.message}
                />
              )}
            />
            {errors.caliber && (
              <TerminalText className="text-terminal-error text-sm mt-1">
                {errors.caliber.message}
              </TerminalText>
            )}
          </View>

          <View className="mb-4">
            <TerminalText>AMOUNT PAID</TerminalText>
            <Controller
              control={control}
              name="amountPaid"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TerminalInput
                  value={value}
                  onChangeText={(text) => {
                    const amount = parseFloat(text);
                    onChange(isNaN(amount) ? null : amount);
                  }}
                  placeholder="Enter amount paid"
                  keyboardType="numeric"
                  error={error?.message}
                />
              )}
            />
            {errors.amountPaid && (
              <TerminalText className="text-terminal-error text-sm mt-1">
                {errors.amountPaid.message}
              </TerminalText>
            )}
          </View>

          <View className="mb-4">
            <Controller
              control={control}
              name="datePurchased"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TerminalDatePicker
                  value={new Date(value)}
                  onChange={(date) => onChange(date.toISOString())}
                  label="PURCHASE DATE"
                  maxDate={new Date()}
                  placeholder="Select purchase date"
                  error={error?.message}
                />
              )}
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
              disabled={isPicking}
            />
            {photos.length > 0 && (
              <ImageGallery
                images={photos}
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
                caption: isSaving ? "SAVING..." : "SAVE CHANGES",
                onPress: onSubmit,
                disabled: isSaving,
              },
            ]}
          />
        </View>
      </ScrollView>
    </View>
  );
};
