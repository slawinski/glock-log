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
import { Controller, useWatch } from "react-hook-form";
import { RootStackParamList } from "../../app/App";
import {
  ImageGallery,
  PlaceholderImagePicker,
  SectionHeading,
  StickyActionBar,
  TerminalText,
  TerminalInput,
  TerminalDatePicker,
} from "../../components";
import { storage } from "../../services/storage-new";
import { ammunitionPlaceholderImages } from "../../services/image-source-manager";
import { useEntityForm, useUnsavedChanges } from "../../hooks";
import { formatCurrency } from "../../utils";
import {
  ammunitionFormSchema,
  AmmunitionFormData,
  AmmunitionInput,
} from "../../validation/inputSchemas";

type AddAmmunitionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddAmmunition"
>;

const FIELD_ORDER = [
  "brand",
  "caliber",
  "grain",
  "quantity",
  "amountPaid",
  "datePurchased",
  "notes",
] as const;

export const AddAmmunition = () => {
  const navigation = useNavigation<AddAmmunitionScreenNavigationProp>();
  const scrollRef = useRef<ScrollView>(null);
  const fieldY = useRef<Record<string, number>>({});
  const [currency, setCurrency] = useState("USD");
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    const loadCurrency = async () => {
      try {
        const loaded = await storage.getCurrency();
        if (mounted) {
          setCurrency(loaded);
        }
      } catch {
        setCurrency("USD");
      }
    };
    loadCurrency();
    return () => {
      mounted = false;
    };
  }, []);

  const saveAmmunition = async (data: AmmunitionInput) => {
    const pricePerRound =
      data.amountPaid && data.quantity
        ? data.amountPaid / data.quantity
        : undefined;
    await storage.saveAmmunition({ ...data, photos, pricePerRound });
    form.reset(form.getValues());
    dirtyRef.current = false;
    navigation.goBack();
  };

  const { form, isSaving, onSubmit } = useEntityForm<
    AmmunitionInput,
    AmmunitionFormData
  >(ammunitionFormSchema, saveAmmunition, {
      defaultValues: {
        brand: "",
        caliber: "",
        grain: "",
        quantity: "",
        datePurchased: new Date().toISOString(),
        amountPaid: "",
        notes: "",
      },
      entityName: "create ammunition",
    }
  );
  const {
    control,
    setFocus,
    formState: { errors, isDirty },
  } = form;

  const dirtyRef = useRef(false);
  dirtyRef.current = isDirty || photos.length > 0;
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

  const handlePlaceholderSelect = (imageName: string) => {
    setPhotos([`placeholder:${imageName}`]);
  };

  const handleDeletePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const watchedAmountPaid = useWatch({ control, name: "amountPaid" });
  const watchedQuantity = useWatch({ control, name: "quantity" });
  const amount = Number(watchedAmountPaid);
  const quantity = Number(watchedQuantity);
  const pricePerRound =
    Number.isFinite(amount) && Number.isFinite(quantity) && quantity > 0
      ? amount / quantity
      : null;

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
          <SectionHeading title="AMMUNITION" />
          <View onLayout={captureY("brand")} className="mb-4">
            <TerminalText className="mb-1.5">BRAND *</TerminalText>
            <Controller
              control={control}
              name="brand"
              render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                <TerminalInput
                  value={value}
                  onChangeText={onChange}
                  ref={ref}
                  placeholder="e.g., Federal"
                  testID="brand-input"
                  error={error?.message}
                />
              )}
            />
            {errors.brand && (
              <TerminalText
                className="text-terminal-error text-sm mt-1"
                accessibilityLiveRegion="polite"
              >
                {errors.brand.message}
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

          <View onLayout={captureY("grain")} className="mb-4">
            <TerminalText className="mb-1.5">GRAIN *</TerminalText>
            <Controller
              control={control}
              name="grain"
              render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                <TerminalInput
                  value={value}
                  onChangeText={onChange}
                  ref={ref}
                  placeholder="e.g., 115"
                  keyboardType="numeric"
                  testID="grain-input"
                  error={error?.message}
                />
              )}
            />
            {errors.grain && (
              <TerminalText
                className="text-terminal-error text-sm mt-1"
                accessibilityLiveRegion="polite"
              >
                {errors.grain.message}
              </TerminalText>
            )}
          </View>

          <SectionHeading title="INVENTORY" className="mt-7" />
          <View onLayout={captureY("quantity")} className="mb-4">
            <TerminalText className="mb-1.5">QUANTITY *</TerminalText>
            <View className="flex-row items-center">
              <View className="flex-1 mr-2">
                <Controller
                  control={control}
                  name="quantity"
                  render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                    <TerminalInput
                      value={String(value ?? "")}
                      onChangeText={(text) => onChange(text)}
                      ref={ref}
                      placeholder="e.g., 1000"
                      keyboardType="numeric"
                      testID="quantity-input"
                      error={error?.message}
                    />
                  )}
                />
              </View>
              <TerminalText className="text-terminal-muted">rounds</TerminalText>
            </View>
            {errors.quantity && (
              <TerminalText
                className="text-terminal-error text-sm mt-1"
                accessibilityLiveRegion="polite"
              >
                {errors.quantity.message}
              </TerminalText>
            )}
          </View>

          <SectionHeading title="PURCHASE" className="mt-7" />
          <View onLayout={captureY("amountPaid")} className="mb-4">
            <TerminalText className="mb-1.5">TOTAL PAID</TerminalText>
            <Controller
              control={control}
              name="amountPaid"
              render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                <TerminalInput
                  value={String(value ?? "")}
                  onChangeText={(text) => onChange(text)}
                  ref={ref}
                  placeholder="e.g., 299.99"
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
            {pricePerRound !== null && (
              <TerminalText className="text-terminal-muted text-sm mt-1">
                PRICE PER ROUND: {formatCurrency(pricePerRound, currency)}
              </TerminalText>
            )}
          </View>

          <View onLayout={captureY("datePurchased")}>
            <Controller
              control={control}
              name="datePurchased"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TerminalDatePicker
                  label="PURCHASE DATE"
                  value={new Date(value)}
                  onChange={(date) => onChange(date.toISOString())}
                  error={error?.message}
                  maxDate={new Date()}
                  allowClear={false}
                  placeholder="Select purchase date"
                />
              )}
            />
          </View>

          <SectionHeading title="PHOTOS" className="mt-7" />
          <View className="mb-4">
            {photos.length > 0 && (
              <ImageGallery
                images={photos}
                onDeleteImage={handleDeletePhoto}
                size="medium"
                showDeleteButton={true}
              />
            )}
            {photos.length === 0 && (
              <PlaceholderImagePicker
                images={ammunitionPlaceholderImages}
                onSelect={handlePlaceholderSelect}
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
                  placeholder="Optional notes"
                  multiline
                  testID="notes-input"
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
          caption: "Save ammunition",
          onPress: onSubmit,
          disabled: isSaving,
          loading: isSaving,
        }}
      />
    </KeyboardAvoidingView>
  );
};
