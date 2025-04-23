import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import * as ImagePicker from "react-native-image-picker";
import { FirearmInput } from "../types/firearm";
import { api } from "../services/api";
import { Terminal, TerminalText, TerminalInput } from "../components/Terminal";

type EditFirearmScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditFirearm"
>;
type EditFirearmScreenRouteProp = RouteProp<RootStackParamList, "EditFirearm">;

export default function EditFirearmScreen() {
  const navigation = useNavigation<EditFirearmScreenNavigationProp>();
  const route = useRoute<EditFirearmScreenRouteProp>();
  const [formData, setFormData] = useState<FirearmInput>({
    modelName: "",
    caliber: "",
    datePurchased: new Date(),
    amountPaid: 0,
    photos: [],
    roundsFired: 0,
    totalRoundsInInventory: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFirearm();
  }, [route.params.id]);

  const fetchFirearm = async () => {
    try {
      setLoading(true);
      setError(null);
      const firearm = await api.getFirearm(route.params.id);
      setFormData({
        modelName: firearm.modelName,
        caliber: firearm.caliber,
        datePurchased: firearm.datePurchased,
        amountPaid: firearm.amountPaid,
        photos: firearm.photos,
        roundsFired: firearm.roundsFired,
        totalRoundsInInventory: firearm.totalRoundsInInventory,
      });
    } catch (error) {
      console.error("Error fetching firearm:", error);
      setError("Failed to load firearm details");
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = () => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: "photo",
        quality: 0.8,
      },
      (response) => {
        if (response.assets && response.assets[0].uri) {
          setFormData((prev) => ({
            ...prev,
            photos: [...prev.photos, response.assets![0].uri!],
          }));
        }
      }
    );
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!formData.modelName || !formData.caliber) {
        Alert.alert("Error", "Model name and caliber are required");
        return;
      }

      await api.updateFirearm(route.params.id, formData);
      navigation.goBack();
    } catch (error) {
      console.error("Error updating firearm:", error);
      Alert.alert("Error", "Failed to update firearm. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
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
    <ScrollView className="flex-1 bg-terminal-bg">
      <View className="p-4">
        <Terminal title="EDIT ENTRY">
          <View className="mb-4">
            <TerminalText className="text-lg mb-2">
              MODEL INFORMATION
            </TerminalText>
            <TextInput
              className="bg-terminal-bg border border-terminal-border p-2 mb-2 text-terminal-text font-terminal"
              placeholder="Model Name"
              placeholderTextColor="#003300"
              value={formData.modelName}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, modelName: text }))
              }
            />
            <TextInput
              className="bg-terminal-bg border border-terminal-border p-2 text-terminal-text font-terminal"
              placeholder="Caliber"
              placeholderTextColor="#003300"
              value={formData.caliber}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, caliber: text }))
              }
            />
          </View>

          <View className="mb-4">
            <TerminalText className="text-lg mb-2">
              PURCHASE DETAILS
            </TerminalText>
            <TextInput
              className="bg-terminal-bg border border-terminal-border p-2 mb-2 text-terminal-text font-terminal"
              placeholder="Amount Paid"
              placeholderTextColor="#003300"
              keyboardType="numeric"
              value={formData.amountPaid.toString()}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  amountPaid: parseFloat(text) || 0,
                }))
              }
            />
            <TextInput
              className="bg-terminal-bg border border-terminal-border p-2 text-terminal-text font-terminal"
              placeholder="Date Purchased (YYYY-MM-DD)"
              placeholderTextColor="#003300"
              value={formData.datePurchased.toISOString().split("T")[0]}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  datePurchased: new Date(text),
                }))
              }
            />
          </View>

          <View className="mb-4">
            <TerminalText className="text-lg mb-2">AMMUNITION</TerminalText>
            <TextInput
              className="bg-terminal-bg border border-terminal-border p-2 mb-2 text-terminal-text font-terminal"
              placeholder="Rounds Fired"
              placeholderTextColor="#003300"
              keyboardType="numeric"
              value={formData.roundsFired.toString()}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  roundsFired: parseInt(text) || 0,
                }))
              }
            />
            <TextInput
              className="bg-terminal-bg border border-terminal-border p-2 text-terminal-text font-terminal"
              placeholder="Total Rounds in Inventory"
              placeholderTextColor="#003300"
              keyboardType="numeric"
              value={formData.totalRoundsInInventory.toString()}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  totalRoundsInInventory: parseInt(text) || 0,
                }))
              }
            />
          </View>

          <View className="mb-4">
            <TerminalText className="text-lg mb-2">PHOTOS</TerminalText>
            <TouchableOpacity
              onPress={handleImagePick}
              className="border border-terminal-border p-3 mb-2"
            >
              <TerminalText>ADD PHOTO</TerminalText>
            </TouchableOpacity>
            <View className="flex-row flex-wrap">
              {formData.photos.map((photo, index) => (
                <View key={index} className="relative">
                  <Image
                    source={{ uri: photo }}
                    className="w-20 h-20 m-1 border border-terminal-border"
                  />
                  <TouchableOpacity
                    onPress={() => handleDeletePhoto(index)}
                    className="absolute top-0 right-0 border border-terminal-error bg-terminal-bg w-6 h-6 items-center justify-center"
                  >
                    <TerminalText className="text-terminal-error">
                      ×
                    </TerminalText>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            className={`border border-terminal-border p-4 ${
              saving ? "opacity-50" : ""
            }`}
          >
            {saving ? (
              <ActivityIndicator color="#00ff00" />
            ) : (
              <TerminalText>SAVE CHANGES</TerminalText>
            )}
          </TouchableOpacity>
        </Terminal>
      </View>
    </ScrollView>
  );
}
