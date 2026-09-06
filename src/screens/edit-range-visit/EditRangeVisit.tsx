import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  LayoutChangeEvent,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Controller, useWatch } from "react-hook-form";
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
  LoadingScreen,
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
import { AmmunitionStorage } from "../../validation/storageSchemas";

type EditRangeVisitScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditRangeVisit"
>;

type EditRangeVisitScreenRouteProp = RouteProp<
  RootStackParamList,
  "EditRangeVisit"
>;

const FIELD_ORDER = ["location", "date", "notes"] as const;

export const EditRangeVisit = () => {
  const navigation = useNavigation<EditRangeVisitScreenNavigationProp>();
  const route = useRoute<EditRangeVisitScreenRouteProp>();
  const scrollRef = useRef<ScrollView>(null);
  const fieldY = useRef<Record<string, number>>({});
  const initialPhotosRef = useRef<string[]>([]);
  const originalAmmunitionUsedRef = useRef<
    Record<string, { ammunitionId: string; rounds: number }> | undefined
  >(undefined);
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
      for (const [key, usage] of Object.entries(data.ammunitionUsed)) {
        if (!usage.ammunitionId) {
          continue; // borrowed (external) ammo — no inventory check
        }
        const ammo = ammunition.find((a) => a.id === usage.ammunitionId);
        if (!ammo) {
          throw new Error(`Ammunition not found for ${usage.ammunitionId}`);
        }
        // Only a NET increase in rounds consumes stock; reducing rounds (e.g.
        // correcting a previous mistake) returns the difference to inventory.
        const originalRounds =
          originalAmmunitionUsedRef.current?.[key]?.rounds ?? 0;
        const roundsDelta = usage.rounds - originalRounds;
        if (roundsDelta > 0 && ammo.quantity < roundsDelta) {
          Alert.alert(
            "Insufficient ammunition",
            `You only have ${ammo.quantity} rounds of ${ammo.brand} ${ammo.caliber} in inventory (this change adds ${roundsDelta}).`,
            [{ text: "Change ammunition", style: "cancel" }]
          );
          return;
        }
      }
    }

    await storage.saveRangeVisitWithAmmunition({ ...data, photos });
    form.reset(form.getValues());
    dirtyRef.current = false;
    initialPhotosRef.current = [...photos];
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
    setFocus,
    formState: { errors, isDirty },
  } = form;

  const dirtyRef = useRef(false);
  const photosChanged =
    photos.length !== initialPhotosRef.current.length ||
    photos.some((photo, index) => photo !== initialPhotosRef.current[index]);
  dirtyRef.current = isDirty || photosChanged;
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

  const watchedFirearmsUsed = useWatch({ control, name: "firearmsUsed" });
  const watchedAmmunitionUsed =
    useWatch({ control, name: "ammunitionUsed" }) ?? {};

  const fetchVisit = useCallback(async () => {
    try {
      setLoading(true);
      const visits = await storage.getRangeVisits();
      const visit = visits.find((v) => v.id === route.params!.id);
      if (visit) {
        const ammunitionUsedForm: Record<
          string,
          { ammunitionId: string; rounds: string }
        > = {};
        for (const [key, usage] of Object.entries(visit.ammunitionUsed || {})) {
          ammunitionUsedForm[key] = {
            ammunitionId: usage.ammunitionId,
            rounds: String(usage.rounds),
          };
        }
        reset({
          id: visit.id,
          date: visit.date,
          location: visit.location,
          notes: visit.notes || "",
          firearmsUsed: visit.firearmsUsed,
          ammunitionUsed: ammunitionUsedForm,
        });
        setPhotos(visit.photos ?? []);
        initialPhotosRef.current = visit.photos ?? [];
        originalAmmunitionUsedRef.current = visit.ammunitionUsed;
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

  const totalRounds = Object.values(watchedAmmunitionUsed).reduce(
    (sum, entry) => {
      const rounds = Number(entry.rounds);
      return sum + (Number.isFinite(rounds) && rounds > 0 ? rounds : 0);
    },
    0
  );

  const borrowedCount = Object.keys(watchedAmmunitionUsed).filter((key) =>
    key.startsWith("borrowed-")
  ).length;
  const firearmCount = (watchedFirearmsUsed ?? []).length + borrowedCount;

  const ammoPreview = Object.entries(watchedAmmunitionUsed)
    .filter(([, entry]) => entry.ammunitionId && Number(entry.rounds) > 0)
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
    return <ErrorDisplay errorMessage={error} onRetry={fetchVisit} />;
  }

  if (loading) {
    return <LoadingScreen />;
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
                  placeholder="e.g., Local Range"
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
            selectedFirearms={watchedFirearmsUsed ?? []}
            ammunitionUsed={watchedAmmunitionUsed}
            onToggleFirearm={toggleFirearmSelection}
            onRoundsChange={(firearmId, rounds) => {
              const currentAmmo = getValues("ammunitionUsed") ?? {};
              setValue("ammunitionUsed", {
                ...currentAmmo,
                [firearmId]: {
                  ammunitionId: currentAmmo[firearmId]?.ammunitionId || "",
                  rounds,
                },
              });
            }}
            onAmmunitionSelect={(firearmId, ammunitionId) => {
              const currentAmmo = getValues("ammunitionUsed") ?? {};
              setValue("ammunitionUsed", {
                ...currentAmmo,
                [firearmId]: {
                  ammunitionId,
                  rounds: currentAmmo[firearmId]?.rounds ?? "",
                },
              });
            }}
            onAddBorrowedAmmunition={() => {
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
                  ...(currentAmmo[key] ?? { ammunitionId: "", rounds: "" }),
                  rounds,
                },
              });
            }}
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
                  placeholder="Optional notes"
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
          caption: "Save changes",
          onPress: onSubmit,
          disabled: isSaving,
          loading: isSaving,
        }}
      />
    </KeyboardAvoidingView>
  );
};
