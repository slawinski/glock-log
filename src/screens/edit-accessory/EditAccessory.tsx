import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Controller } from "react-hook-form";
import { RootStackParamList } from "../../app/App";
import { handleError } from "../../services/error-handler";
import { storage } from "../../services/storage-new";
import { useEntityForm, useUnsavedChanges } from "../../hooks";
import {
  ErrorDisplay,
  LoadingScreen,
  SectionHeading,
  StickyActionBar,
  TerminalInput,
  TerminalText,
} from "../../components";
import { accessoryInputSchema, AccessoryFormData, AccessoryInput } from "../../validation/inputSchemas";
import { AccessoryCategory } from "../../validation/storageSchemas";
import { ACCESSORY_CATEGORY_LABELS } from "../../utils";

type EditAccessoryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditAccessory"
>;
type EditAccessoryScreenRouteProp = RouteProp<RootStackParamList, "EditAccessory">;

const CATEGORIES = Object.keys(ACCESSORY_CATEGORY_LABELS) as AccessoryCategory[];

export const EditAccessory = () => {
  const navigation = useNavigation<EditAccessoryScreenNavigationProp>();
  const route = useRoute<EditAccessoryScreenRouteProp>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const saveAccessory = async (data: AccessoryInput) => {
    await storage.saveAccessory({ ...data, id: route.params.id });
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
        amountPaid: "",
        initialRounds: "0",
        notes: "",
      },
      entityName: "save accessory",
    }
  );

  const { control, reset } = form;

  const dirtyRef = useRef(false);
  dirtyRef.current = form.formState.isDirty;
  useUnsavedChanges(dirtyRef);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const accessory = await storage.getAccessory(route.params.id);
      if (!accessory) {
        setError("Accessory not found");
        return;
      }
      reset({
        category: accessory.category,
        manufacturer: accessory.manufacturer ?? "",
        modelName: accessory.modelName,
        serialNumber: accessory.serialNumber ?? "",
        amountPaid: accessory.amountPaid?.toString() ?? "",
        initialRounds: accessory.initialRounds.toString(),
        notes: accessory.notes ?? "",
      });
    } catch (e) {
      handleError(e, "EditAccessory.load", { isUserFacing: true, userMessage: "Failed to load accessory." });
      setError("Failed to load accessory.");
    } finally {
      setLoading(false);
    }
  }, [route.params.id, reset]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorDisplay errorMessage={error} onRetry={load} />;

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
                      value === category ? "bg-terminal-green border-terminal-green" : "border-terminal-border"
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={ACCESSORY_CATEGORY_LABELS[category]}
                    accessibilityState={{ selected: value === category }}
                  >
                    <TerminalText className={`text-sm ${value === category ? "text-terminal-bg" : ""}`}>
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
                <TerminalInput value={value} onChangeText={onChange} ref={ref} placeholder="Model" error={fieldError?.message} />
              </View>
            )}
          />
          <Controller
            control={control}
            name="manufacturer"
            render={({ field: { onChange, value, ref }, fieldState: { error: fieldError } }) => (
              <TerminalInput value={value ?? ""} onChangeText={onChange} ref={ref} placeholder="Manufacturer" error={fieldError?.message} />
            )}
          />
          <Controller
            control={control}
            name="serialNumber"
            render={({ field: { onChange, value, ref }, fieldState: { error: fieldError } }) => (
              <TerminalInput value={value ?? ""} onChangeText={onChange} ref={ref} placeholder="Serial number" error={fieldError?.message} />
            )}
          />

          <SectionHeading title="USAGE" className="mt-6" />
          <Controller
            control={control}
            name="initialRounds"
            render={({ field: { onChange, value, ref }, fieldState: { error: fieldError } }) => (
              <View className="mb-2">
                <TerminalText className="mb-1.5">ROUNDS BEFORE TRIGGERNOTE</TerminalText>
                <TerminalInput value={value} onChangeText={onChange} ref={ref} keyboardType="numeric" error={fieldError?.message} />
              </View>
            )}
          />

          <SectionHeading title="NOTES" className="mt-6" />
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value, ref }, fieldState: { error: fieldError } }) => (
              <TerminalInput value={value ?? ""} onChangeText={onChange} ref={ref} placeholder="Notes" multiline error={fieldError?.message} />
            )}
          />
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
