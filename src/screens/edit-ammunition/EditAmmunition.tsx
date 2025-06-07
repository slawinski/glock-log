import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../../App";
import { TerminalText } from "../../components/TerminalText";
import { TerminalInput } from "../../components/TerminalInput";
import TerminalDatePicker from "../../components/TerminalDatePicker";
import { storage } from "../../services/storage";
import {
  ammunitionInputSchema,
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

export default function EditAmmunitionScreen() {
  const navigation = useNavigation<EditAmmunitionScreenNavigationProp>();
  const route = useRoute<EditAmmunitionScreenRouteProp>();
  const [formData, setFormData] = useState<AmmunitionInput>({
    caliber: "",
    brand: "",
    grain: "",
    quantity: 0,
    amountPaid: 0,
    datePurchased: new Date().toISOString(),
    notes: "",
    photos: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.id) {
      fetchAmmunition();
    }
  }, [route.params?.id]);

  const fetchAmmunition = async () => {
    try {
      setLoading(true);
      const ammunitionList = await storage.getAmmunition();
      const ammunition = ammunitionList.find((a) => a.id === route.params!.id);
      if (ammunition) {
        // Convert storage data to input data
        const { ...ammunitionData } = ammunition;
        setFormData({
          ...ammunitionData,
          notes: ammunitionData.notes || "",
          photos: ammunitionData.photos || [],
        });
      } else {
        setError("Ammunition not found");
      }
    } catch (error) {
      console.error("Error fetching ammunition:", error);
      Alert.alert("Error", "Failed to load ammunition data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

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
      console.error("Error updating ammunition:", error);
      Alert.alert("Error", "Failed to update ammunition. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <ActivityIndicator size="large" color="#00ff00" />
        <TerminalText className="mt-4">LOADING DATABASE...</TerminalText>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <TerminalText className="text-terminal-error text-lg">
          {error}
        </TerminalText>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-terminal-bg p-4">
      <TerminalText className="text-2xl mb-6">EDIT AMMUNITION</TerminalText>

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
          value={String(formData.quantity)}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, quantity: parseInt(text) || 0 }))
          }
          placeholder="e.g., 1000"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-4">
        <TerminalText>AMOUNT PAID</TerminalText>
        <TerminalInput
          value={String(formData.amountPaid)}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              amountPaid: parseFloat(text) || 0,
            }))
          }
          placeholder="e.g., 299.99"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-4">
        <TerminalText>DATE PURCHASED</TerminalText>
        <TerminalDatePicker
          value={new Date(formData.datePurchased)}
          onChange={(date) =>
            setFormData((prev) => ({
              ...prev,
              datePurchased: date.toISOString(),
            }))
          }
          label="PURCHASE DATE"
          maxDate={new Date()}
          placeholder="Select purchase date"
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
          <TerminalText>{saving ? "SAVING..." : "SAVE CHANGES"}</TerminalText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
