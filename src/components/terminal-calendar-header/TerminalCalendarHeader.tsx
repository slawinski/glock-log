import React from "react";
import { View, TouchableOpacity } from "react-native";
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
      <TouchableOpacity onPress={onPrevMonth} testID="prev-month-button">
        <TerminalText className="text-lg text-terminal-green">
          {"<"}
        </TerminalText>
      </TouchableOpacity>
      <TerminalText className="text-lg text-terminal-green">
        {format(currentDate, "MMMM yyyy").toUpperCase()}
      </TerminalText>
      <TouchableOpacity onPress={onNextMonth} testID="next-month-button">
        <TerminalText className="text-lg text-terminal-green">
          {">"}
        </TerminalText>
      </TouchableOpacity>
    </View>
  );
};
