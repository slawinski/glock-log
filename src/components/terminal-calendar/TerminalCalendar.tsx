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
import { TerminalText, TerminalCalendarHeader } from "../../components";

type Props = {
  highlightedDates: Date[];
  initialDate?: Date;
};

const WEEK_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const TerminalCalendar = ({
  highlightedDates,
  initialDate = new Date(),
}: Props) => {
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

    let viewClass = "flex-1 items-center justify-center aspect-square";
    let textClass = "";
    if (isHighlighted) {
      textClass =
        "bg-terminal-green text-terminal-bg px-1 min-w-[23px] text-center";
    } else if (!isCurrentMonth) {
      textClass = "text-terminal-muted";
    }

    return (
      <View key={index} className={viewClass}>
        <TerminalText className={textClass}>{format(day, "d")}</TerminalText>
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
