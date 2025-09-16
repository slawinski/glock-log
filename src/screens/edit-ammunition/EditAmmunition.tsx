import React, { useState, useEffect, useCallback } from "react";
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

type EditAmmunitionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditAmmunition"
>;

type EditAmmunitionScreenRouteProp = RouteProp<
  RootStackParamList,
  "EditAmmunition"
>;

type AmmunitionFormData = Omit<
  AmmunitionInput,
  "quantity" | "amountPaid" | "grain"
> & {
  quantity: number | null;
  amountPaid: number | null;
  grain: string | null;
};

export const EditAmmunition = () => {
  const navigation = useNavigation<EditAmmunitionScreenNavigationProp>();
  const route = useRoute<EditAmmunitionScreenRouteProp>();
  const [formData, setFormData] = useState<AmmunitionFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAmmunition = useCallback(async () => {
    try {
      setLoading(true);
      const ammunitionList = await storage.getAmmunition();
      const ammunition = ammunitionList.find((a) => a.id === route.params!.id);
      if (ammunition) {
        setFormData({
          ...ammunition,
          notes: ammunition.notes || "",
          photos: ammunition.photos || [],
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
  }, [route.params?.id]);

  useEffect(() => {
    if (route.params?.id) {
      fetchAmmunition();
    }
  }, [route.params?.id, fetchAmmunition]);

  const handleSubmit = async () => {
    if (!formData) return;

    try {
      setSaving(true);

      const dataToValidate = {
        ...formData,
        grain: formData.grain || "",
        quantity: formData.quantity || 0,
        amountPaid: formData.amountPaid || 0,
      };

      // Validate form data using Zod
      const validationResult = ammunitionInputSchema.safeParse(dataToValidate);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0].message;
        Alert.alert("Validation error", errorMessage);
        setSaving(false);
        return;
      }

      await storage.saveAmmunition(validationResult.data);
      navigation.goBack();
    } catch (error) {
      console.error("Error updating ammunition:", error);
      Alert.alert("Error", "Failed to update ammunition. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (
    field: keyof AmmunitionFormData,
    value: string | number | null
  ) => {
    if (formData) {
      setFormData({ ...formData, [field]: value });
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

  if (error || !formData) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <TerminalText className="text-terminal-error text-lg">
          {error || "Ammunition data could not be loaded."}
        </TerminalText>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          <TerminalText className="text-2xl mb-6">EDIT AMMUNITION</TerminalText>

          <View className="mb-4">
            <TerminalText>CALIBER</TerminalText>
            <TerminalInput
              value={formData.caliber}
              onChangeText={(text) => handleFormChange("caliber", text)}
              placeholder="e.g., 9mm"
            />
          </View>

      <View className="mb-4">
        <TerminalText>BRAND</TerminalText>
        <TerminalInput
          value={formData.brand}
          onChangeText={(text) => handleFormChange("brand", text)}
          placeholder="e.g., Federal"
        />
      </View>

      <View className="mb-4">
        <TerminalText>GRAIN</TerminalText>
        <TerminalInput
          value={formData.grain}
          onChangeText={(text) => handleFormChange("grain", text)}
          placeholder="e.g., 115"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-4">
        <TerminalText>QUANTITY</TerminalText>
        <TerminalInput
          value={formData.quantity}
          onChangeText={(text) => {
            const quantity = parseInt(text);
            handleFormChange("quantity", isNaN(quantity) ? null : quantity);
          }}
          placeholder="e.g., 1000"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-4">
        <TerminalText>AMOUNT PAID</TerminalText>
        <TerminalInput
          value={formData.amountPaid}
          onChangeText={(text) => {
            const amount = parseFloat(text);
            handleFormChange("amountPaid", isNaN(amount) ? null : amount);
          }}
          placeholder="e.g., 299.99"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-4">
        <TerminalText>DATE PURCHASED</TerminalText>
        <TerminalDatePicker
          value={new Date(formData.datePurchased)}
          onChange={(date) =>
            handleFormChange("datePurchased", date.toISOString())
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
          onChangeText={(text) => handleFormChange("notes", text)}
          placeholder="Optional notes"
          multiline
        />
      </View>

          <View className="flex-1" />

          <BottomButtonGroup
            buttons={[
              {
                caption: "CANCEL",
                onPress: () => navigation.goBack(),
              },
              {
                caption: saving ? "SAVING..." : "SAVE CHANGES",
                onPress: handleSubmit,
                disabled: saving,
              },
            ]}
          />
        </View>
      </ScrollView>
    </View>
  );
}
