import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Controller } from "react-hook-form";
import { RootStackParamList } from "../../app/App";
import {
  BottomButtonGroup,
  ErrorDisplay,
  LoadingScreen,
  TerminalDatePicker,
  TerminalInput,
  TerminalText,
} from "../../components";
import { handleError } from "../../services/error-handler";
import { storage } from "../../services/storage-new";
import { useEntityForm } from "../../hooks";
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

export const EditAmmunition = () => {
  const navigation = useNavigation<EditAmmunitionScreenNavigationProp>();
  const route = useRoute<EditAmmunitionScreenRouteProp>();
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const saveAmmunition = async (data: AmmunitionInput) => {
    await storage.saveAmmunition({ ...data, photos });
    navigation.goBack();
  };

  const { form, isSaving, onSubmit } = useEntityForm<
    AmmunitionInput,
    AmmunitionFormData
  >(ammunitionInputSchema, saveAmmunition, {
      defaultValues: {
        caliber: "",
        brand: "",
        grain: "",
        quantity: null,
        datePurchased: new Date().toISOString(),
        amountPaid: null,
        notes: "",
      },
      entityName: "update ammunition",
    }
  );
  const {
    control,
    reset,
    formState: { errors },
  } = form;

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
          quantity: ammunition.quantity,
          datePurchased: ammunition.datePurchased,
          amountPaid: ammunition.amountPaid,
          notes: ammunition.notes || "",
        });
        setPhotos(ammunition.photos || []);
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
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          <TerminalText className="text-2xl mb-6">EDIT AMMUNITION</TerminalText>

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
            <TerminalText>BRAND</TerminalText>
            <Controller
              control={control}
              name="brand"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TerminalInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g., Federal"
                  error={error?.message}
                />
              )}
            />
            {errors.brand && (
              <TerminalText className="text-terminal-error text-sm mt-1">
                {errors.brand.message}
              </TerminalText>
            )}
          </View>

          <View className="mb-4">
            <TerminalText>GRAIN</TerminalText>
            <Controller
              control={control}
              name="grain"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TerminalInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g., 115"
                  keyboardType="numeric"
                  error={error?.message}
                />
              )}
            />
            {errors.grain && (
              <TerminalText className="text-terminal-error text-sm mt-1">
                {errors.grain.message}
              </TerminalText>
            )}
          </View>

          <View className="mb-4">
            <TerminalText>QUANTITY</TerminalText>
            <Controller
              control={control}
              name="quantity"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TerminalInput
                  value={value}
                  onChangeText={(text) => {
                    const quantity = parseInt(text);
                    onChange(isNaN(quantity) ? null : quantity);
                  }}
                  placeholder="e.g., 1000"
                  keyboardType="numeric"
                  error={error?.message}
                />
              )}
            />
            {errors.quantity && (
              <TerminalText className="text-terminal-error text-sm mt-1">
                {errors.quantity.message}
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
                  placeholder="e.g., 299.99"
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
            <TerminalText>NOTES</TerminalText>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TerminalInput
                  value={value ?? ""}
                  onChangeText={onChange}
                  placeholder="Optional notes"
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
