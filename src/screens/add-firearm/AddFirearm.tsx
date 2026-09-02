import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Controller } from "react-hook-form";
import { RootStackParamList } from "../../app/App";
import { storage } from "../../services/storage-new";
import { useEntityForm, useImagePicker } from "../../hooks";
import {
  BottomButtonGroup,
  ImageGallery,
  PlaceholderImagePicker,
  TerminalButton,
  TerminalDatePicker,
  TerminalInput,
  TerminalText,
} from "../../components";
import { PlaceholderImageKey } from "../../services/image-source-manager";
import { firearmInputSchema, FirearmFormData, FirearmInput } from "../../validation/inputSchemas";

type AddFirearmScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddFirearm"
>;

export const AddFirearm = () => {
  const navigation = useNavigation<AddFirearmScreenNavigationProp>();
  const [photos, setPhotos] = useState<string[]>([]);
  const { pickImages, isPicking } = useImagePicker({ selectionLimit: 10 });

  const saveFirearm = async (data: FirearmInput) => {
    await storage.saveFirearm({ ...data, photos });
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
      entityName: "create firearm",
    }
  );
  const {
    control,
    formState: { errors },
  } = form;

  const handleImagePick = async () => {
    const assets = await pickImages();
    if (assets.length > 0) {
      const newImageUris = assets
        .map((asset) => asset.uri!)
        .filter(Boolean);
      setPhotos((prev) => [...prev, ...newImageUris]);
    }
  };

  const handlePlaceholderSelect = (imageName: PlaceholderImageKey) => {
    setPhotos([`placeholder:${imageName}`]);
  };

  const handleDeleteImage = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          <View className="items-center mb-6">
            <TerminalButton
              onPress={handleImagePick}
              className="mb-4"
              caption="ADD PHOTOS"
              disabled={isPicking}
            />

            {photos.length > 0 && (
              <View className="w-full mb-4">
                <TerminalText className="mb-2">SELECTED PHOTOS</TerminalText>
                <ImageGallery
                  images={photos}
                  onDeleteImage={handleDeleteImage}
                  size="medium"
                  showDeleteButton={true}
                />
              </View>
            )}

            {photos.length === 0 && (
              <View className="w-full mb-4">
                <PlaceholderImagePicker onSelect={handlePlaceholderSelect} />
              </View>
            )}
          </View>

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
                  testID="model-name-input"
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
                  testID="caliber-input"
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
                  testID="amount-paid-input"
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
            <TerminalText>INITIAL ROUNDS FIRED</TerminalText>
            <Controller
              control={control}
              name="initialRoundsFired"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TerminalInput
                  value={value ?? ""}
                  onChangeText={(text) => {
                    const rounds = parseInt(text, 10);
                    onChange(isNaN(rounds) ? undefined : rounds);
                  }}
                  placeholder="e.g., 500"
                  keyboardType="numeric"
                  testID="initial-rounds-input"
                  error={error?.message}
                />
              )}
            />
            {errors.initialRoundsFired && (
              <TerminalText className="text-terminal-error text-sm mt-1">
                {errors.initialRoundsFired.message}
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
            <TerminalText>NOTES</TerminalText>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TerminalInput
                  value={value ?? ""}
                  onChangeText={onChange}
                  placeholder="Add any notes about this firearm"
                  multiline
                  error={error?.message}
                />
              )}
            />
            {errors.notes && (
              <TerminalText className="text-terminal-error text-sm mt-1">
                {errors.notes.message}
              </TerminalText>
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
                caption: isSaving ? "SAVING..." : "SAVE FIREARM",
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
