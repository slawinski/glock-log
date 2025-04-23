import React, { useState, useEffect } from "react";
import {
  View,
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
import { TerminalText, TerminalInput } from "../components/Terminal";

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
    roundsPerFirearm: {},
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
        roundsPerFirearm: data.roundsPerFirearm,
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

      // Validate rounds per firearm
      for (const firearmId of formData.firearmsUsed) {
        if (
          !formData.roundsPerFirearm[firearmId] ||
          formData.roundsPerFirearm[firearmId] <= 0
        ) {
          Alert.alert(
            "Missing Information",
            `Please specify the number of rounds fired for each selected firearm.`,
            [{ text: "OK" }]
          );
          return;
        }
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
    setFormData((prev) => {
      const newFirearmsUsed = prev.firearmsUsed.includes(firearmId)
        ? prev.firearmsUsed.filter((id) => id !== firearmId)
        : [...prev.firearmsUsed, firearmId];

      // Remove rounds data for deselected firearms
      const newRoundsPerFirearm = { ...prev.roundsPerFirearm };
      if (!newFirearmsUsed.includes(firearmId)) {
        delete newRoundsPerFirearm[firearmId];
      }

      return {
        ...prev,
        firearmsUsed: newFirearmsUsed,
        roundsPerFirearm: newRoundsPerFirearm,
      };
    });
  };

  const updateRoundsForFirearm = (firearmId: string, rounds: string) => {
    setFormData((prev) => ({
      ...prev,
      roundsPerFirearm: {
        ...prev.roundsPerFirearm,
        [firearmId]: parseInt(rounds) || 0,
      },
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
    <ScrollView className="flex-1 bg-terminal-bg p-4">
      <TerminalText className="text-2xl mb-6">EDIT RANGE VISIT</TerminalText>

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
        <TerminalInput
          value={formData.date.toLocaleDateString()}
          onChangeText={() => {}}
        />
      </View>

      <View className="mb-4">
        <TerminalText>NOTES</TerminalText>
        <TerminalInput
          value={formData.notes}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, notes: text }))
          }
          placeholder="Optional notes"
          multiline
        />
      </View>

      <View className="mb-4">
        <TerminalText>FIREARMS USED</TerminalText>
        {firearms.map((firearm) => (
          <View key={firearm.id} className="mb-2">
            <TouchableOpacity
              onPress={() => toggleFirearmSelection(firearm.id)}
              className="mb-2"
            >
              <TerminalText>
                {firearm.modelName} ({firearm.caliber})
              </TerminalText>
            </TouchableOpacity>

            {formData.firearmsUsed.includes(firearm.id) && (
              <View className="ml-4">
                <TerminalText className="text-terminal-dim mb-1">
                  ROUNDS FIRED
                </TerminalText>
                <TerminalInput
                  value={String(formData.roundsPerFirearm[firearm.id] || 0)}
                  onChangeText={(text) =>
                    updateRoundsForFirearm(firearm.id, text)
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
          <TerminalText>{saving ? "SAVING..." : "SAVE CHANGES"}</TerminalText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
