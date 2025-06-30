import React, { useState } from "react";
import { View } from "react-native";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
  add,
  sub,
} from "date-fns";
import { TerminalText } from "../terminal-text/TerminalText";
import { TerminalCalendarHeader } from "../terminal-calendar-header";

interface TerminalCalendarProps {
  highlightedDates: Date[];
  initialDate?: Date;
}

const WEEK_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const TerminalCalendar: React.FC<TerminalCalendarProps> = ({
  highlightedDates,
  initialDate = new Date(),
}) => {
  const [currentDate, setCurrentDate] = useState(initialDate);

  const handlePrevMonth = () => {
    setCurrentDate(sub(currentDate, { months: 1 }));
  };

  const handleNextMonth = () => {
    setCurrentDate(add(currentDate, { months: 1 }));
  };

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(firstDayOfMonth),
    end: endOfWeek(lastDayOfMonth),
  });

  const getDayComponent = (day: Date, index: number) => {
    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
    const isHighlighted = highlightedDates.some((d) => isSameDay(d, day));

    const props: { className?: string; style?: { color: string } } = {};

    if (isHighlighted) {
      props.className = "bg-terminal-green text-terminal-bg";
    } else if (!isCurrentMonth) {
      props.style = { color: "#666666" };
    }

    return (
      <View
        key={index}
        className="flex-1 items-center justify-center aspect-square"
      >
        <TerminalText {...props}>{format(day, "d")}</TerminalText>
      </View>
    );
  };

  return (
    <View className="p-2">
      <TerminalCalendarHeader
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      <View className="flex-row">
        {WEEK_DAYS.map((day) => (
          <View key={day} className="flex-1 items-center">
            <TerminalText className="text-terminal-green">{day}</TerminalText>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {daysInMonth.map((day, index) => (
          <View
            key={index}
            style={{ width: `${100 / 7}%` }}
            className="items-center justify-center"
          >
            {getDayComponent(day, index)}
          </View>
        ))}
      </View>
    </View>
  );
};
