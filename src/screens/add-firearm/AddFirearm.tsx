import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  LayoutChangeEvent,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Controller } from "react-hook-form";
import { RootStackParamList } from "../../app/App";
import { storage } from "../../services/storage-new";
import { useEntityForm, useImagePicker, useUnsavedChanges } from "../../hooks";
import {
  ImageGallery,
  PlaceholderImagePicker,
  SectionHeading,
  StickyActionBar,
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

const FIELD_ORDER = [
  "modelName",
  "caliber",
  "initialRoundsFired",
  "amountPaid",
  "datePurchased",
  "notes",
] as const;

export const AddFirearm = () => {
  const navigation = useNavigation<AddFirearmScreenNavigationProp>();
  const scrollRef = useRef<ScrollView>(null);
  const fieldY = useRef<Record<string, number>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const { pickImages, isPicking } = useImagePicker({ selectionLimit: 10 });

  const saveFirearm = async (data: FirearmInput) => {
    await storage.saveFirearm({ ...data, photos });
    form.reset(form.getValues());
    dirtyRef.current = false;
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
        amountPaid: "",
        initialRoundsFired: "",
        notes: "",
      },
      entityName: "create firearm",
    }
  );
  const {
    control,
    setFocus,
    formState: { errors, isDirty },
  } = form;

  const dirtyRef = useRef(false);
  const localDirty = photos.length > 0;
  dirtyRef.current = isDirty || localDirty;
  useUnsavedChanges(dirtyRef);

  const firstInvalidField = FIELD_ORDER.find((name) => Boolean(errors[name]));
  useEffect(() => {
    if (firstInvalidField) {
      const y = fieldY.current[firstInvalidField];
      if (y != null) {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
      }
      setFocus(firstInvalidField);
    }
  }, [firstInvalidField, setFocus]);

  const captureY = (name: string) => (event: LayoutChangeEvent) => {
    fieldY.current[name] = event.nativeEvent.layout.y;
  };

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
    <KeyboardAvoidingView
      className="flex-1 bg-terminal-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pb-24">
          <SectionHeading title="IDENTIFICATION" />
          <View onLayout={captureY("modelName")} className="mb-4">
            <TerminalText className="mb-1.5">MODEL NAME *</TerminalText>
            <Controller
              control={control}
              name="modelName"
              render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                <TerminalInput
                  value={value}
                  onChangeText={onChange}
                  ref={ref}
                  placeholder="e.g., Glock 19"
                  testID="model-name-input"
                  error={error?.message}
                />
              )}
            />
            {errors.modelName && (
              <TerminalText
                className="text-terminal-error text-sm mt-1"
                accessibilityLiveRegion="polite"
              >
                {errors.modelName.message}
              </TerminalText>
            )}
          </View>

          <View onLayout={captureY("caliber")} className="mb-4">
            <TerminalText className="mb-1.5">CALIBER *</TerminalText>
            <Controller
              control={control}
              name="caliber"
              render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                <TerminalInput
                  value={value}
                  onChangeText={onChange}
                  ref={ref}
                  placeholder="e.g., 9mm"
                  testID="caliber-input"
                  error={error?.message}
                />
              )}
            />
            {errors.caliber && (
              <TerminalText
                className="text-terminal-error text-sm mt-1"
                accessibilityLiveRegion="polite"
              >
                {errors.caliber.message}
              </TerminalText>
            )}
          </View>

          <SectionHeading title="SHOOTING" className="mt-7" />
          <View onLayout={captureY("initialRoundsFired")} className="mb-4">
            <TerminalText className="mb-1.5">INITIAL ROUNDS FIRED</TerminalText>
            <Controller
              control={control}
              name="initialRoundsFired"
              render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                <TerminalInput
                  value={String(value ?? "")}
                  onChangeText={(text) => onChange(text)}
                  ref={ref}
                  placeholder="e.g., 500"
                  keyboardType="numeric"
                  testID="initial-rounds-input"
                  error={error?.message}
                />
              )}
            />
            {errors.initialRoundsFired && (
              <TerminalText
                className="text-terminal-error text-sm mt-1"
                accessibilityLiveRegion="polite"
              >
                {errors.initialRoundsFired.message}
              </TerminalText>
            )}
          </View>

          <SectionHeading title="PURCHASE" className="mt-7" />
          <View onLayout={captureY("amountPaid")} className="mb-4">
            <TerminalText className="mb-1.5">AMOUNT PAID</TerminalText>
            <Controller
              control={control}
              name="amountPaid"
              render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                <TerminalInput
                  value={String(value ?? "")}
                  onChangeText={(text) => onChange(text)}
                  ref={ref}
                  placeholder="Enter amount paid"
                  keyboardType="decimal-pad"
                  testID="amount-paid-input"
                  error={error?.message}
                />
              )}
            />
            {errors.amountPaid && (
              <TerminalText
                className="text-terminal-error text-sm mt-1"
                accessibilityLiveRegion="polite"
              >
                {errors.amountPaid.message}
              </TerminalText>
            )}
          </View>

          <View onLayout={captureY("datePurchased")}>
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

          <SectionHeading title="PHOTOS" className="mt-7" />
          <View className="mb-4">
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

          <SectionHeading title="NOTES" className="mt-7" />
          <View onLayout={captureY("notes")}>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                <TerminalInput
                  value={value ?? ""}
                  onChangeText={onChange}
                  ref={ref}
                  placeholder="Add any notes about this firearm"
                  multiline
                  error={error?.message}
                />
              )}
            />
            {errors.notes && (
              <TerminalText
                className="text-terminal-error text-sm mt-1"
                accessibilityLiveRegion="polite"
              >
                {errors.notes.message}
              </TerminalText>
            )}
          </View>
        </View>
      </ScrollView>

      <StickyActionBar
        primaryAction={{
          caption: "Save firearm",
          onPress: onSubmit,
          disabled: isSaving,
          loading: isSaving,
        }}
      />
    </KeyboardAvoidingView>
  );
};
