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
import { storage } from "../services/storage";
import { TerminalText, TerminalInput } from "../components/Terminal";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  rangeVisitInputSchema,
  RangeVisitInput,
} from "../validation/inputSchemas";
import { RangeVisitStorage } from "../validation/storageSchemas";

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
  const [formData, setFormData] = useState<Required<RangeVisitInput>>({
    date: new Date().toISOString(),
    location: "",
    notes: "",
    photos: [],
    firearmsUsed: [],
    roundsPerFirearm: {},
    ammunitionUsed: {},
  });
  const [firearms, setFirearms] = useState<
    { id: string; modelName: string; caliber: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (route.params?.id) {
      fetchVisit();
    }
    fetchFirearms();
  }, [route.params?.id]);

  const fetchVisit = async () => {
    try {
      setLoading(true);
      const visits = await storage.getRangeVisits();
      const visit = visits.find((v) => v.id === route.params!.id);
      if (visit) {
        // Convert storage data to input data
        const { id, createdAt, updatedAt, ...visitData } = visit;
        setFormData({
          ...visitData,
          roundsPerFirearm: Object.entries(visitData.roundsPerFirearm).reduce(
            (acc, [firearmId, rounds]) => {
              acc[firearmId] = rounds;
              return acc;
            },
            {} as Record<string, number>
          ),
          photos: visitData.photos ?? [],
          firearmsUsed: visitData.firearmsUsed,
          notes: visitData.notes || "",
          ammunitionUsed: visitData.ammunitionUsed || {},
        });
      } else {
        setError("Range visit not found");
      }
    } catch (error) {
      console.error("Error fetching range visit:", error);
      Alert.alert("Error", "Failed to load range visit data");
    } finally {
      setLoading(false);
    }
  };

  const fetchFirearms = async () => {
    try {
      const data = await storage.getFirearms();
      setFirearms(
        data.map((f) => ({
          id: f.id,
          modelName: f.modelName,
          caliber: f.caliber,
        }))
      );
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

      // Validate form data using Zod
      const validationResult = rangeVisitInputSchema.safeParse(formData);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0].message;
        Alert.alert("Validation error", errorMessage);
        return;
      }

      await storage.saveRangeVisit(formData);
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
      const isSelected = firearmId in prev.roundsPerFirearm;
      const newRoundsPerFirearm = { ...prev.roundsPerFirearm };

      if (isSelected) {
        delete newRoundsPerFirearm[firearmId];
      } else {
        newRoundsPerFirearm[firearmId] = 0;
      }

      return {
        ...prev,
        roundsPerFirearm: newRoundsPerFirearm,
        firearmsUsed: isSelected
          ? prev.firearmsUsed.filter((id) => id !== firearmId)
          : [...prev.firearmsUsed, firearmId],
      };
    });
  };

  const updateRoundsForFirearm = (firearmId: string, rounds: string) => {
    const numRounds = parseInt(rounds, 10);
    if (!isNaN(numRounds)) {
      setFormData((prev) => ({
        ...prev,
        roundsPerFirearm: {
          ...prev.roundsPerFirearm,
          [firearmId]: numRounds,
        },
      }));
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

            {firearm.id in formData.roundsPerFirearm && (
              <View className="ml-4">
                <TerminalText className="text-terminal-dim mb-1">
                  ROUNDS FIRED
                </TerminalText>
                <TerminalInput
                  value={formData.roundsPerFirearm[firearm.id] || 0}
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
          {formData.photos.map((photo: string, index: number) => (
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
