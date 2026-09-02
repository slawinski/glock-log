import React from "react";
import { View, Pressable } from "react-native";
import { format } from "date-fns";
import { TerminalText } from "../terminal-text/TerminalText";

type Props = {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export const TerminalCalendarHeader = ({
  currentDate,
  onPrevMonth,
  onNextMonth,
}: Props) => {
  return (
    <View className="flex-row justify-between items-center mb-2">
      <Pressable
        onPress={onPrevMonth}
        testID="prev-month-button"
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        accessibilityHint={`Goes to the month before ${format(
          currentDate,
          "MMMM yyyy"
        ).toUpperCase()}`}
      >
        <TerminalText className="text-lg text-terminal-green">
          {"<"}
        </TerminalText>
      </Pressable>
      <TerminalText className="text-lg text-terminal-green">
        {format(currentDate, "MMMM yyyy").toUpperCase()}
      </TerminalText>
      <Pressable
        onPress={onNextMonth}
        testID="next-month-button"
        accessibilityRole="button"
        accessibilityLabel="Next month"
        accessibilityHint={`Goes to the month after ${format(
          currentDate,
          "MMMM yyyy"
        ).toUpperCase()}`}
      >
        <TerminalText className="text-lg text-terminal-green">
          {">"}
        </TerminalText>
      </Pressable>
    </View>
  );
};
