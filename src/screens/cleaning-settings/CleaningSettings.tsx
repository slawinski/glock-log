import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Controller } from "react-hook-form";
import { RootStackParamList } from "../../app/App";
import { handleError } from "../../services/error-handler";
import { storage } from "../../services/storage-new";
import { DEFAULT_WARNING_THRESHOLD_PERCENT } from "../../services/cleaning-calculation";
import { useEntityForm, useUnsavedChanges } from "../../hooks";
import {
  ChoiceGroup,
  LoadingScreen,
  SectionHeading,
  StickyActionBar,
  TerminalInput,
  TerminalText,
} from "../../components";
import {
  cleaningSettingsInputSchema,
  CleaningSettingsFormData,
  CleaningSettingsInput,
} from "../../validation/inputSchemas";
import { CleaningSettings as CleaningSettingsData } from "../../validation/storageSchemas";

type CleaningSettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CleaningSettings"
>;
type CleaningSettingsScreenRouteProp = RouteProp<
  RootStackParamList,
  "CleaningSettings"
>;

type StartMode = "now" | "history";

export const CleaningSettings = () => {
  const navigation = useNavigation<CleaningSettingsScreenNavigationProp>();
  const route = useRoute<CleaningSettingsScreenRouteProp>();
  const [startMode, setStartMode] = useState<StartMode>("now");
  const existingRef = useRef<CleaningSettingsData | undefined>(undefined);

  const saveCleaningSettings = async (data: CleaningSettingsInput) => {
    const now = new Date().toISOString();
    const settings: CleaningSettingsData = {
      firearmId: route.params.firearmId,
      fieldStripEnabled: data.fieldStripEnabled,
      fieldStripIntervalRounds: data.fieldStripEnabled
        ? Number(data.fieldStripIntervalRounds)
        : undefined,
      completeEnabled: data.completeEnabled,
      completeIntervalRounds: data.completeEnabled
        ? Number(data.completeIntervalRounds)
        : undefined,
      warningThresholdPercent: DEFAULT_WARNING_THRESHOLD_PERCENT,
      trackingBaselineAt:
        startMode === "now" ? now : undefined,
      createdAt: existingRef.current?.createdAt ?? now,
      updatedAt: now,
    };
    await storage.saveCleaningSettings(settings);
    form.reset(form.getValues());
    dirtyRef.current = false;
    navigation.goBack();
  };

  const { form, isSaving, onSubmit } = useEntityForm<
    CleaningSettingsInput,
    CleaningSettingsFormData
  >(cleaningSettingsInputSchema, saveCleaningSettings, {
    defaultValues: {
      firearmId: route.params.firearmId,
      fieldStripEnabled: false,
      fieldStripIntervalRounds: "500",
      completeEnabled: false,
      completeIntervalRounds: "3000",
    },
    entityName: "save cleaning settings",
  });

  const { control, reset, watch } = form;

  const dirtyRef = useRef(false);
  const localDirty = startMode === "now";
  dirtyRef.current = form.formState.isDirty || localDirty;
  useUnsavedChanges(dirtyRef);

  const fieldStripEnabled = watch("fieldStripEnabled");
  const completeEnabled = watch("completeEnabled");

  useEffect(() => {
    (async () => {
      try {
        const existing = await storage.getCleaningSettings(route.params.firearmId);
        if (existing) {
          existingRef.current = existing;
          setStartMode(existing.trackingBaselineAt ? "now" : "history");
          reset({
            firearmId: existing.firearmId,
            fieldStripEnabled: existing.fieldStripEnabled,
            fieldStripIntervalRounds: String(
              existing.fieldStripIntervalRounds ?? 500
            ),
            completeEnabled: existing.completeEnabled,
            completeIntervalRounds: String(
              existing.completeIntervalRounds ?? 3000
            ),
          });
        }
      } catch (e) {
        handleError(e, "CleaningSettings.load", { isUserFacing: true, userMessage: "Failed to load cleaning settings." });
      }
    })();
  }, [route.params.firearmId, reset]);

  const renderToggle = (
    label: string,
    value: boolean,
    onChange: (v: boolean) => void
  ) => (
    <Pressable
      onPress={() => onChange(!value)}
      className="flex-row items-center py-2"
      accessibilityRole="checkbox"
      accessibilityLabel={`Track ${label}`}
      accessibilityState={{ checked: value }}
      testID={`toggle-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <TerminalText className="mr-2">{value ? "[x]" : "[ ]"}</TerminalText>
      <TerminalText>{label}</TerminalText>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-4 pb-24">
          <SectionHeading title="CLEANING INTERVALS" />

          <Controller
            control={control}
            name="fieldStripEnabled"
            render={({ field: { value, onChange } }) =>
              renderToggle("Track field strip", value, onChange)
            }
          />
          {fieldStripEnabled && (
            <Controller
              control={control}
              name="fieldStripIntervalRounds"
              render={({ field: { value, onChange, ref }, fieldState: { error } }) => (
                <View className="mb-2">
                  <TerminalText className="mb-1.5">EVERY (ROUNDS)</TerminalText>
                  <TerminalInput
                    value={value}
                    onChangeText={onChange}
                    ref={ref}
                    keyboardType="numeric"
                    placeholder="e.g. 500"
                    testID="field-strip-interval-input"
                    error={error?.message}
                  />
                </View>
              )}
            />
          )}

          <Controller
            control={control}
            name="completeEnabled"
            render={({ field: { value, onChange } }) =>
              renderToggle("Track complete disassembly", value, onChange)
            }
          />
          {completeEnabled && (
            <Controller
              control={control}
              name="completeIntervalRounds"
              render={({ field: { value, onChange, ref }, fieldState: { error } }) => (
                <View className="mb-2">
                  <TerminalText className="mb-1.5">EVERY (ROUNDS)</TerminalText>
                  <TerminalInput
                    value={value}
                    onChangeText={onChange}
                    ref={ref}
                    keyboardType="numeric"
                    placeholder="e.g. 3000"
                    testID="complete-interval-input"
                    error={error?.message}
                  />
                </View>
              )}
            />
          )}

          <SectionHeading title="START COUNTING FROM" className="mt-6" />
          <ChoiceGroup
            options={[
              { value: "now", label: "Now", description: "Ignore rounds before today for cleaning status" },
              { value: "history", label: "Existing cleaning history", description: "Derive status from logged cleaning events" },
            ]}
            value={startMode}
            onChange={(v) => setStartMode(v)}
            accessibilityLabel="Tracking baseline"
            testIDPrefix="baseline-"
          />
        </View>
      </ScrollView>

      <StickyActionBar
        primaryAction={{
          caption: "Save settings",
          onPress: onSubmit,
          disabled: isSaving,
          loading: isSaving,
        }}
      />
    </View>
  );
};
