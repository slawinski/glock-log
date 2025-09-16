import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../app/App";
import * as ImagePicker from "react-native-image-picker";
import { storage } from "../../services/storage-new";
import {
  TerminalText,
  TerminalInput,
  TerminalDatePicker,
  ImageGallery,
} from "../../components";
import {
  rangeVisitInputSchema,
  RangeVisitInput,
} from "../../validation/inputSchemas";
import { AmmunitionStorage } from "../../validation/storageSchemas";

type EditRangeVisitScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditRangeVisit"
>;

type EditRangeVisitScreenRouteProp = RouteProp<
  RootStackParamList,
  "EditRangeVisit"
>;

export const EditRangeVisit = () => {
  const navigation = useNavigation<EditRangeVisitScreenNavigationProp>();
  const route = useRoute<EditRangeVisitScreenRouteProp>();
  const [formData, setFormData] = useState<RangeVisitInput>({
    date: new Date().toISOString(),
    location: "",
    notes: "",
    firearmsUsed: [],
    photos: [],
    ammunitionUsed: {},
  });
  const [firearms, setFirearms] = useState<
    { id: string; modelName: string; caliber: string }[]
  >([]);
  const [ammunition, setAmmunition] = useState<AmmunitionStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVisit = useCallback(async () => {
    try {
      setLoading(true);
      const visits = await storage.getRangeVisits();
      const visit = visits.find((v) => v.id === route.params!.id);
      if (visit) {
        const { photos, firearmsUsed, notes, ammunitionUsed } = visit;
        setFormData({
          id: visit.id,
          date: visit.date,
          location: visit.location,
          photos: photos ?? [],
          firearmsUsed,
          notes: notes || "",
          ammunitionUsed: ammunitionUsed || {},
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
  }, [route.params?.id]);

  const fetchData = useCallback(async () => {
    try {
      const [firearmsData, ammunitionData] = await Promise.all([
        storage.getFirearms(),
        storage.getAmmunition(),
      ]);
      setFirearms(
        firearmsData.map((f) => ({
          id: f.id,
          modelName: f.modelName,
          caliber: f.caliber,
        }))
      );
      setAmmunition(ammunitionData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, []);

  useEffect(() => {
    if (route.params?.id) {
      fetchVisit();
    }
    fetchData();
  }, [route.params?.id, fetchVisit, fetchData]);

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

      const validationResult = rangeVisitInputSchema.safeParse(formData);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0].message;
        Alert.alert("Validation error", errorMessage);
        return;
      }

      if (formData.ammunitionUsed) {
        for (const [firearmId, usage] of Object.entries(
          formData.ammunitionUsed
        )) {
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
      }

      await storage.saveRangeVisitWithAmmunition(formData);
      navigation.goBack();
    } catch (error) {
      console.error("Error updating range visit:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to update range visit. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleFirearmSelection = (firearmId: string) => {
    setFormData((prev) => {
      const isSelected = prev.firearmsUsed.includes(firearmId);
      const newAmmunitionUsed = { ...prev.ammunitionUsed };

      if (isSelected) {
        delete newAmmunitionUsed[firearmId];
      }

      return {
        ...prev,
        ammunitionUsed: newAmmunitionUsed,
        firearmsUsed: isSelected
          ? prev.firearmsUsed.filter((id) => id !== firearmId)
          : [...prev.firearmsUsed, firearmId],
      };
    });
  };

  const handleDeletePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index),
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
        <TerminalDatePicker
          value={new Date(formData.date)}
          onChange={(date) =>
            setFormData((prev) => ({
              ...prev,
              date: date.toISOString(),
            }))
          }
          label="VISIT DATE"
          maxDate={new Date()}
          placeholder="Select visit date"
        />
      </View>

      <View className="mb-4">
        <TerminalText>NOTES</TerminalText>
        <TerminalInput
          value={formData.notes || ""}
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
              className={`border p-2 ${
                formData.firearmsUsed.includes(firearm.id)
                  ? "border-terminal-accent"
                  : "border-terminal-border"
              }`}
            >
              <TerminalText>{firearm.modelName}</TerminalText>
            </TouchableOpacity>
            {formData.firearmsUsed.includes(firearm.id) && (
              <View className="mt-2">
                <TerminalText>AMMUNITION USED</TerminalText>
                <View className="flex-row items-center">
                  <View className="flex-1 mr-2">
                    <TerminalInput
                      value={
                        formData.ammunitionUsed?.[
                          firearm.id
                        ]?.rounds.toString() || "0"
                      }
                      onChangeText={(text) => {
                        const num = parseInt(text);
                        if (!isNaN(num)) {
                          setFormData((prev) => {
                            const currentAmmo =
                              prev.ammunitionUsed?.[firearm.id];
                            return {
                              ...prev,
                              ammunitionUsed: {
                                ...(prev.ammunitionUsed || {}),
                                [firearm.id]: {
                                  ammunitionId: currentAmmo?.ammunitionId || "",
                                  rounds: num,
                                },
                              },
                            };
                          });
                        }
                      }}
                      placeholder="Rounds used"
                      keyboardType="numeric"
                      testID="rounds-input"
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
                              setFormData((prev) => ({
                                ...prev,
                                ammunitionUsed: {
                                  ...(prev.ammunitionUsed || {}),
                                  [firearm.id]: {
                                    ammunitionId: ammo.id,
                                    rounds:
                                      prev.ammunitionUsed?.[firearm.id]
                                        ?.rounds || 0,
                                  },
                                },
                              }));
                            },
                          }))
                        );
                      }}
                      className="border border-terminal-border p-2"
                    >
                      <TerminalText>
                        {formData.ammunitionUsed?.[firearm.id]?.ammunitionId
                          ? ammunition.find(
                              (a) =>
                                a.id ===
                                formData.ammunitionUsed?.[firearm.id]
                                  ?.ammunitionId
                            )?.brand
                          : "SELECT AMMO"}
                      </TerminalText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}
      </View>

      <View className="mb-4">
        <TerminalText>PHOTOS:</TerminalText>
        <TouchableOpacity
          onPress={handleImagePick}
          className="border border-terminal-border p-3 mb-2"
        >
          <TerminalText>ADD PHOTO</TerminalText>
        </TouchableOpacity>
        {formData.photos && formData.photos.length > 0 && (
          <ImageGallery
            images={formData.photos}
            onDeleteImage={handleDeletePhoto}
            size="medium"
            showDeleteButton={true}
          />
        )}
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
};
