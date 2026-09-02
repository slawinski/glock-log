import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Controller, useWatch } from "react-hook-form";
import { RootStackParamList } from "../../app/App";
import { handleError } from "../../services/error-handler";
import { storage } from "../../services/storage-new";
import { useEntityForm, useImagePicker } from "../../hooks";
import {
  BottomButtonGroup,
  ErrorDisplay,
  FirearmsUsedInput,
  ImageGallery,
  LoadingScreen,
  TerminalButton,
  TerminalDatePicker,
  TerminalInput,
  TerminalText,
} from "../../components";
import {
  rangeVisitInputSchema,
  RangeVisitFormData,
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
  const [photos, setPhotos] = useState<string[]>([]);
  const [firearms, setFirearms] = useState<
    { id: string; modelName: string; caliber: string }[]
  >([]);
  const [ammunition, setAmmunition] = useState<AmmunitionStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { pickImages, isPicking } = useImagePicker();

  const saveRangeVisit = async (data: RangeVisitInput) => {
    if (data.ammunitionUsed) {
      for (const [firearmId, usage] of Object.entries(data.ammunitionUsed)) {
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

    await storage.saveRangeVisitWithAmmunition({ ...data, photos });
    navigation.goBack();
  };

  const { form, isSaving, onSubmit } = useEntityForm<
    RangeVisitInput,
    RangeVisitFormData
  >(rangeVisitInputSchema, saveRangeVisit, {
    defaultValues: {
      date: new Date().toISOString(),
      location: "",
      notes: "",
      firearmsUsed: [],
      ammunitionUsed: {},
    },
    entityName: "update range visit",
  });
  const {
    control,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = form;

  // Keep the FirearmsUsedInput section in sync with the form state reactively.
  const watchedFirearmsUsed = useWatch({ control, name: "firearmsUsed" });
  const watchedAmmunitionUsed = useWatch({ control, name: "ammunitionUsed" });

  const fetchVisit = useCallback(async () => {
    try {
      setLoading(true);
      const visits = await storage.getRangeVisits();
      const visit = visits.find((v) => v.id === route.params!.id);
      if (visit) {
        reset({
          id: visit.id,
          date: visit.date,
          location: visit.location,
          notes: visit.notes || "",
          firearmsUsed: visit.firearmsUsed,
          ammunitionUsed: visit.ammunitionUsed || {},
        });
        setPhotos(visit.photos ?? []);
      } else {
        setError("Range visit not found");
      }
    } catch (error) {
      handleError(error, "EditRangeVisit.fetchVisit", { isUserFacing: true, userMessage: "Failed to load range visit data." });
      setError("Failed to load range visit data.");
    } finally {
      setLoading(false);
    }
  }, [route.params, reset]);

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

  const handleImagePick = async () => {
    const assets = await pickImages();
    if (assets.length > 0 && assets[0].uri) {
      setPhotos((prev) => [...prev, assets[0].uri!]);
    }
  };

  const toggleFirearmSelection = (firearmId: string) => {
    const currentFirearms = getValues("firearmsUsed") ?? [];
    const isSelected = currentFirearms.includes(firearmId);
    const newAmmunitionUsed = { ...(getValues("ammunitionUsed") ?? {}) };

    if (isSelected) {
      delete newAmmunitionUsed[firearmId];
    }

    setValue(
      "firearmsUsed",
      isSelected
        ? currentFirearms.filter((id) => id !== firearmId)
        : [...currentFirearms, firearmId]
    );
    setValue("ammunitionUsed", newAmmunitionUsed);
  };

  const handleDeletePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  if (error) {
    return <ErrorDisplay errorMessage={error} onRetry={fetchVisit} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          <View className="mb-4">
            <TerminalText>LOCATION</TerminalText>
            <Controller
              control={control}
              name="location"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TerminalInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g., Local Range"
                  error={error?.message}
                />
              )}
            />
            {errors.location && (
              <TerminalText className="text-terminal-error text-sm mt-1">
                {errors.location.message}
              </TerminalText>
            )}
          </View>

          <View className="mb-4">
            <TerminalText>DATE</TerminalText>
            <Controller
              control={control}
              name="date"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TerminalDatePicker
                  value={new Date(value)}
                  onChange={(date) => onChange(date.toISOString())}
                  label="VISIT DATE"
                  maxDate={new Date()}
                  placeholder="Select visit date"
                  error={error?.message}
                />
              )}
            />
          </View>

          <View className="mb-4">
            <TerminalText>NOTES</TerminalText>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TerminalInput
                  value={value ?? ""}
                  onChangeText={onChange}
                  placeholder="Optional notes"
                  multiline
                  error={error?.message}
                />
              )}
            />
            {errors.notes && (
              <TerminalText className="text-terminal-error text-sm mt-1">
                {errors.notes.message}
              </TerminalText>
            )}
          </View>

          <FirearmsUsedInput
            firearms={firearms}
            ammunition={ammunition}
            selectedFirearms={watchedFirearmsUsed ?? []}
            ammunitionUsed={watchedAmmunitionUsed ?? {}}
            onToggleFirearm={toggleFirearmSelection}
            onRoundsChange={(firearmId, rounds) => {
              const currentAmmo = getValues("ammunitionUsed") ?? {};
              setValue("ammunitionUsed", {
                ...currentAmmo,
                [firearmId]: {
                  ammunitionId: currentAmmo[firearmId]?.ammunitionId || "",
                  rounds: rounds,
                },
              });
            }}
            onAmmunitionSelect={(firearmId, ammunitionId) => {
              const currentAmmo = getValues("ammunitionUsed") ?? {};
              setValue("ammunitionUsed", {
                ...currentAmmo,
                [firearmId]: {
                  ammunitionId: ammunitionId,
                  rounds: currentAmmo[firearmId]?.rounds ?? null,
                },
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
              const newAmmo = { ...(getValues("ammunitionUsed") ?? {}) };
              delete newAmmo[key];
              setValue("ammunitionUsed", newAmmo);
            }}
            onBorrowedAmmunitionRoundsChange={(key, rounds) => {
              const currentAmmo = getValues("ammunitionUsed") ?? {};
              setValue("ammunitionUsed", {
                ...currentAmmo,
                [key]: {
                  ...(currentAmmo[key] ?? { ammunitionId: "", rounds: null }),
                  rounds: rounds,
                },
              });
            }}
          />

          <View className="mb-4">
            <TerminalText>PHOTOS:</TerminalText>
            <TerminalButton
              onPress={handleImagePick}
              className="mb-2"
              caption="ADD PHOTO"
              disabled={isPicking}
            />
            {photos.length > 0 && (
              <ImageGallery
                images={photos}
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
                caption: isSaving ? "SAVING..." : "SAVE",
                onPress: onSubmit,
                disabled: isSaving,
              },
            ]}
          />
        </View>
      </ScrollView>
    </View>
  );
};
