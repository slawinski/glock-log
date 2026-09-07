import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Controller } from "react-hook-form";
import { RootStackParamList } from "../../app/App";
import { handleError } from "../../services/error-handler";
import { storage } from "../../services/storage-new";
import { findReconciliation } from "../../services/accessory-reconciliation";
import {
  useEntityForm,
  useImagePicker,
  useUnsavedChanges,
} from "../../hooks";
import {
  ErrorDisplay,
  ImageGallery,
  SectionHeading,
  StickyActionBar,
  TerminalButton,
  TerminalDatePicker,
  TerminalInput,
  TerminalText,
} from "../../components";
import { accessoryInputSchema, AccessoryFormData, AccessoryInput } from "../../validation/inputSchemas";
import {
  AccessoryCategory,
  FirearmStorage,
} from "../../validation/storageSchemas";
import { ACCESSORY_CATEGORY_LABELS } from "../../utils";

type AddAccessoryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddAccessory"
>;

const CATEGORIES = Object.keys(ACCESSORY_CATEGORY_LABELS) as AccessoryCategory[];

export const AddAccessory = () => {
  const navigation = useNavigation<AddAccessoryScreenNavigationProp>();
  const [firearms, setFirearms] = useState<FirearmStorage[]>([]);
  const [mountedFirearmId, setMountedFirearmId] = useState<string | null>(null);
  const [mountedAt, setMountedAt] = useState(new Date().toISOString());
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { pickImages, isPicking } = useImagePicker({ selectionLimit: 10 });

  const saveAccessory = async (data: AccessoryInput) => {
    const mount =
      mountedFirearmId && mountedFirearmId !== "none"
        ? { firearmId: mountedFirearmId, mountedAt }
        : undefined;

    const id = await storage.saveAccessory({ ...data, photos }, mount);

    // Historical reconciliation: if mounted in the past, surface candidate visits.
    if (mount && new Date(mountedAt).getTime() < Date.now()) {
      const saved = await storage.getAccessory(id);
      const visits = await storage.getRangeVisits();
      if (saved) {
        const reconciliation = findReconciliation(saved, visits);
        if (reconciliation.missingUsage.length > 0 || reconciliation.ambiguousUsage.length > 0) {
          form.reset(form.getValues());
          dirtyRef.current = false;
          navigation.replace("AccessoryReconciliation", { accessoryId: id });
          return;
        }
      }
    }

    form.reset(form.getValues());
    dirtyRef.current = false;
    navigation.goBack();
  };

  const { form, isSaving, onSubmit } = useEntityForm<AccessoryInput, AccessoryFormData>(
    accessoryInputSchema,
    saveAccessory,
    {
      defaultValues: {
        category: "red_dot" as AccessoryCategory,
        manufacturer: "",
        modelName: "",
        serialNumber: "",
        datePurchased: undefined,
        amountPaid: "",
        initialRounds: "0",
        notes: "",
      },
      entityName: "save accessory",
    }
  );

  const { control } = form;

  const dirtyRef = useRef(false);
  const localDirty =
    mountedFirearmId !== null || photos.length > 0;
  dirtyRef.current = form.formState.isDirty || localDirty;
  useUnsavedChanges(dirtyRef);

  useEffect(() => {
    (async () => {
      try {
        setFirearms(await storage.getFirearms());
      } catch (e) {
        handleError(e, "AddAccessory.load", { isUserFacing: true, userMessage: "Failed to load firearms." });
        setError("Failed to load firearms.");
      }
    })();
  }, []);

  const handleImagePick = async () => {
    const assets = await pickImages();
    if (assets.length > 0) {
      setPhotos((prev) => [...prev, ...assets.map((a) => a.uri!).filter(Boolean)]);
    }
  };

  if (error) return <ErrorDisplay errorMessage={error} onRetry={() => setError(null)} />;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-terminal-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pb-24">
          <SectionHeading title="CATEGORY" />
          <Controller
            control={control}
            name="category"
            render={({ field: { value, onChange } }) => (
              <View className="flex-row flex-wrap">
                {CATEGORIES.map((category) => (
                  <Pressable
                    key={category}
                    onPress={() => onChange(category)}
                    className={`border px-2 py-1 mr-2 mb-2 ${
                      value === category
                        ? "bg-terminal-green border-terminal-green"
                        : "border-terminal-border"
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={ACCESSORY_CATEGORY_LABELS[category]}
                    accessibilityState={{ selected: value === category }}
                  >
                    <TerminalText
                      className={`text-sm ${value === category ? "text-terminal-bg" : ""}`}
                    >
                      {ACCESSORY_CATEGORY_LABELS[category]}
                    </TerminalText>
                  </Pressable>
                ))}
              </View>
            )}
          />

          <SectionHeading title="BASIC INFORMATION" className="mt-6" />
          <Controller
            control={control}
            name="modelName"
            render={({ field: { onChange, value, ref }, fieldState: { error: fieldError } }) => (
              <View className="mb-2">
                <TerminalText className="mb-1.5">MODEL *</TerminalText>
                <TerminalInput
                  value={value}
                  onChangeText={onChange}
                  ref={ref}
                  placeholder="e.g. 507Comp"
                  testID="accessory-model-input"
                  error={fieldError?.message}
                />
              </View>
            )}
          />
          <Controller
            control={control}
            name="manufacturer"
            render={({ field: { onChange, value, ref }, fieldState: { error: fieldError } }) => (
              <TerminalInput
                value={value ?? ""}
                onChangeText={onChange}
                ref={ref}
                placeholder="Manufacturer"
                error={fieldError?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="serialNumber"
            render={({ field: { onChange, value, ref }, fieldState: { error: fieldError } }) => (
              <TerminalInput
                value={value ?? ""}
                onChangeText={onChange}
                ref={ref}
                placeholder="Serial number"
                error={fieldError?.message}
              />
            )}
          />

          <SectionHeading title="USAGE" className="mt-6" />
          <Controller
            control={control}
            name="initialRounds"
            render={({ field: { onChange, value, ref }, fieldState: { error: fieldError } }) => (
              <View className="mb-2">
                <TerminalText className="mb-1.5">ROUNDS BEFORE TRIGGERNOTE</TerminalText>
                <TerminalInput
                  value={value}
                  onChangeText={onChange}
                  ref={ref}
                  keyboardType="numeric"
                  placeholder="0"
                  error={fieldError?.message}
                />
                <TerminalText className="text-terminal-muted text-sm mt-1">
                  Rounds accumulated before this accessory was tracked through TriggerNote range visits.
                </TerminalText>
              </View>
            )}
          />

          <SectionHeading title="CURRENT SETUP" className="mt-6" />
          <TerminalText className="mb-1.5">MOUNTED ON</TerminalText>
          <Pressable
            onPress={() => setMountedFirearmId("none")}
            className={`border px-2 py-2 mb-2 ${
              mountedFirearmId === "none" ? "bg-terminal-green border-terminal-green" : "border-terminal-border"
            }`}
            accessibilityRole="button"
            accessibilityState={{ selected: mountedFirearmId === "none" }}
          >
            <TerminalText className={mountedFirearmId === "none" ? "text-terminal-bg" : ""}>
              Not mounted
            </TerminalText>
          </Pressable>
          {firearms.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => setMountedFirearmId(f.id)}
              className={`border px-2 py-2 mb-2 ${
                mountedFirearmId === f.id ? "bg-terminal-green border-terminal-green" : "border-terminal-border"
              }`}
              accessibilityRole="button"
              accessibilityState={{ selected: mountedFirearmId === f.id }}
            >
              <TerminalText className={mountedFirearmId === f.id ? "text-terminal-bg" : ""}>
                {f.modelName}
              </TerminalText>
            </Pressable>
          ))}

          {mountedFirearmId && mountedFirearmId !== "none" && (
            <TerminalDatePicker
              value={new Date(mountedAt)}
              onChange={(date) => setMountedAt(date.toISOString())}
              label="MOUNTED SINCE"
              maxDate={new Date()}
              placeholder="Select mount date"
            />
          )}

          <SectionHeading title="PHOTOS" className="mt-6" />
          <TerminalButton
            onPress={handleImagePick}
            className="mb-2"
            caption="ADD PHOTOS"
            disabled={isPicking}
          />
          {photos.length > 0 && (
            <ImageGallery
              images={photos}
              onDeleteImage={(index) => setPhotos((prev) => prev.filter((_, i) => i !== index))}
              size="medium"
              showDeleteButton
            />
          )}

          <SectionHeading title="NOTES" className="mt-6" />
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value, ref }, fieldState: { error: fieldError } }) => (
              <TerminalInput
                value={value ?? ""}
                onChangeText={onChange}
                ref={ref}
                placeholder="Notes"
                multiline
                error={fieldError?.message}
              />
            )}
          />
        </View>
      </ScrollView>

      <StickyActionBar
        primaryAction={{
          caption: "Save accessory",
          onPress: onSubmit,
          disabled: isSaving,
          loading: isSaving,
        }}
      />
    </KeyboardAvoidingView>
  );
};
