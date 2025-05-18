import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { TerminalText } from "../components/TerminalText";
import { TerminalInput } from "../components/TerminalInput";
import { storage } from "../services/storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ammunitionInputSchema,
  AmmunitionInput,
} from "../validation/inputSchemas";

type AddAmmunitionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddAmmunition"
>;

export default function AddAmmunitionScreen() {
  const navigation = useNavigation<AddAmmunitionScreenNavigationProp>();
  const [formData, setFormData] = useState<AmmunitionInput>({
    caliber: "",
    brand: "",
    grain: "",
    quantity: 0,
    datePurchased: new Date().toISOString(),
    amountPaid: 0,
    notes: "",
    photos: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate form data using Zod
      const validationResult = ammunitionInputSchema.safeParse(formData);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0].message;
        Alert.alert("Validation error", errorMessage);
        return;
      }

      await storage.saveAmmunition(formData);
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
        />
      </View>

      <View className="mb-4">
        <TerminalText>QUANTITY</TerminalText>
        <TerminalInput
          value={formData.quantity.toString()}
          onChangeText={(text) => {
            const quantity = parseInt(text) || 0;
            setFormData((prev) => ({ ...prev, quantity }));
          }}
          placeholder="e.g., 1000"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-4">
        <TerminalText>DATE PURCHASED</TerminalText>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="border border-terminal-border p-2"
        >
          <TerminalText>
            {new Date(formData.datePurchased).toLocaleDateString()}
          </TerminalText>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(formData.datePurchased)}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setFormData((prev) => ({
                  ...prev,
                  datePurchased: selectedDate.toISOString(),
                }));
              }
            }}
          />
        )}
      </View>

      <View className="mb-4">
        <TerminalText>AMOUNT PAID</TerminalText>
        <TerminalInput
          value={formData.amountPaid.toString()}
          onChangeText={(text) => {
            const amountPaid = parseFloat(text) || 0;
            setFormData((prev) => ({ ...prev, amountPaid }));
          }}
          placeholder="e.g., 299.99"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-4">
        <TerminalText>NOTES</TerminalText>
        <TerminalInput
          value={formData.notes || ""}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, notes: text }))
          }
          placeholder="Optional notes"
          multiline
        />
      </View>

      {error && (
        <View className="mb-4">
          <TerminalText className="text-terminal-error">{error}</TerminalText>
        </View>
      )}

      <View className="flex-row justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>CANCEL</TerminalText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={saving}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>
            {saving ? "SAVING..." : "SAVE AMMUNITION"}
          </TerminalText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
