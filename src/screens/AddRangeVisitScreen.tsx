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
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import * as ImagePicker from "react-native-image-picker";
import { RangeVisitInput } from "../types/rangeVisit";
import { Firearm } from "../types/firearm";
import { api } from "../services/api";
import { Terminal, TerminalText, TerminalInput } from "../components/Terminal";

type AddRangeVisitScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddRangeVisit"
>;

export default function AddRangeVisitScreen() {
  const navigation = useNavigation<AddRangeVisitScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [formData, setFormData] = useState<RangeVisitInput>({
    date: new Date(),
    location: "",
    notes: "",
    firearmsUsed: [],
    roundsFired: 0,
    photos: [],
  });

  useEffect(() => {
    fetchFirearms();
  }, []);

  const fetchFirearms = async () => {
    try {
      const data = await api.getFirearms();
      setFirearms(data);
    } catch (error) {
      console.error("Error fetching firearms:", error);
      Alert.alert("Error", "Failed to load firearms");
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
      setLoading(true);

      // Validate required fields
      if (!formData.location || formData.firearmsUsed.length === 0) {
        Alert.alert(
          "Missing Information",
          `Please fill in all required fields:
          
          • Location: ${formData.location ? "✓" : "✗"} (Where did you shoot?)
          • Firearms: ${
            formData.firearmsUsed.length > 0 ? "✓" : "✗"
          } (Select at least one firearm)
          
          Tap on the fields above to add the missing information.`,
          [{ text: "OK" }]
        );
        return;
      }

      console.log("Submitting form data:", {
        location: formData.location,
        firearmsUsed: formData.firearmsUsed,
        date: formData.date,
        roundsFired: formData.roundsFired,
        notes: formData.notes,
        photos: formData.photos,
      });

      const response = await api.createRangeVisit(formData);
      console.log("Response from server:", response);
      navigation.goBack();
    } catch (error) {
      console.error("Error saving range visit:", error);
      Alert.alert(
        "Error",
        `Failed to save range visit:
        ${error instanceof Error ? error.message : "Unknown error"}
        
        Please check:
        1. Location is filled
        2. At least one firearm is selected
        3. Server is running
        4. Network connection is stable`
      );
    } finally {
      setLoading(false);
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

  return (
    <ScrollView className="flex-1 bg-terminal-bg">
      <View className="p-4">
        <Terminal title="NEW RANGE VISIT">
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
                <Image
                  key={index}
                  source={{ uri: photo }}
                  className="w-20 h-20 m-1 border border-terminal-border"
                />
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`border border-terminal-border p-4 ${
              loading ? "opacity-50" : ""
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#00ff00" />
            ) : (
              <TerminalText>SAVE VISIT</TerminalText>
            )}
          </TouchableOpacity>
        </Terminal>
      </View>
    </ScrollView>
  );
}
