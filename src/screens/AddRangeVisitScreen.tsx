import React, { useState, useEffect } from "react";
import {
  View,
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
import { TerminalText, TerminalInput } from "../components/Terminal";
import DateTimePicker from "@react-native-community/datetimepicker";

type AddRangeVisitScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddRangeVisit"
>;

export default function AddRangeVisitScreen() {
  const navigation = useNavigation<AddRangeVisitScreenNavigationProp>();
  const [formData, setFormData] = useState<RangeVisitInput>({
    date: new Date(),
    location: "",
    notes: "",
    firearmsUsed: [],
    roundsPerFirearm: {},
    photos: [],
  });
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchFirearms();
  }, []);

  const fetchFirearms = async () => {
    try {
      setLoading(true);
      const data = await api.getFirearms();
      setFirearms(data);
    } catch (error) {
      console.error("Error fetching firearms:", error);
      Alert.alert("Error", "Failed to load firearms");
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
      if (!formData.location || formData.firearmsUsed.length === 0) {
        Alert.alert("Error", "Location and at least one firearm are required");
        return;
      }

      // Validate rounds fired for each selected firearm
      for (const firearmId of formData.firearmsUsed) {
        if (!formData.roundsPerFirearm[firearmId]) {
          const firearm = firearms.find((f) => f.id === firearmId);
          Alert.alert(
            "Error",
            `Please enter rounds fired for ${
              firearm?.modelName || "selected firearm"
            }`
          );
          return;
        }
      }

      await api.createRangeVisit(formData);
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
    <ScrollView className="flex-1 bg-terminal-bg p-4">
      <TerminalText className="text-2xl mb-6">NEW RANGE VISIT</TerminalText>

      <View className="mb-4">
        <TerminalText>LOCATION</TerminalText>
        <TerminalInput
          value={formData.location}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, location: text }))
          }
          placeholder="e.g., Local Range"
        />
      </View>

      <View className="mb-4">
        <TerminalText>DATE</TerminalText>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="border border-terminal-border p-2"
        >
          <TerminalText>{formData.date.toLocaleDateString()}</TerminalText>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setFormData((prev) => ({
                  ...prev,
                  date: selectedDate,
                }));
              }
            }}
          />
        )}
      </View>

      <View className="mb-4">
        <TerminalText>NOTES</TerminalText>
        <TerminalInput
          value={formData.notes}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, notes: text }))
          }
          placeholder="Add any notes about the visit"
          multiline
          numberOfLines={4}
        />
      </View>

      <View className="mb-4">
        <TerminalText>FIREARMS USED</TerminalText>
        {firearms.map((firearm) => (
          <View key={firearm.id} className="mb-2">
            <TouchableOpacity
              onPress={() => {
                const isSelected = formData.firearmsUsed.includes(firearm.id);
                setFormData((prev) => ({
                  ...prev,
                  firearmsUsed: isSelected
                    ? prev.firearmsUsed.filter((id) => id !== firearm.id)
                    : [...prev.firearmsUsed, firearm.id],
                }));
              }}
              className="border border-terminal-border p-2 mb-1"
            >
              <TerminalText>
                {firearm.modelName} ({firearm.caliber})
              </TerminalText>
            </TouchableOpacity>
            {formData.firearmsUsed.includes(firearm.id) && (
              <View className="ml-4">
                <TerminalText>ROUNDS FIRED</TerminalText>
                <TerminalInput
                  value={
                    formData.roundsPerFirearm[firearm.id]?.toString() || ""
                  }
                  onChangeText={(text) =>
                    setFormData((prev) => ({
                      ...prev,
                      roundsPerFirearm: {
                        ...prev.roundsPerFirearm,
                        [firearm.id]: parseInt(text) || 0,
                      },
                    }))
                  }
                  placeholder="Enter number of rounds"
                  keyboardType="numeric"
                />
              </View>
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
          {formData.photos.map((photo, index) => (
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
