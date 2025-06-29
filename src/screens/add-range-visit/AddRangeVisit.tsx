import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import * as ImagePicker from "react-native-image-picker";
import { storage } from "../../services/storage-new";
import { TerminalText } from "../../components/terminal-text/TerminalText";
import { TerminalInput } from "../../components/terminal-input/TerminalInput";
import TerminalDatePicker from "../../components/terminal-date-picker/TerminalDatePicker";
import { ImageGallery } from "../../components/image-gallery";
import {
  rangeVisitInputSchema,
  RangeVisitInput,
} from "../../validation/inputSchemas";
import {
  AmmunitionStorage,
  FirearmStorage,
} from "../../validation/storageSchemas";

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
  const [ammunitionUsed, setAmmunitionUsed] = useState<{
    [key: string]: { ammunitionId?: string; rounds: number | null };
  }>({});
  const [formData, setFormData] = useState<RangeVisitInput>({
    date: new Date().toISOString(),
    location: "",
    notes: "",
    photos: [],
    firearmsUsed: [],
    ammunitionUsed: {},
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedFirearms, loadedAmmunition] = await Promise.all([
          storage.getFirearms(),
          storage.getAmmunition(),
        ]);
        setFirearms(
          loadedFirearms.map((f: FirearmStorage) => ({
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

  const handleAddBorrowedAmmunition = () => {
    const availableAmmo = ammunition.filter((ammo) => ammo.quantity > 0);

    if (availableAmmo.length === 0) {
      Alert.alert("No Ammunition", "You have no ammunition in stock.");
      return;
    }

    Alert.alert(
      "Select Ammunition",
      "Choose ammunition for the borrowed firearm",
      [
        ...availableAmmo.map((ammo) => ({
          text: `${ammo.brand} ${ammo.caliber} (${ammo.quantity} rounds)`,
          onPress: () => {
            const borrowedKey = `borrowed-${Date.now()}`;
            setAmmunitionUsed((prev) => ({
              ...prev,
              [borrowedKey]: {
                ammunitionId: ammo.id,
                rounds: null, // User can edit this
              },
            }));
          },
        })),
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleImagePick = () => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: "photo",
        quality: 0.8,
        selectionLimit: 10, // Allow multiple images
      },
      (response) => {
        if (response.assets && response.assets.length > 0) {
          const newImageUris = response.assets
            .map((asset) => asset.uri!)
            .filter(Boolean);
          setFormData((prev) => ({
            ...prev,
            photos: [...(prev.photos || []), ...newImageUris],
          }));
        }
      }
    );
  };

  const handleDeleteImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      const finalAmmunitionUsed: RangeVisitInput["ammunitionUsed"] = {};
      if (ammunitionUsed) {
        for (const [key, value] of Object.entries(ammunitionUsed)) {
          if (value.rounds && value.rounds > 0 && value.ammunitionId) {
            finalAmmunitionUsed[key] = {
              ammunitionId: value.ammunitionId,
              rounds: value.rounds,
            };
          }
        }
      }

      // Prepare the data for validation
      const visitData: RangeVisitInput = {
        ...formData,
        firearmsUsed: selectedFirearms,
        ammunitionUsed: finalAmmunitionUsed,
      };

      // Validate form data using Zod
      const validationResult = rangeVisitInputSchema.safeParse(visitData);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0].message;
        Alert.alert("Validation error", errorMessage);
        return;
      }

      // Validate ammunition quantities
      if (finalAmmunitionUsed) {
        for (const [firearmId, usage] of Object.entries(finalAmmunitionUsed)) {
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

      await storage.saveRangeVisitWithAmmunition(visitData);
      navigation.goBack();
    } catch (error) {
      console.error("Error creating range visit:", error);
      Alert.alert("Error", "Failed to create range visit. Please try again.");
    } finally {
      setSaving(false);
    }
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
        <TerminalText>FIREARMS USED</TerminalText>
        {firearms.map((firearm) => (
          <View key={firearm.id} className="mb-2">
            <TouchableOpacity
              onPress={() => {
                if (selectedFirearms.includes(firearm.id)) {
                  setSelectedFirearms((prev) =>
                    prev.filter((id) => id !== firearm.id)
                  );
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
              <View className="mt-2">
                <TerminalText className="text-terminal-dim">
                  AMMUNITION USED
                </TerminalText>
                <View className="flex-row items-center">
                  <View className="flex-1 mr-2">
                    <TerminalInput
                      value={
                        ammunitionUsed[firearm.id]?.rounds?.toString() ?? ""
                      }
                      onChangeText={(text) => {
                        const num = parseInt(text, 10);
                        setAmmunitionUsed((prev) => ({
                          ...prev,
                          [firearm.id]: {
                            ...prev[firearm.id],
                            rounds: isNaN(num) ? null : num,
                          },
                        }));
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
                          [
                            ...compatibleAmmo.map((ammo) => ({
                              text: `${ammo.brand} ${ammo.caliber} (${ammo.quantity} rounds)`,
                              onPress: () => {
                                setAmmunitionUsed((prev) => ({
                                  ...prev,
                                  [firearm.id]: {
                                    ...prev[firearm.id],
                                    ammunitionId: ammo.id,
                                  },
                                }));
                              },
                            })),
                            { text: "Cancel", style: "cancel" },
                          ]
                        );
                      }}
                    >
                      <TerminalText className="text-terminal-accent">
                        {ammunitionUsed[firearm.id]?.ammunitionId
                          ? ammunition.find(
                              (a) =>
                                a.id ===
                                ammunitionUsed[firearm.id]?.ammunitionId
                            )?.brand
                          : "Select Ammunition"}
                      </TerminalText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}
      </View>

      <View className="my-4">
        <TouchableOpacity
          onPress={handleAddBorrowedAmmunition}
          className="border border-terminal-accent p-2"
        >
          <TerminalText>+ Log ammunition for a borrowed firearm</TerminalText>
        </TouchableOpacity>

        {Object.entries(ammunitionUsed)
          .filter(([key]) => key.startsWith("borrowed-"))
          .map(([key, usage]) => {
            const ammoDetails = ammunition.find(
              (a) => a.id === usage.ammunitionId
            );
            return (
              <View
                key={key}
                className="mt-2 p-2 border border-terminal-dim rounded"
              >
                <View className="flex-row justify-between items-center mb-2">
                  <TerminalText>
                    {ammoDetails
                      ? `${ammoDetails.brand} ${ammoDetails.caliber}`
                      : "Borrowed Firearm"}
                  </TerminalText>
                  <TouchableOpacity
                    onPress={() => {
                      setAmmunitionUsed((prev) => {
                        const newAmmo = { ...prev };
                        delete newAmmo[key];
                        return newAmmo;
                      });
                    }}
                  >
                    <TerminalText className="text-terminal-error">
                      Remove
                    </TerminalText>
                  </TouchableOpacity>
                </View>
                <TerminalInput
                  value={usage.rounds?.toString() || ""}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    setAmmunitionUsed((prev) => ({
                      ...prev,
                      [key]: { ...prev[key], rounds: isNaN(num) ? null : num },
                    }));
                  }}
                  placeholder="Rounds used"
                  keyboardType="numeric"
                />
              </View>
            );
          })}
      </View>

      <View className="mb-4">
        <TerminalText>PHOTOS</TerminalText>
        <TouchableOpacity
          onPress={handleImagePick}
          className="border border-terminal-border p-3 mb-2"
        >
          <TerminalText>ADD PHOTOS</TerminalText>
        </TouchableOpacity>

        {/* Image Gallery */}
        {formData.photos && formData.photos.length > 0 && (
          <View className="mb-4">
            <TerminalText className="mb-2">SELECTED PHOTOS</TerminalText>
            <ImageGallery
              images={formData.photos}
              onDeleteImage={handleDeleteImage}
              size="medium"
              showDeleteButton={true}
            />
          </View>
        )}
      </View>

      <View className="mb-4">
        <TerminalText>NOTES</TerminalText>
        <TerminalInput
          value={formData.notes || ""}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, notes: text }))
          }
          placeholder="Add any notes about this range visit"
          multiline
        />
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
