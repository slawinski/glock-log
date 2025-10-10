import React, { useState, useEffect, useCallback } from "react";
import { useFormChangeHandler } from "../../hooks/useFormChangeHandler";
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
  BottomButtonGroup,
  FirearmsUsedInput,
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

type RangeVisitFormData = Omit<RangeVisitInput, "ammunitionUsed"> & {
  ammunitionUsed: {
    [firearmId: string]: {
      ammunitionId: string;
      rounds: number | null;
    };
  };
};
export const EditRangeVisit = () => {
  const navigation = useNavigation<EditRangeVisitScreenNavigationProp>();
  const route = useRoute<EditRangeVisitScreenRouteProp>();
  const [formData, setFormData] = useState<RangeVisitFormData | null>(null);
  const handleFormChange = useFormChangeHandler(formData, setFormData);
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
        setFormData({
          id: visit.id,
          date: visit.date,
          location: visit.location,
          photos: visit.photos ?? [],
          firearmsUsed: visit.firearmsUsed,
          notes: visit.notes || "",
          ammunitionUsed: visit.ammunitionUsed || {},
        });
      } else {
        setError("Range visit not found");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching range visit:", error);
      Alert.alert("Error", "Failed to load range visit data");
    } finally {
      setLoading(false);
    }
  }, [route.params]);

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
    if (route.params?.id && !formData) {
      fetchVisit();
    }
    fetchData();
  }, [route.params?.id, fetchVisit, fetchData, formData]);

  const handleImagePick = () => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: "photo",
        quality: 0.8,
      },
      (response) => {
        if (response.assets && response.assets[0].uri) {
          setFormData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              photos: [...(prev.photos || []), response.assets![0].uri!],
            };
          });
        }
      }
    );
  };

  const handleSubmit = async () => {
    if (!formData) return;
    try {
      setSaving(true);

      const dataToValidate = {
        ...formData,
        ammunitionUsed: Object.fromEntries(
          Object.entries(formData.ammunitionUsed).map(([firearmId, usage]) => [
            firearmId,
            {
              ammunitionId: usage.ammunitionId,
              rounds: usage.rounds || 0,
            },
          ])
        ),
      };

      const validationResult = rangeVisitInputSchema.safeParse(dataToValidate);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0].message;
        Alert.alert("Validation error", errorMessage);
        return;
      }

      if (dataToValidate.ammunitionUsed) {
        for (const [firearmId, usage] of Object.entries(
          dataToValidate.ammunitionUsed
        )) {
          if (usage.ammunitionId) {
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
      }

      await storage.saveRangeVisitWithAmmunition(dataToValidate);
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
      if (!prev) return null;
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
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        photos: (prev.photos || []).filter((_, i) => i !== index),
      };
    });
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

  if (loading || !formData) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <ActivityIndicator size="large" color="#00ff00" />
        <TerminalText className="mt-4">LOADING DATABASE...</TerminalText>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          <View className="mb-4">
            <TerminalText>LOCATION</TerminalText>
            <TerminalInput
              value={formData.location}
              onChangeText={(text) => handleFormChange("location", text)}
              placeholder="e.g., Local Range"
            />
          </View>

          <View className="mb-4">
            <TerminalText>DATE</TerminalText>
            <TerminalDatePicker
              value={new Date(formData.date)}
              onChange={(date) => handleFormChange("date", date.toISOString())}
              label="VISIT DATE"
              maxDate={new Date()}
              placeholder="Select visit date"
            />
          </View>

          <View className="mb-4">
            <TerminalText>NOTES</TerminalText>
            <TerminalInput
              value={formData.notes || ""}
              onChangeText={(text) => handleFormChange("notes", text)}
              placeholder="Optional notes"
              multiline
            />
          </View>

          <FirearmsUsedInput
            firearms={firearms}
            ammunition={ammunition}
            selectedFirearms={formData.firearmsUsed}
            ammunitionUsed={formData.ammunitionUsed}
            onToggleFirearm={toggleFirearmSelection}
            onRoundsChange={(firearmId, rounds) => {
              setFormData((prev) => {
                if (!prev) return null;
                const currentAmmo = prev.ammunitionUsed?.[firearmId];
                return {
                  ...prev,
                  ammunitionUsed: {
                    ...(prev.ammunitionUsed || {}),
                    [firearmId]: {
                      ammunitionId: currentAmmo?.ammunitionId || "",
                      rounds: rounds,
                    },
                  },
                };
              });
            }}
            onAmmunitionSelect={(firearmId, ammunitionId) => {
              setFormData((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  ammunitionUsed: {
                    ...(prev.ammunitionUsed || {}),
                    [firearmId]: {
                      ammunitionId: ammunitionId,
                      rounds: prev.ammunitionUsed?.[firearmId]?.rounds || null,
                    },
                  },
                };
              });
            }}
            onAddBorrowedAmmunition={() => {
              // Edit screen does not support adding borrowed ammunition directly
              // This functionality is primarily for the AddRangeVisit screen
              Alert.alert(
                "Feature Not Available",
                "Adding borrowed ammunition is not supported in edit mode."
              );
            }}
            onRemoveBorrowedAmmunition={(key) => {
              setFormData((prev) => {
                if (!prev) return null;
                const newAmmo = { ...prev.ammunitionUsed };
                delete newAmmo[key];
                return {
                  ...prev,
                  ammunitionUsed: newAmmo,
                };
              });
            }}
            onBorrowedAmmunitionRoundsChange={(key, rounds) => {
              setFormData((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  ammunitionUsed: {
                    ...prev.ammunitionUsed,
                    [key]: { ...prev.ammunitionUsed[key], rounds: rounds },
                  },
                };
              });
            }}
          />

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
