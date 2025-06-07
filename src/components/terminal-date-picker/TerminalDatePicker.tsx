import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { TerminalText } from "../TerminalText";

type TerminalDatePickerProps = {
  value: Date | null;
  // eslint-disable-next-line
  onChange: (date: Date) => void;
  label: string;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  allowClear?: boolean;
};

export default function TerminalDatePicker({
  value,
  onChange,
  label,
  error,
  minDate,
  maxDate,
  placeholder = "Select date",
  allowClear = false,
}: TerminalDatePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleClear = () => {
    onChange(new Date());
  };

  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-1">
        <TerminalText>{label}</TerminalText>
        {allowClear && value && (
          <TouchableOpacity
            onPress={handleClear}
            accessibilityLabel="Clear date"
            accessibilityRole="button"
            className="border border-terminal-border px-2 py-1"
          >
            <TerminalText className="text-xs">CLEAR</TerminalText>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        className={`border ${
          error ? "border-terminal-error" : "border-terminal-border"
        } p-2 flex-row justify-between items-center`}
        accessibilityLabel={`${label} date picker`}
        accessibilityRole="button"
        accessibilityHint="Opens date picker"
      >
        <TerminalText className={!value ? "text-terminal-muted" : ""}>
          {value ? formatDate(value) : placeholder}
        </TerminalText>
        <TerminalText className="text-terminal-muted">▼</TerminalText>
      </TouchableOpacity>

      {error && (
        <TerminalText className="text-terminal-error text-sm mt-1">
          {error}
        </TerminalText>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          minimumDate={minDate}
          maximumDate={maxDate}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              onChange(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
}
