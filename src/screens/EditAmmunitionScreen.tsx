import React, { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { Terminal, TerminalText, TerminalInput } from "../components/Terminal";
import { api } from "../services/api";
import { Ammunition } from "../types/ammunition";
import DateTimePicker from "@react-native-community/datetimepicker";

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
  const [ammunition, setAmmunition] = useState<Ammunition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchAmmunition();
  }, []);

  const fetchAmmunition = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAmmunition();
      const foundAmmunition = data.find((item) => item.id === route.params.id);
      if (foundAmmunition) {
        setAmmunition(foundAmmunition);
      } else {
        setError("Ammunition not found");
      }
    } catch (error) {
      console.error("Error fetching ammunition:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch ammunition"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!ammunition) return;

    try {
      setLoading(true);
      setError(null);

      await api.updateAmmunition(ammunition.id, {
        caliber: ammunition.caliber,
        brand: ammunition.brand,
        grain: ammunition.grain,
        quantity: ammunition.quantity,
        datePurchased: ammunition.datePurchased,
        amountPaid: ammunition.amountPaid,
        notes: ammunition.notes,
      });

      navigation.goBack();
    } catch (error) {
      console.error("Error updating ammunition:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update ammunition"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && !ammunition) {
    return (
      <View className="flex-1 bg-terminal-bg p-4 justify-center items-center">
        <TerminalText>LOADING...</TerminalText>
      </View>
    );
  }

  if (error || !ammunition) {
    return (
      <View className="flex-1 bg-terminal-bg p-4 justify-center items-center">
        <TerminalText className="text-terminal-error mb-4">
          {error || "Ammunition not found"}
        </TerminalText>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>GO BACK</TerminalText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-terminal-bg p-4">
      <View className="mb-4">
        <TerminalText>CALIBER</TerminalText>
        <TerminalInput
          value={ammunition.caliber}
          onChangeText={(text) =>
            setAmmunition({ ...ammunition, caliber: text })
          }
          placeholder="e.g., 9mm"
        />
      </View>

      <View className="mb-4">
        <TerminalText>BRAND</TerminalText>
        <TerminalInput
          value={ammunition.brand}
          onChangeText={(text) => setAmmunition({ ...ammunition, brand: text })}
          placeholder="e.g., Federal"
        />
      </View>

      <View className="mb-4">
        <TerminalText>GRAIN</TerminalText>
        <TerminalInput
          value={ammunition.grain.toString()}
          onChangeText={(text) =>
            setAmmunition({ ...ammunition, grain: parseInt(text) || 0 })
          }
          placeholder="e.g., 115"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-4">
        <TerminalText>QUANTITY</TerminalText>
        <TerminalInput
          value={ammunition.quantity.toString()}
          onChangeText={(text) =>
            setAmmunition({ ...ammunition, quantity: parseInt(text) || 0 })
          }
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
            {new Date(ammunition.datePurchased).toLocaleDateString()}
          </TerminalText>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(ammunition.datePurchased)}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setAmmunition({
                  ...ammunition,
                  datePurchased: selectedDate.toISOString(),
                });
              }
            }}
          />
        )}
      </View>

      <View className="mb-4">
        <TerminalText>AMOUNT PAID</TerminalText>
        <TerminalInput
          value={ammunition.amountPaid.toString()}
          onChangeText={(text) =>
            setAmmunition({ ...ammunition, amountPaid: parseFloat(text) || 0 })
          }
          placeholder="e.g., 299.99"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-4">
        <TerminalText>NOTES</TerminalText>
        <TerminalInput
          value={ammunition.notes || ""}
          onChangeText={(text) => setAmmunition({ ...ammunition, notes: text })}
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
          disabled={loading}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>{loading ? "SAVING..." : "SAVE CHANGES"}</TerminalText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
