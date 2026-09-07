import React, { useRef, useState } from "react";
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Controller } from "react-hook-form";
import { RootStackParamList } from "../../app/App";
import { storage } from "../../services/storage-new";
import { useEntityForm, useUnsavedChanges } from "../../hooks";
import {
  ChoiceGroup,
  SectionHeading,
  StickyActionBar,
  TerminalInput,
  TerminalText,
} from "../../components";
import { addPartSchema, AddPartFormData, AddPartInput } from "../../validation/inputSchemas";
import { PartBaselineType } from "../../validation/storageSchemas";
import { PART_BASELINE_LABELS } from "../../utils";

type AddPartScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddPart"
>;
type AddPartScreenRouteProp = RouteProp<RootStackParamList, "AddPart">;

const SUGGESTED = [
  "Recoil spring",
  "Extractor",
  "Barrel",
  "Firing pin",
  "Striker spring",
  "Trigger return spring",
];

export const AddPart = () => {
  const navigation = useNavigation<AddPartScreenNavigationProp>();
  const route = useRoute<AddPartScreenRouteProp>();

  const savePart = async (data: AddPartInput) => {
    await storage.addPart({ ...data, firearmId: route.params.firearmId });
    form.reset(form.getValues());
    dirtyRef.current = false;
    navigation.goBack();
  };

  const { form, isSaving, onSubmit } = useEntityForm<AddPartInput, AddPartFormData>(
    addPartSchema,
    savePart,
    {
      defaultValues: {
        firearmId: route.params.firearmId,
        name: "",
        trackInterval: false,
        serviceIntervalRounds: "5000",
        notifyBeforeRounds: "",
        baselineType: "new" as PartBaselineType,
        startingUsageRounds: "",
        manufacturer: "",
        model: "",
        partNumber: "",
        notes: "",
      },
      entityName: "add tracked part",
    }
  );

  const { control, watch, setValue } = form;

  const dirtyRef = useRef(false);
  dirtyRef.current = form.formState.isDirty;
  useUnsavedChanges(dirtyRef);

  const trackInterval = watch("trackInterval");
  const baselineType = watch("baselineType");

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
          <SectionHeading title="PART" />
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
              <TerminalInput
                value={value}
                onChangeText={onChange}
                ref={ref}
                placeholder="Part name"
                testID="part-name-input"
                error={error?.message}
              />
            )}
          />
          <View className="flex-row flex-wrap mt-3">
            {SUGGESTED.map((name) => (
              <Pressable
                key={name}
                onPress={() => setValue("name", name, { shouldDirty: true })}
                className="border border-terminal-border px-2 py-1 mr-2 mb-2"
                accessibilityRole="button"
                accessibilityLabel={name}
              >
                <TerminalText className="text-sm">{name}</TerminalText>
              </Pressable>
            ))}
          </View>

          <SectionHeading title="CURRENT PART" className="mt-6" />
          <Controller
            control={control}
            name="baselineType"
            render={({ field: { onChange, value } }) => (
              <ChoiceGroup
                options={(
                  ["new", "original", "known_usage", "unknown"] as const
                ).map((v) => ({ value: v, label: PART_BASELINE_LABELS[v] }))}
                value={value}
                onChange={onChange}
                accessibilityLabel="Current part baseline"
                testIDPrefix="baseline-"
              />
            )}
          />
          {baselineType === "known_usage" && (
            <Controller
              control={control}
              name="startingUsageRounds"
              render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                <View className="mb-2">
                  <TerminalText className="mb-1.5">CURRENT USAGE (ROUNDS)</TerminalText>
                  <TerminalInput
                    value={value}
                    onChangeText={onChange}
                    ref={ref}
                    keyboardType="numeric"
                    placeholder="e.g. 1750"
                    error={error?.message}
                  />
                </View>
              )}
            />
          )}

          <SectionHeading title="SERVICE INTERVAL" className="mt-6" />
          <Controller
            control={control}
            name="trackInterval"
            render={({ field: { value, onChange } }) => (
              <Pressable
                onPress={() => onChange(!value)}
                className="flex-row items-center py-2"
                accessibilityRole="checkbox"
                accessibilityLabel="Track interval"
                accessibilityState={{ checked: value }}
              >
                <TerminalText className="mr-2">{value ? "[x]" : "[ ]"}</TerminalText>
                <TerminalText>Track interval</TerminalText>
              </Pressable>
            )}
          />
          {trackInterval && (
            <>
              <Controller
                control={control}
                name="serviceIntervalRounds"
                render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                  <View className="mb-2">
                    <TerminalText className="mb-1.5">INTERVAL (ROUNDS)</TerminalText>
                    <TerminalInput
                      value={value}
                      onChangeText={onChange}
                      ref={ref}
                      keyboardType="numeric"
                      placeholder="e.g. 5000"
                      error={error?.message}
                    />
                  </View>
                )}
              />
              <Controller
                control={control}
                name="notifyBeforeRounds"
                render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                  <View className="mb-2">
                    <TerminalText className="mb-1.5">NOTIFY BEFORE (ROUNDS)</TerminalText>
                    <TerminalInput
                      value={value}
                      onChangeText={onChange}
                      ref={ref}
                      keyboardType="numeric"
                      placeholder="e.g. 500 (optional)"
                      error={error?.message}
                    />
                  </View>
                )}
              />
            </>
          )}

          <SectionHeading title="OPTIONAL DETAILS" className="mt-6" />
          <Controller
            control={control}
            name="manufacturer"
            render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
              <TerminalInput
                value={value ?? ""}
                onChangeText={onChange}
                ref={ref}
                placeholder="Manufacturer"
                error={error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="model"
            render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
              <TerminalInput
                value={value ?? ""}
                onChangeText={onChange}
                ref={ref}
                placeholder="Model"
                error={error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="partNumber"
            render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
              <TerminalInput
                value={value ?? ""}
                onChangeText={onChange}
                ref={ref}
                placeholder="Part number"
                error={error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
              <TerminalInput
                value={value ?? ""}
                onChangeText={onChange}
                ref={ref}
                placeholder="Notes"
                multiline
                error={error?.message}
              />
            )}
          />
        </View>
      </ScrollView>

      <StickyActionBar
        primaryAction={{
          caption: "Start tracking",
          onPress: onSubmit,
          disabled: isSaving,
          loading: isSaving,
        }}
      />
    </KeyboardAvoidingView>
  );
};
