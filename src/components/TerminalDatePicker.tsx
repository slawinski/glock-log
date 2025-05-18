import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { TerminalText } from "./TerminalText";

interface TerminalDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label: string;
}

export default function TerminalDatePicker({
  value,
  onChange,
  label,
}: TerminalDatePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <View className="mb-4">
      <TerminalText>{label}</TerminalText>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        className="border border-terminal-border p-2"
      >
        <TerminalText>{value.toLocaleDateString()}</TerminalText>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
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
