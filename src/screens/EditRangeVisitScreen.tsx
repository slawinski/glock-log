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
import { RangeVisitInput } from "../types/rangeVisit";
import { Firearm } from "../types/firearm";
import { api } from "../services/api";
import { Terminal, TerminalText } from "../components/Terminal";

type EditRangeVisitScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditRangeVisit"
>;

type EditRangeVisitScreenRouteProp = RouteProp<
  RootStackParamList,
  "EditRangeVisit"
>;

export default function EditRangeVisitScreen() {
  const navigation = useNavigation<EditRangeVisitScreenNavigationProp>();
  const route = useRoute<EditRangeVisitScreenRouteProp>();
  const [formData, setFormData] = useState<RangeVisitInput>({
    date: new Date(),
    location: "",
    notes: "",
    firearmsUsed: [],
    roundsFired: 0,
    photos: [],
  });
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.id) {
      fetchVisit();
    }
    fetchFirearms();
  }, [route.params?.id]);

  const fetchVisit = async () => {
    try {
      setLoading(true);
      const data = await api.getRangeVisit(route.params!.id);
      setFormData({
        date: new Date(data.date),
        location: data.location,
        notes: data.notes || "",
        firearmsUsed: data.firearmsUsed,
        roundsFired: data.roundsFired,
        photos: data.photos,
      });
    } catch (error) {
      console.error("Error fetching range visit:", error);
      Alert.alert("Error", "Failed to load range visit data");
    } finally {
      setLoading(false);
    }
  };

  const fetchFirearms = async () => {
    try {
      const data = await api.getFirearms();
      setFirearms(data);
    } catch (error) {
      console.error("Error fetching firearms:", error);
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
      if (!formData.location || formData.firearmsUsed.length === 0) {
        Alert.alert("Error", "Location and at least one firearm are required");
        return;
      }

      await api.updateRangeVisit(route.params.id, formData);
      navigation.goBack();
    } catch (error) {
      console.error("Error updating range visit:", error);
      Alert.alert("Error", "Failed to update range visit. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleFirearmSelection = (firearmId: string) => {
    setFormData((prev) => ({
      ...prev,
      firearmsUsed: prev.firearmsUsed.includes(firearmId)
        ? prev.firearmsUsed.filter((id) => id !== firearmId)
        : [...prev.firearmsUsed, firearmId],
    }));
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
        <Terminal title="EDIT RANGE VISIT">
          <View className="mb-4">
            <TerminalText className="text-lg mb-2">
              VISIT INFORMATION
            </TerminalText>
            <TextInput
              className="bg-terminal-bg border border-terminal-border p-2 mb-2 text-terminal-text font-terminal"
              placeholder="Location"
              placeholderTextColor="#003300"
              value={formData.location}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, location: text }))
              }
            />
            <TextInput
              className="bg-terminal-bg border border-terminal-border p-2 mb-2 text-terminal-text font-terminal"
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor="#003300"
              value={formData.date.toISOString().split("T")[0]}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  date: new Date(text),
                }))
              }
            />
            <TextInput
              className="bg-terminal-bg border border-terminal-border p-2 mb-2 text-terminal-text font-terminal"
              placeholder="Rounds Fired"
              placeholderTextColor="#003300"
              keyboardType="numeric"
              value={
                formData.roundsFired > 0 ? formData.roundsFired.toString() : ""
              }
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  roundsFired: parseInt(text) || 0,
                }))
              }
            />
            <TextInput
              className="bg-terminal-bg border border-terminal-border p-2 text-terminal-text font-terminal"
              placeholder="Notes (optional)"
              placeholderTextColor="#003300"
              value={formData.notes}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, notes: text }))
              }
              multiline
            />
          </View>

          <View className="mb-4">
            <TerminalText className="text-lg mb-2">FIREARMS USED</TerminalText>
            {firearms.map((firearm) => (
              <TouchableOpacity
                key={firearm.id}
                onPress={() => toggleFirearmSelection(firearm.id)}
                className={`border border-terminal-border p-2 mb-2 ${
                  formData.firearmsUsed.includes(firearm.id)
                    ? "bg-terminal-selection"
                    : ""
                }`}
              >
                <TerminalText>
                  {firearm.modelName} ({firearm.caliber})
                </TerminalText>
              </TouchableOpacity>
            ))}
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
