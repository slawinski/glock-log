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
import { Controller, useWatch } from "react-hook-form";
import { RootStackParamList } from "../../app/App";
import {
  ErrorDisplay,
  LoadingScreen,
  SectionHeading,
  StickyActionBar,
  TerminalDatePicker,
  TerminalInput,
  TerminalText,
} from "../../components";
import { handleError } from "../../services/error-handler";
import { storage } from "../../services/storage-new";
import { useEntityForm, useUnsavedChanges } from "../../hooks";
import { formatCurrency } from "../../utils";
import {
  ammunitionInputSchema,
  AmmunitionFormData,
  AmmunitionInput,
} from "../../validation/inputSchemas";

type EditAmmunitionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditAmmunition"
>;

type EditAmmunitionScreenRouteProp = RouteProp<
  RootStackParamList,
  "EditAmmunition"
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

export const EditAmmunition = () => {
  const navigation = useNavigation<EditAmmunitionScreenNavigationProp>();
  const route = useRoute<EditAmmunitionScreenRouteProp>();
  const scrollRef = useRef<ScrollView>(null);
  const fieldY = useRef<Record<string, number>>({});
  const initialPhotosRef = useRef<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    initialPhotosRef.current = [...photos];
    navigation.goBack();
  };

  const { form, isSaving, onSubmit } = useEntityForm<
    AmmunitionInput,
    AmmunitionFormData
  >(ammunitionInputSchema, saveAmmunition, {
      defaultValues: {
        brand: "",
        caliber: "",
        grain: "",
        quantity: "",
        datePurchased: new Date().toISOString(),
        amountPaid: "",
        notes: "",
      },
      entityName: "update ammunition",
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

  const watchedAmountPaid = useWatch({ control, name: "amountPaid" });
  const watchedQuantity = useWatch({ control, name: "quantity" });
  const amount = Number(watchedAmountPaid);
  const quantity = Number(watchedQuantity);
  const pricePerRound =
    Number.isFinite(amount) && Number.isFinite(quantity) && quantity > 0
      ? amount / quantity
      : null;

  const fetchAmmunition = useCallback(async () => {
    try {
      setLoading(true);
      const ammunitionList = await storage.getAmmunition();
      const ammunition = ammunitionList.find((a) => a.id === route.params!.id);
      if (ammunition) {
        reset({
          id: ammunition.id,
          caliber: ammunition.caliber,
          brand: ammunition.brand,
          grain: ammunition.grain,
          quantity: String(ammunition.quantity),
          datePurchased: ammunition.datePurchased,
          amountPaid: String(ammunition.amountPaid),
          notes: ammunition.notes || "",
        });
        setPhotos(ammunition.photos || []);
        initialPhotosRef.current = ammunition.photos || [];
      } else {
        setError("Ammunition not found");
      }
    } catch (error) {
      handleError(error, "EditAmmunition.fetchAmmunition", { isUserFacing: true, userMessage: "Failed to load ammunition details. Please try again." });
      setError("Failed to load ammunition details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [route.params, reset]);

  useEffect(() => {
    if (route.params?.id) {
      fetchAmmunition();
    }
  }, [route.params?.id, fetchAmmunition]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <ErrorDisplay
        errorMessage={error}
        onRetry={fetchAmmunition}
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
