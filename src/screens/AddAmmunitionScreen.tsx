import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { Terminal, TerminalText, TerminalInput } from "../components/Terminal";
import { api } from "../services/api";
import DateTimePicker from "@react-native-community/datetimepicker";

type AddAmmunitionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddAmmunition"
>;

export default function AddAmmunitionScreen() {
  const navigation = useNavigation<AddAmmunitionScreenNavigationProp>();
  const [caliber, setCaliber] = useState("");
  const [brand, setBrand] = useState("");
  const [grain, setGrain] = useState("");
  const [quantity, setQuantity] = useState("");
  const [datePurchased, setDatePurchased] = useState(new Date());
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = async () => {
    if (!caliber || !brand || !grain || !quantity || !amountPaid) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await api.createAmmunition({
        caliber,
        brand,
        grain: parseInt(grain),
        quantity: parseInt(quantity),
        datePurchased: datePurchased.toISOString(),
        amountPaid: parseFloat(amountPaid),
        notes,
      });

      navigation.goBack();
    } catch (error) {
      console.error("Error creating ammunition:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create ammunition"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-terminal-bg p-4">
      <View className="mb-4">
        <TerminalText>CALIBER</TerminalText>
        <TerminalInput
          value={caliber}
          onChangeText={setCaliber}
          placeholder="e.g., 9mm"
        />
      </View>

      <View className="mb-4">
        <TerminalText>BRAND</TerminalText>
        <TerminalInput
          value={brand}
          onChangeText={setBrand}
          placeholder="e.g., Federal"
        />
      </View>

      <View className="mb-4">
        <TerminalText>GRAIN</TerminalText>
        <TerminalInput
          value={grain}
          onChangeText={setGrain}
          placeholder="e.g., 115"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-4">
        <TerminalText>QUANTITY</TerminalText>
        <TerminalInput
          value={quantity}
          onChangeText={setQuantity}
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
          <TerminalText>{datePurchased.toLocaleDateString()}</TerminalText>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={datePurchased}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDatePurchased(selectedDate);
              }
            }}
          />
        )}
      </View>

      <View className="mb-4">
        <TerminalText>AMOUNT PAID</TerminalText>
        <TerminalInput
          value={amountPaid}
          onChangeText={setAmountPaid}
          placeholder="e.g., 299.99"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-4">
        <TerminalText>NOTES</TerminalText>
        <TerminalInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes"
          multiline
        />
      </View>

      {error && (
        <View className="mb-4">
          <TerminalText className="text-terminal-error">{error}</TerminalText>
        </View>
      )}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        className="border border-terminal-border p-4 items-center"
      >
        <TerminalText>{loading ? "SAVING..." : "SAVE AMMUNITION"}</TerminalText>
      </TouchableOpacity>
    </ScrollView>
  );
}
