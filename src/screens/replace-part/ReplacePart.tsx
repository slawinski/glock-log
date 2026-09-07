import React, { useRef } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
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
  TerminalDatePicker,
  TerminalInput,
  TerminalText,
} from "../../components";
import { replacePartSchema, ReplacePartFormData, ReplacePartInput } from "../../validation/inputSchemas";
import {
  PartBaselineType,
  PartReplacementReason,
} from "../../validation/storageSchemas";
import { PART_BASELINE_LABELS, REPLACEMENT_REASON_LABELS } from "../../utils";

type ReplacePartScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ReplacePart"
>;
type ReplacePartScreenRouteProp = RouteProp<RootStackParamList, "ReplacePart">;

export const ReplacePart = () => {
  const navigation = useNavigation<ReplacePartScreenNavigationProp>();
  const route = useRoute<ReplacePartScreenRouteProp>();

  const saveReplace = async (data: ReplacePartInput) => {
    await storage.replacePart(route.params.slotId, data);
    form.reset(form.getValues());
    dirtyRef.current = false;
    navigation.goBack();
  };

  const { form, isSaving, onSubmit } = useEntityForm<
    ReplacePartInput,
    ReplacePartFormData
  >(replacePartSchema, saveReplace, {
    defaultValues: {
      replacementDate: new Date().toISOString(),
      reason: "scheduled" as PartReplacementReason,
      baselineType: "new" as PartBaselineType,
      startingUsageRounds: "",
      manufacturer: "",
      model: "",
      partNumber: "",
      notes: "",
    },
    entityName: "replace part",
  });

  const { control, watch } = form;

  const dirtyRef = useRef(false);
  dirtyRef.current = form.formState.isDirty;
  useUnsavedChanges(dirtyRef);

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
          <SectionHeading title="REPLACEMENT DATE" />
          <Controller
            control={control}
            name="replacementDate"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <TerminalDatePicker
                value={new Date(value)}
                onChange={(date) => onChange(date.toISOString())}
                label="REPLACEMENT DATE"
                maxDate={new Date()}
                placeholder="Select replacement date"
                error={error?.message}
              />
            )}
          />

          <SectionHeading title="REASON" className="mt-6" />
          <Controller
            control={control}
            name="reason"
            render={({ field: { onChange, value } }) => (
              <ChoiceGroup
                options={(
                  ["scheduled", "failure", "wear", "damage", "upgrade", "other"] as const
                ).map((v) => ({ value: v, label: REPLACEMENT_REASON_LABELS[v] }))}
                value={value}
                onChange={onChange}
                accessibilityLabel="Replacement reason"
                testIDPrefix="reason-"
              />
            )}
          />

          <SectionHeading title="NEW PART" className="mt-6" />
          <Controller
            control={control}
            name="baselineType"
            render={({ field: { onChange, value } }) => (
              <ChoiceGroup
                options={(
                  ["new", "known_usage", "unknown"] as const
                ).map((v) => ({ value: v, label: PART_BASELINE_LABELS[v] }))}
                value={value}
                onChange={onChange}
                accessibilityLabel="New part starting usage"
                testIDPrefix="new-baseline-"
              />
            )}
          />
          {baselineType === "known_usage" && (
            <Controller
              control={control}
              name="startingUsageRounds"
              render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                <View className="mb-2">
                  <TerminalText className="mb-1.5">STARTING USAGE (ROUNDS)</TerminalText>
                  <TerminalInput
                    value={value}
                    onChangeText={onChange}
                    ref={ref}
                    keyboardType="numeric"
                    placeholder="e.g. 200"
                    error={error?.message}
                  />
                </View>
              )}
            />
          )}

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
          caption: "Save replacement",
          onPress: onSubmit,
          disabled: isSaving,
          loading: isSaving,
        }}
      />
    </KeyboardAvoidingView>
  );
};
