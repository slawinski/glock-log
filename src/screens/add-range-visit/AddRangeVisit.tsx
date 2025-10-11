import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import * as ImagePicker from "react-native-image-picker";
import { handleError } from "../../services/error-handler";
import { storage } from "../../services/storage-new";
import {
  BottomButtonGroup,
  ErrorDisplay,
  FirearmsUsedInput,
  ImageGallery,
  TerminalDatePicker,
  TerminalInput,
  TerminalText,
} from "../../components";
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

export const AddRangeVisit = () => {
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
      handleError(error, "AddRangeVisit.loadData", { isUserFacing: true, userMessage: "Failed to load data." });
      setError("Failed to load data.");
    }
  };

  useEffect(() => {
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
            const timestamp = Date.now();
            const randomSuffix =
              typeof crypto !== "undefined" && crypto.getRandomValues
                ? Array.from(crypto.getRandomValues(new Uint8Array(2)))
                    .map((b) => b.toString(36))
                    .join("")
                : Math.random().toString(36).slice(2, 4);
            const borrowedKey = `borrowed-${timestamp}-${randomSuffix}`;
            setAmmunitionUsed((prev) => ({
              ...prev,
              [borrowedKey]: {
                ammunitionId: ammo.id,
                rounds: null,
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
        selectionLimit: 10,
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

      const visitData: RangeVisitInput = {
        ...formData,
        firearmsUsed: selectedFirearms,
        ammunitionUsed: finalAmmunitionUsed,
      };

      const validationResult = rangeVisitInputSchema.safeParse(visitData);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0].message;
        Alert.alert("Validation error", errorMessage);
        return;
      }

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
      handleError(error, "AddRangeVisit.handleSubmit", { isUserFacing: true, userMessage: "Failed to create range visit. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return <ErrorDisplay errorMessage={error} onRetry={loadData} />;
  }

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          <View className="mb-4">
            <TerminalText>LOCATION</TerminalText>
            <TerminalInput
              value={formData.location}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, location: text }))
              }
              placeholder="Enter range location"
              testID="location-input"
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

      <FirearmsUsedInput
        firearms={firearms}
        ammunition={ammunition}
        selectedFirearms={selectedFirearms}
        ammunitionUsed={ammunitionUsed}
        onToggleFirearm={(firearmId) => {
          if (selectedFirearms.includes(firearmId)) {
            setSelectedFirearms((prev) =>
              prev.filter((id) => id !== firearmId)
            );
            setAmmunitionUsed((prev) => {
              const newAmmo = { ...prev };
              delete newAmmo[firearmId];
              return newAmmo;
            });
          } else {
            setSelectedFirearms((prev) => [...prev, firearmId]);
          }
        }}
        onRoundsChange={(firearmId, rounds) => {
          setAmmunitionUsed((prev) => ({
            ...prev,
            [firearmId]: {
              ...prev[firearmId],
              rounds: rounds,
            },
          }));
        }}
        onAmmunitionSelect={(firearmId, ammunitionId) => {
          setAmmunitionUsed((prev) => ({
            ...prev,
            [firearmId]: {
              ...prev[firearmId],
              ammunitionId: ammunitionId,
            },
          }));
        }}
        onAddBorrowedAmmunition={handleAddBorrowedAmmunition}
        onRemoveBorrowedAmmunition={(key) => {
          setAmmunitionUsed((prev) => {
            const newAmmo = { ...prev };
            delete newAmmo[key];
            return newAmmo;
          });
        }}
        onBorrowedAmmunitionRoundsChange={(key, rounds) => {
          setAmmunitionUsed((prev) => ({
            ...prev,
            [key]: { ...prev[key], rounds: rounds },
          }));
        }}
      />

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

          <View className="flex-1" />

          <BottomButtonGroup
            buttons={[
              {
                caption: "CANCEL",
                onPress: () => navigation.goBack(),
              },
              {
                caption: saving ? "SAVING..." : "SAVE",
                onPress: handleSubmit,
                disabled: saving,
              },
            ]}
          />
        </View>
      </ScrollView>
    </View>
  );
};
