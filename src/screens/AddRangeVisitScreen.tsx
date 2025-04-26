import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView, Image, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import * as ImagePicker from "react-native-image-picker";
import { storage } from "../services/storage";
import { TerminalText, TerminalInput } from "../components/Terminal";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  rangeVisitInputSchema,
  RangeVisitInput,
} from "../validation/inputSchemas";

type AddRangeVisitScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddRangeVisit"
>;

export default function AddRangeVisitScreen() {
  const navigation = useNavigation<AddRangeVisitScreenNavigationProp>();
  const [firearms, setFirearms] = useState<{ id: string; modelName: string }[]>(
    []
  );
  const [selectedFirearms, setSelectedFirearms] = useState<string[]>([]);
  const [roundsPerFirearm, setRoundsPerFirearm] = useState<{
    [key: string]: string;
  }>({});
  const [formData, setFormData] = useState<RangeVisitInput>({
    date: new Date().toISOString(),
    location: "",
    notes: "",
    photos: [],
    firearmsUsed: [],
    roundsPerFirearm: {},
    ammunitionUsed: {},
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const loadFirearms = async () => {
      try {
        const loadedFirearms = await storage.getFirearms();
        setFirearms(
          loadedFirearms.map((f) => ({ id: f.id, modelName: f.modelName }))
        );
      } catch (error) {
        console.error("Error loading firearms:", error);
        setError("Failed to load firearms");
      }
    };
    loadFirearms();
  }, []);

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
            photos: [...(prev.photos || []), response.assets![0].uri!],
          }));
        }
      }
    );
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      // Prepare the data for validation
      const visitData: RangeVisitInput = {
        ...formData,
        firearmsUsed: selectedFirearms,
        roundsPerFirearm: roundsPerFirearm,
        ammunitionUsed: {},
      };

      // Validate form data using Zod
      const validationResult = rangeVisitInputSchema.safeParse(visitData);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0].message;
        Alert.alert("Validation error", errorMessage);
        return;
      }

      await storage.saveRangeVisit(visitData);
      navigation.goBack();
    } catch (error) {
      console.error("Error creating range visit:", error);
      Alert.alert("Error", "Failed to create range visit. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i: number) => i !== index),
    }));
  };

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
      <View className="mb-4">
        <TerminalText>LOCATION</TerminalText>
        <TerminalInput
          value={formData.location}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, location: text }))
          }
          placeholder="Enter range location"
        />
      </View>

      <View className="mb-4">
        <TerminalText>DATE</TerminalText>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="border border-terminal-border p-2"
        >
          <TerminalText>
            {new Date(formData.date).toLocaleDateString()}
          </TerminalText>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(formData.date)}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setFormData((prev) => ({
                  ...prev,
                  date: selectedDate.toISOString(),
                }));
              }
            }}
          />
        )}
      </View>

      <View className="mb-4">
        <TerminalText>FIREARMS USED</TerminalText>
        {firearms.map((firearm) => (
          <View key={firearm.id} className="mb-2">
            <TouchableOpacity
              onPress={() => {
                if (selectedFirearms.includes(firearm.id)) {
                  setSelectedFirearms((prev) =>
                    prev.filter((id) => id !== firearm.id)
                  );
                  setRoundsPerFirearm((prev) => {
                    const newRounds = { ...prev };
                    delete newRounds[firearm.id];
                    return newRounds;
                  });
                } else {
                  setSelectedFirearms((prev) => [...prev, firearm.id]);
                }
              }}
              className={`border p-2 ${
                selectedFirearms.includes(firearm.id)
                  ? "border-terminal-accent"
                  : "border-terminal-border"
              }`}
            >
              <TerminalText>{firearm.modelName}</TerminalText>
            </TouchableOpacity>
            {selectedFirearms.includes(firearm.id) && (
              <TerminalInput
                value={roundsPerFirearm[firearm.id] || ""}
                onChangeText={(text) =>
                  setRoundsPerFirearm((prev) => ({
                    ...prev,
                    [firearm.id]: text,
                  }))
                }
                placeholder="Rounds fired"
                keyboardType="numeric"
              />
            )}
          </View>
        ))}
      </View>

      <View className="mb-4">
        <TerminalText>PHOTOS</TerminalText>
        <TouchableOpacity
          onPress={handleImagePick}
          className="border border-terminal-border p-3 mb-2"
        >
          <TerminalText>ADD PHOTO</TerminalText>
        </TouchableOpacity>
        <ScrollView horizontal className="flex-row">
          {formData.photos?.map((photo, index) => (
            <View key={index} className="relative">
              <Image source={{ uri: photo }} className="w-40 h-40 m-1" />
              <TouchableOpacity
                onPress={() => handleDeletePhoto(index)}
                className="absolute top-0 right-0 bg-terminal-error p-1"
              >
                <TerminalText className="text-xs">X</TerminalText>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
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
          <TerminalText>{saving ? "SAVING..." : "SAVE VISIT"}</TerminalText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
