import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  LayoutChangeEvent,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Controller } from "react-hook-form";
import { RootStackParamList } from "../../app/App";
import { handleError } from "../../services/error-handler";
import { storage } from "../../services/storage-new";
import { useEntityForm, useImagePicker, useUnsavedChanges } from "../../hooks";
import { normalizeImagePath } from "../../services/image-source-manager";

import {
  ErrorDisplay,
  ImageGallery,
  LoadingScreen,
  SectionHeading,
  StickyActionBar,
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

const FIELD_ORDER = [
  "modelName",
  "caliber",
  "amountPaid",
  "datePurchased",
  "notes",
] as const;

export const EditFirearm = () => {
  const navigation = useNavigation<EditFirearmScreenNavigationProp>();
  const route = useRoute<EditFirearmScreenRouteProp>();
  const scrollRef = useRef<ScrollView>(null);
  const fieldY = useRef<Record<string, number>>({});
  const initialPhotosRef = useRef<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const { pickImages, isPicking } = useImagePicker();

  const saveFirearm = async (data: FirearmInput) => {
    const reorderedPhotos = [...photos];
    if (thumbnailIndex > 0 && thumbnailIndex < reorderedPhotos.length) {
      const thumbnailPhoto = reorderedPhotos[thumbnailIndex];
      reorderedPhotos.splice(thumbnailIndex, 1);
      reorderedPhotos.unshift(thumbnailPhoto);
    }

    await storage.saveFirearm({ ...data, photos: reorderedPhotos });
    form.reset(form.getValues());
    dirtyRef.current = false;
    initialPhotosRef.current = [...photos];
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
      entityName: "update firearm",
    }
  );
  const {
    control,
    reset,
    setFocus,
    formState: { errors, isDirty },
  } = form;

  const dirtyRef = useRef(false);
  const photosChanged =
    photos.length !== initialPhotosRef.current.length ||
    photos.some((photo, index) => photo !== initialPhotosRef.current[index]);
  dirtyRef.current = isDirty || photosChanged;
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
          amountPaid: String(firearm.amountPaid),
          notes: firearm.notes ?? "",
        });
        const loadedPhotos = (firearm.photos || []).map(normalizeImagePath);
        setPhotos(loadedPhotos);
        initialPhotosRef.current = loadedPhotos;
        setThumbnailIndex(0);
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
    if (index === thumbnailIndex) {
      setThumbnailIndex(0);
    } else if (index < thumbnailIndex) {
      setThumbnailIndex(thumbnailIndex - 1);
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
            <TerminalText className="text-sm text-terminal-muted mb-2">
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
          caption: "Save changes",
          onPress: onSubmit,
          disabled: isSaving,
          loading: isSaving,
        }}
      />
    </KeyboardAvoidingView>
  );
};
