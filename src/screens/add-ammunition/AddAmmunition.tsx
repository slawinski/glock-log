import React, { useState, useEffect } from "react";
import { View, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import {
  TerminalText,
  TerminalInput,
  TerminalDatePicker,
  BottomButtonGroup,
} from "../../components";
import { storage } from "../../services/storage-new";
import {
  ammunitionInputSchema,
  AmmunitionInput,
} from "../../validation/inputSchemas";

type AddAmmunitionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddAmmunition"
>;

type AmmunitionFormData = Omit<
  AmmunitionInput,
  "quantity" | "amountPaid" | "grain"
> & {
  quantity: number | null;
  amountPaid: number | null;
  grain: string | null;
};

export const AddAmmunition = () => {
  const navigation = useNavigation<AddAmmunitionScreenNavigationProp>();
  const [formData, setFormData] = useState<AmmunitionFormData>({
    caliber: "",
    brand: "",
    grain: null,
    quantity: null,
    datePurchased: new Date().toISOString(),
    amountPaid: null,
    notes: "",
    photos: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [pricePerRound, setPricePerRound] = useState<number | null>(null);

  useEffect(() => {
    if (formData.amountPaid && formData.quantity) {
      setPricePerRound(formData.amountPaid / formData.quantity);
    } else {
      setPricePerRound(null);
    }
  }, [formData.amountPaid, formData.quantity]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);
      setDateError(null);

      const purchaseDate = new Date(formData.datePurchased);
      if (purchaseDate > new Date()) {
        setDateError("Purchase date cannot be in the future");
        return;
      }

      const dataToValidate = {
        ...formData,
        grain: formData.grain || "",
        quantity: formData.quantity || 0,
        amountPaid: formData.amountPaid || 0,
        pricePerRound: pricePerRound,
      };

      const validationResult = ammunitionInputSchema.safeParse(dataToValidate);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0].message;
        Alert.alert("Validation error", errorMessage);
        return;
      }

      await storage.saveAmmunition(validationResult.data);
      navigation.goBack();
    } catch (error) {
      console.error("Error creating ammunition:", error);
      Alert.alert("Error", "Failed to create ammunition. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-terminal-bg p-4">
      <View className="mb-4">
        <TerminalText>CALIBER</TerminalText>
        <TerminalInput
          value={formData.caliber}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, caliber: text }))
          }
          placeholder="e.g., 9mm"
          testID="caliber-input"
        />
      </View>

      <View className="mb-4">
        <TerminalText>BRAND</TerminalText>
        <TerminalInput
          value={formData.brand}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, brand: text }))
          }
          placeholder="e.g., Federal"
          testID="brand-input"
        />
      </View>

      <View className="mb-4">
        <TerminalText>GRAIN</TerminalText>
        <TerminalInput
          value={formData.grain}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, grain: text }))
          }
          placeholder="e.g., 115"
          keyboardType="numeric"
          testID="grain-input"
        />
      </View>

      <TerminalDatePicker
        label="DATE PURCHASED"
        value={new Date(formData.datePurchased)}
        onChange={(date) => {
          setDateError(null);
          setFormData((prev) => ({
            ...prev,
            datePurchased: date.toISOString(),
          }));
        }}
        error={dateError || undefined}
        maxDate={new Date()}
        allowClear={false}
        placeholder="Select purchase date"
      />

      <View className="mb-4">
        <TerminalText>QUANTITY</TerminalText>
        <TerminalInput
          value={formData.quantity}
          onChangeText={(text) => {
            const quantity = parseInt(text);
            setFormData((prev) => ({
              ...prev,
              quantity: isNaN(quantity) ? null : quantity,
            }));
          }}
          placeholder="e.g., 1000"
          keyboardType="numeric"
          testID="quantity-input"
        />
      </View>

      <View className="mb-4">
        <TerminalText>AMOUNT PAID</TerminalText>
        <TerminalInput
          value={formData.amountPaid}
          onChangeText={(text) => {
            const amountPaid = parseFloat(text);
            setFormData((prev) => ({
              ...prev,
              amountPaid: isNaN(amountPaid) ? null : amountPaid,
            }));
          }}
          placeholder="e.g., 299.99"
          keyboardType="numeric"
          testID="amount-paid-input"
        />
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
        <TerminalInput
          value={formData.notes || ""}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, notes: text }))
          }
          placeholder="Optional notes"
          multiline
          testID="notes-input"
        />
      </View>

      {error && (
        <View className="mb-4">
          <TerminalText className="text-terminal-error">{error}</TerminalText>
        </View>
      )}

      <BottomButtonGroup
        buttons={[
          {
            caption: "CANCEL",
            onPress: () => navigation.goBack(),
          },
          {
            caption: saving ? "SAVING..." : "SAVE AMMUNITION",
            onPress: handleSubmit,
            disabled: saving,
          },
        ]}
      />
    </ScrollView>
  );
};
