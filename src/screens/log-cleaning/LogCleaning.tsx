import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Controller } from "react-hook-form";
import { RootStackParamList } from "../../app/App";
import { handleError } from "../../services/error-handler";
import { storage } from "../../services/storage-new";
import { useEntityForm, useUnsavedChanges } from "../../hooks";
import {
  ChoiceGroup,
  ErrorDisplay,
  LoadingScreen,
  SectionHeading,
  StickyActionBar,
  TerminalDatePicker,
  TerminalInput,
  TerminalText,
} from "../../components";
import {
  cleaningEventFormSchema,
  CleaningEventFormData,
  CleaningEventInput,
} from "../../validation/inputSchemas";
import { CleaningEvent, CleaningType } from "../../validation/storageSchemas";
import { CLEANING_TYPE_LABELS } from "../../utils";

type LogCleaningScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "LogCleaning"
>;
type LogCleaningScreenRouteProp = RouteProp<RootStackParamList, "LogCleaning">;

const TYPE_OPTIONS = (
  ["field_strip", "complete_disassembly"] as const
).map((value) => ({
  value,
  label: CLEANING_TYPE_LABELS[value],
  description:
    value === "complete_disassembly"
      ? "Also resets the field-strip counter"
      : "Resets field-strip usage only",
}));

export const LogCleaning = () => {
  const navigation = useNavigation<LogCleaningScreenNavigationProp>();
  const route = useRoute<LogCleaningScreenRouteProp>();
  const [loading, setLoading] = useState(!!route.params?.eventId);
  const [error, setError] = useState<string | null>(null);

  const saveCleaningEvent = async (data: CleaningEventInput) => {
    await storage.saveCleaningEvent({
      ...data,
      id: route.params.eventId,
      firearmId: route.params.firearmId,
    });
    form.reset(form.getValues());
    dirtyRef.current = false;
    navigation.goBack();
  };

  const { form, isSaving, onSubmit } = useEntityForm<
    CleaningEventInput,
    CleaningEventFormData
  >(cleaningEventFormSchema, saveCleaningEvent, {
    defaultValues: {
      firearmId: route.params.firearmId,
      type: "field_strip" as CleaningType,
      performedAt: new Date().toISOString(),
      notes: "",
    },
    entityName: "log cleaning",
  });

  const {
    control,
    reset,
    formState: { errors, isDirty },
  } = form;

  const dirtyRef = useRef(false);
  dirtyRef.current = isDirty;
  useUnsavedChanges(dirtyRef);

  const loadEvent = useCallback(async () => {
    const eventId = route.params?.eventId;
    if (!eventId) return;
    try {
      const events = await storage.getCleaningEvents(route.params.firearmId);
      const event = events.find((e: CleaningEvent) => e.id === eventId);
      if (event) {
        reset({
          firearmId: event.firearmId,
          type: event.type,
          performedAt: event.performedAt,
          notes: event.notes ?? "",
        });
      } else {
        setError("Cleaning event not found");
      }
    } catch (e) {
      handleError(e, "LogCleaning.loadEvent", { isUserFacing: true, userMessage: "Failed to load cleaning event." });
      setError("Failed to load cleaning event.");
    } finally {
      setLoading(false);
    }
  }, [route.params, reset]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorDisplay errorMessage={error} onRetry={loadEvent} />;
  }

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
          <SectionHeading title="CLEANING TYPE" />
          <Controller
            control={control}
            name="type"
            render={({ field: { onChange, value } }) => (
              <ChoiceGroup
                options={TYPE_OPTIONS}
                value={value}
                onChange={onChange}
                accessibilityLabel="Cleaning type"
                testIDPrefix="cleaning-type-"
              />
            )}
          />

          <SectionHeading title="DATE" className="mt-6" />
          <Controller
            control={control}
            name="performedAt"
            render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
              <TerminalDatePicker
                value={new Date(value)}
                onChange={(date) => onChange(date.toISOString())}
                label="CLEANING DATE"
                maxDate={new Date()}
                placeholder="Select cleaning date"
                error={fieldError?.message}
              />
            )}
          />
          {errors.performedAt && (
            <TerminalText className="text-terminal-error text-sm mt-1" accessibilityLiveRegion="polite">
              {errors.performedAt.message}
            </TerminalText>
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
                placeholder="Optional notes (solvents, condition, etc.)"
                multiline
                error={fieldError?.message}
              />
            )}
          />
        </View>
      </ScrollView>

      <StickyActionBar
        primaryAction={{
          caption: "Save cleaning",
          onPress: onSubmit,
          disabled: isSaving,
          loading: isSaving,
        }}
      />
    </KeyboardAvoidingView>
  );
};
