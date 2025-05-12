import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView, Image, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import * as ImagePicker from "react-native-image-picker";
import { storage } from "../services/storage";
import { TerminalText } from "../components/TerminalText";
import { TerminalInput } from "../components/TerminalInput";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  rangeVisitInputSchema,
  RangeVisitInput,
} from "../validation/inputSchemas";
import { AmmunitionStorage } from "../validation/storageSchemas";

type AddRangeVisitScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddRangeVisit"
>;

export default function AddRangeVisitScreen() {
  const navigation = useNavigation<AddRangeVisitScreenNavigationProp>();
  const [firearms, setFirearms] = useState<
    { id: string; modelName: string; caliber: string }[]
  >([]);
  const [ammunition, setAmmunition] = useState<AmmunitionStorage[]>([]);
  const [selectedFirearms, setSelectedFirearms] = useState<string[]>([]);
  const [roundsPerFirearm, setRoundsPerFirearm] = useState<{
    [key: string]: number;
  }>({});
  const [ammunitionUsed, setAmmunitionUsed] = useState<{
    [key: string]: { ammunitionId: string; rounds: number };
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
    const loadData = async () => {
      try {
        const [loadedFirearms, loadedAmmunition] = await Promise.all([
          storage.getFirearms(),
          storage.getAmmunition(),
        ]);
        setFirearms(
          loadedFirearms.map((f) => ({
            id: f.id,
            modelName: f.modelName,
            caliber: f.caliber,
          }))
        );
        setAmmunition(loadedAmmunition);
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load data");
      }
    };
    loadData();
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
        ammunitionUsed: ammunitionUsed,
      };

      // Validate form data using Zod
      const validationResult = rangeVisitInputSchema.safeParse(visitData);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0].message;
        Alert.alert("Validation error", errorMessage);
        return;
      }

      // Validate ammunition quantities
      for (const [firearmId, usage] of Object.entries(ammunitionUsed)) {
        const ammo = ammunition.find((a) => a.id === usage.ammunitionId);
        if (!ammo) {
          throw new Error(`Ammunition not found for firearm ${firearmId}`);
        }
        if (ammo.quantity < usage.rounds) {
          throw new Error(
            `Insufficient ammunition quantity for ${ammo.brand} ${ammo.caliber}`
          );
        }
      }

      await storage.saveRangeVisitWithAmmunition(visitData);
      navigation.goBack();
    } catch (error) {
      console.error("Error creating range visit:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to create range visit. Please try again."
      );
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
                  setAmmunitionUsed((prev) => {
                    const newAmmo = { ...prev };
                    delete newAmmo[firearm.id];
                    return newAmmo;
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
              <>
                <TerminalInput
                  value={roundsPerFirearm[firearm.id]?.toString() || "0"}
                  onChangeText={(text) => {
                    const num = parseInt(text);
                    if (!isNaN(num)) {
                      setRoundsPerFirearm((prev) => ({
                        ...prev,
                        [firearm.id]: num,
                      }));
                    }
                  }}
                  placeholder="Rounds fired"
                  keyboardType="numeric"
                />
                <View className="mt-2">
                  <TerminalText className="text-terminal-dim">
                    AMMUNITION USED
                  </TerminalText>
                  <View className="flex-row items-center">
                    <View className="flex-1 mr-2">
                      <TerminalInput
                        value={
                          ammunitionUsed[firearm.id]?.rounds.toString() || "0"
                        }
                        onChangeText={(text) => {
                          const num = parseInt(text);
                          if (!isNaN(num)) {
                            setAmmunitionUsed((prev) => ({
                              ...prev,
                              [firearm.id]: {
                                ...prev[firearm.id],
                                rounds: num,
                              },
                            }));
                          }
                        }}
                        placeholder="Rounds used"
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex-1">
                      <TouchableOpacity
                        onPress={() => {
                          const compatibleAmmo = ammunition.filter(
                            (a) => a.caliber === firearm.caliber
                          );
                          if (compatibleAmmo.length === 0) {
                            Alert.alert(
                              "Error",
                              "No compatible ammunition found"
                            );
                            return;
                          }
                          Alert.alert(
                            "Select Ammunition",
                            "Choose ammunition type",
                            compatibleAmmo.map((ammo) => ({
                              text: `${ammo.brand} ${ammo.caliber} (${ammo.quantity} rounds)`,
                              onPress: () => {
                                setAmmunitionUsed((prev) => ({
                                  ...prev,
                                  [firearm.id]: {
                                    ammunitionId: ammo.id,
                                    rounds: prev[firearm.id]?.rounds || 0,
                                  },
                                }));
                              },
                            }))
                          );
                        }}
                        className="border border-terminal-border p-2"
                      >
                        <TerminalText>
                          {ammunitionUsed[firearm.id]?.ammunitionId
                            ? ammunition.find(
                                (a) =>
                                  a.id ===
                                  ammunitionUsed[firearm.id].ammunitionId
                              )?.brand
                            : "SELECT AMMO"}
                        </TerminalText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </>
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
          <TerminalText>{saving ? "SAVING..." : "SAVE"}</TerminalText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
