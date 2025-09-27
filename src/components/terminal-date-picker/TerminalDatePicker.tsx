import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { TerminalText } from "../terminal-text/TerminalText";

type TerminalDatePickerProps = {
  value: Date | null;
  onChange: (date: Date) => void;
  label: string;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  allowClear?: boolean;
};

export function TerminalDatePicker({
  value,
  onChange,
  label,
  error,
  minDate,
  maxDate,
  placeholder = "Select date",
  allowClear = false,
}: TerminalDatePickerProps) {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date: Date) => {
    onChange(date);
    hideDatePicker();
  };

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
        onPress={showDatePicker}
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

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        date={value || new Date()}
        minimumDate={minDate}
        maximumDate={maxDate}
      />
    </View>
  );
}

export default TerminalDatePicker;
