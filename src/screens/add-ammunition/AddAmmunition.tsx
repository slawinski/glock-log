import React from "react";
import { View, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Controller, useWatch } from "react-hook-form";
import { RootStackParamList } from "../../app/App";
import {
  TerminalText,
  TerminalInput,
  TerminalDatePicker,
  BottomButtonGroup,
} from "../../components";
import { storage } from "../../services/storage-new";
import { useEntityForm } from "../../hooks";
import {
  ammunitionFormSchema,
  AmmunitionFormData,
  AmmunitionInput,
} from "../../validation/inputSchemas";

type AddAmmunitionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddAmmunition"
>;

export const AddAmmunition = () => {
  const navigation = useNavigation<AddAmmunitionScreenNavigationProp>();

  const saveAmmunition = async (data: AmmunitionInput) => {
    const pricePerRound =
      data.amountPaid && data.quantity
        ? data.amountPaid / data.quantity
        : undefined;
    await storage.saveAmmunition({ ...data, pricePerRound });
    navigation.goBack();
  };

  const { form, isSaving, onSubmit } = useEntityForm<
    AmmunitionInput,
    AmmunitionFormData
  >(ammunitionFormSchema, saveAmmunition, {
      defaultValues: {
        caliber: "",
        brand: "",
        grain: "",
        quantity: null,
        datePurchased: new Date().toISOString(),
        amountPaid: null,
        notes: "",
      },
      entityName: "create ammunition",
    }
  );
  const {
    control,
    formState: { errors },
  } = form;

  const watchedAmountPaid = useWatch({ control, name: "amountPaid" });
  const watchedQuantity = useWatch({ control, name: "quantity" });
  const pricePerRound =
    watchedAmountPaid && watchedQuantity
      ? watchedAmountPaid / watchedQuantity
      : null;

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
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
            <TerminalText>BRAND</TerminalText>
            <Controller
              control={control}
              name="brand"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TerminalInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g., Federal"
                  testID="brand-input"
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
                  testID="grain-input"
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

          <Controller
            control={control}
            name="datePurchased"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <TerminalDatePicker
                label="DATE PURCHASED"
                value={new Date(value)}
                onChange={(date) => onChange(date.toISOString())}
                error={error?.message}
                maxDate={new Date()}
                allowClear={false}
                placeholder="Select purchase date"
              />
            )}
          />

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
                  testID="quantity-input"
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
                    const amountPaid = parseFloat(text);
                    onChange(isNaN(amountPaid) ? null : amountPaid);
                  }}
                  placeholder="e.g., 299.99"
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

          {pricePerRound !== null && (
            <View className="mb-4">
              <TerminalText>
                PRICE PER ROUND: ${pricePerRound.toFixed(2)}
              </TerminalText>
            </View>
          )}

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
                  testID="notes-input"
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
                caption: isSaving ? "SAVING..." : "SAVE AMMUNITION",
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
