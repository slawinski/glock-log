import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  LayoutChangeEvent,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Controller } from "react-hook-form";
import { RootStackParamList } from "../../app/App";
import { handleError } from "../../services/error-handler";
import { storage } from "../../services/storage-new";
import {
  useEntityForm,
  useImagePicker,
  useUnsavedChanges,
} from "../../hooks";
import {
  ErrorDisplay,
  FirearmsUsedInput,
  ImageGallery,
  SectionHeading,
  StickyActionBar,
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
import {
  AmmunitionStorage,
  FirearmStorage,
  FirearmOwnership,
} from "../../validation/storageSchemas";

type AddRangeVisitScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddRangeVisit"
>;

const FIELD_ORDER = ["location", "date", "notes"] as const;

export const AddRangeVisit = () => {
  const navigation = useNavigation<AddRangeVisitScreenNavigationProp>();
  const scrollRef = useRef<ScrollView>(null);
  const fieldY = useRef<Record<string, number>>({});
  const [firearms, setFirearms] = useState<
    { id: string; modelName: string; caliber: string; ownership: FirearmOwnership }[]
  >([]);
  const [ammunition, setAmmunition] = useState<AmmunitionStorage[]>([]);
  const [selectedFirearms, setSelectedFirearms] = useState<string[]>([]);
  const [ammunitionUsed, setAmmunitionUsed] = useState<{
    [key: string]: { ammunitionId?: string; rounds: string };
  }>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { pickImages, isPicking } = useImagePicker({ selectionLimit: 10 });

  const saveRangeVisit = async (data: RangeVisitInput) => {
    const finalAmmunitionUsed: NonNullable<RangeVisitInput["ammunitionUsed"]> =
      {};
    for (const [key, value] of Object.entries(ammunitionUsed)) {
      const rounds = Number(value.rounds);
      if (Number.isFinite(rounds) && rounds > 0 && value.ammunitionId) {
        finalAmmunitionUsed[key] = {
          ammunitionId: value.ammunitionId,
          rounds,
        };
      }
    }

    for (const usage of Object.values(finalAmmunitionUsed)) {
      const ammo = ammunition.find((a) => a.id === usage.ammunitionId);
      if (!ammo) {
        throw new Error(`Ammunition not found for ${usage.ammunitionId}`);
      }
      if (ammo.quantity < usage.rounds) {
        Alert.alert(
          "Insufficient ammunition",
          `You only have ${ammo.quantity} rounds of ${ammo.brand} ${ammo.caliber} in inventory (entered: ${usage.rounds}).`,
          [{ text: "Change ammunition", style: "cancel" }]
        );
        return;
      }
    }

    await storage.saveRangeVisitWithAmmunition({
      ...data,
      firearmsUsed: selectedFirearms,
      ammunitionUsed: finalAmmunitionUsed,
      photos,
    });
    form.reset(form.getValues());
    dirtyRef.current = false;
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
      entityName: "create range visit",
    }
  );
  const {
    control,
    setFocus,
    formState: { errors, isDirty },
  } = form;

  const dirtyRef = useRef(false);
  const localDirty =
    selectedFirearms.length > 0 ||
    Object.keys(ammunitionUsed).length > 0 ||
    photos.length > 0;
  dirtyRef.current = isDirty || localDirty;
  useUnsavedChanges(dirtyRef);

  const firstInvalidField = FIELD_ORDER.find((name) => Boolean(errors[name]));
  useEffect(() => {
    if (firstInvalidField) {
      const y = fieldY.current[firstInvalidField];
      if (y != null) {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
      }
      setFocus(firstInvalidField);
    }
  }, [firstInvalidField, setFocus]);

  const captureY = (name: string) => (event: LayoutChangeEvent) => {
    fieldY.current[name] = event.nativeEvent.layout.y;
  };

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
          ownership: f.ownership ?? "mine",
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

  const handleAddBorrowedFirearm = async (
    modelName: string,
    caliber: string
  ) => {
    try {
      const newId = await storage.saveFirearm({
        modelName,
        caliber,
        ownership: "borrowed",
        datePurchased: new Date().toISOString(),
        amountPaid: 0,
      });
      setFirearms((prev) => [
        ...prev,
        { id: newId, modelName, caliber, ownership: "borrowed" },
      ]);
      setSelectedFirearms((prev) => [...prev, newId]);
    } catch (error) {
      handleError(error, "AddRangeVisit.handleAddBorrowedFirearm", {
        isUserFacing: true,
        userMessage: "Failed to add borrowed firearm.",
      });
    }
  };

  const handleImagePick = async () => {
    const assets = await pickImages();
    if (assets.length > 0) {
      const newImageUris = assets
        .map((asset) => asset.uri!)
        .filter(Boolean);
      setPhotos((prev) => [...prev, ...newImageUris]);
    }
  };

  const handleDeleteImage = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const totalRounds = Object.values(ammunitionUsed).reduce((sum, entry) => {
    const rounds = Number(entry.rounds);
    return sum + (Number.isFinite(rounds) && rounds > 0 ? rounds : 0);
  }, 0);

  const firearmCount = selectedFirearms.length;

  const ammoPreview = Object.entries(ammunitionUsed)
    .filter(
      ([, entry]) => entry.ammunitionId && Number(entry.rounds) > 0
    )
    .map(([key, entry]) => {
      const ammo = ammunition.find((a) => a.id === entry.ammunitionId);
      const rounds = Number(entry.rounds);
      if (!ammo || !Number.isFinite(rounds)) {
        return null;
      }
      return {
        key,
        label: `${ammo.brand} ${ammo.caliber}`,
        before: ammo.quantity,
        after: ammo.quantity - rounds,
      };
    })
    .filter(
      (preview): preview is NonNullable<typeof preview> => preview !== null
    );

  if (error) {
    return <ErrorDisplay errorMessage={error} onRetry={loadData} />;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-terminal-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pb-24">
          <SectionHeading title="VISIT" />
          <View onLayout={captureY("location")} className="mb-4">
            <TerminalText className="mb-1.5">LOCATION *</TerminalText>
            <Controller
              control={control}
              name="location"
              render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                <TerminalInput
                  value={value}
                  onChangeText={onChange}
                  ref={ref}
                  placeholder="Enter range location"
                  testID="location-input"
                  error={error?.message}
                />
              )}
            />
            {errors.location && (
              <TerminalText
                className="text-terminal-error text-sm mt-1"
                accessibilityLiveRegion="polite"
              >
                {errors.location.message}
              </TerminalText>
            )}
          </View>

          <View onLayout={captureY("date")}>
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

          <SectionHeading title="FIREARMS & ROUNDS" className="mt-7" />
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
                  rounds,
                },
              }));
            }}
            onAmmunitionSelect={(firearmId, ammunitionId) => {
              setAmmunitionUsed((prev) => ({
                ...prev,
                [firearmId]: {
                  ...prev[firearmId],
                  ammunitionId,
                },
              }));
            }}
            onAddBorrowedFirearm={handleAddBorrowedFirearm}
          />

          <SectionHeading title="SUMMARY" className="mt-7" />
          <View className="mb-4">
            <TerminalText>TOTAL ROUNDS: {totalRounds}</TerminalText>
            <TerminalText>FIREARM COUNT: {firearmCount}</TerminalText>
            {ammoPreview.map((preview) => (
              <TerminalText key={preview.key} className="text-terminal-muted">
                {preview.label}: {preview.before} → {preview.after} rounds
              </TerminalText>
            ))}
          </View>

          <SectionHeading title="PHOTOS" className="mt-7" />
          <View className="mb-4">
            <TerminalButton
              onPress={handleImagePick}
              className="mb-2"
              caption="ADD PHOTOS"
              disabled={isPicking}
            />

            {photos.length > 0 && (
              <View className="mt-4">
                <TerminalText className="mb-2">SELECTED PHOTOS</TerminalText>
                <ImageGallery
                  images={photos}
                  onDeleteImage={handleDeleteImage}
                  size="medium"
                  showDeleteButton={true}
                />
              </View>
            )}
          </View>

          <SectionHeading title="NOTES" className="mt-7" />
          <View onLayout={captureY("notes")}>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                <TerminalInput
                  value={value ?? ""}
                  onChangeText={onChange}
                  ref={ref}
                  placeholder="Add any notes about this range visit"
                  multiline
                  error={error?.message}
                />
              )}
            />
            {errors.notes && (
              <TerminalText
                className="text-terminal-error text-sm mt-1"
                accessibilityLiveRegion="polite"
              >
                {errors.notes.message}
              </TerminalText>
            )}
          </View>
        </View>
      </ScrollView>

      <StickyActionBar
        primaryAction={{
          caption: "Save range visit",
          onPress: onSubmit,
          disabled: isSaving,
          loading: isSaving,
        }}
      />
    </KeyboardAvoidingView>
  );
};
