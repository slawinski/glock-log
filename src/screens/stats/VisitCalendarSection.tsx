import { useMemo, useState } from "react";
import { View, Pressable, Modal, ScrollView } from "react-native";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  toDateKey,
  type DailyShootingActivity,
  type FirearmSelection,
  type NormalizedVisit,
  type ResolvedPeriod,
  type ShootingUsageEvent,
} from "../../analytics/stats";
import { SectionHeading, TerminalText } from "../../components";
import { formatInteger, formatKnownCost } from "./format";

type Props = {
  daily: DailyShootingActivity[];
  visits: NormalizedVisit[];
  events: ShootingUsageEvent[];
  period: ResolvedPeriod;
  firearmSelection: FirearmSelection;
  currency: string;
  onOpenVisit: (visitId: string) => void;
};

export type CalendarCell = {
  date: Date;
  dateKey: string;
  inMonth: boolean;
  rounds: number;
  visitCount: number;
};

export type CalendarData = {
  weeks: CalendarCell[][];
  years: string[];
  activeMonths: string[];
};

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export const buildCalendarData = (
  daily: DailyShootingActivity[],
  visibleMonth: Date
): CalendarData => {
  const byKey = new Map(daily.map((d) => [d.dateKey, d]));

  const years = [...new Set(daily.map((d) => d.dateKey.slice(0, 4)))].sort();
  const activeMonths = [
    ...new Set(daily.map((d) => d.dateKey.slice(0, 7))),
  ].sort();

  const gridStart = startOfWeek(startOfMonth(visibleMonth), {
    weekStartsOn: 0,
  });
  const gridEnd = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const cells: CalendarCell[] = days.map((date) => {
    const dateKey = toDateKey(date);
    const entry = byKey.get(dateKey);
    return {
      date,
      dateKey,
      inMonth: isSameMonth(date, visibleMonth),
      rounds: entry?.rounds ?? 0,
      visitCount: entry?.visitCount ?? 0,
    };
  });

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return { weeks, years, activeMonths };
};

const latestActivityKey = (
  daily: DailyShootingActivity[],
  visits: NormalizedVisit[]
): string | null => {
  const keys = [
    ...daily.map((d) => d.dateKey),
    ...visits.map((v) => v.dateKey),
  ];
  if (keys.length === 0) {
    return null;
  }
  return keys.slice().sort().pop() ?? null;
};

const initialVisibleMonth = (
  period: ResolvedPeriod,
  daily: DailyShootingActivity[],
  visits: NormalizedVisit[]
): Date => {
  const now = new Date();
  const nowMonth = startOfMonth(now);
  const includesToday =
    !isAfter(period.start, now) && !isBefore(period.end, now);
  if (includesToday) {
    return nowMonth;
  }
  const latestKey = latestActivityKey(daily, visits);
  if (latestKey !== null) {
    return startOfMonth(parseISO(latestKey));
  }
  return nowMonth;
};

export const VisitCalendarSection = ({
  daily,
  visits,
  events,
  period,
  currency,
  onOpenVisit,
}: Props) => {
  const [visibleMonth, setVisibleMonth] = useState(() =>
    initialVisibleMonth(period, daily, visits)
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(
    () => new Date().getFullYear()
  );

  const calendarData = useMemo(
    () => buildCalendarData(daily, visibleMonth),
    [daily, visibleMonth]
  );

  const activeMonthsSet = useMemo(
    () => new Set(calendarData.activeMonths),
    [calendarData.activeMonths]
  );

  const yearList = useMemo(() => {
    const set = new Set<string>(calendarData.years);
    set.add(String(visibleMonth.getFullYear()));
    set.add(String(pickerYear));
    return [...set].sort();
  }, [calendarData.years, visibleMonth, pickerYear]);

  const selected = useMemo(() => {
    if (selectedDateKey === null) {
      return null;
    }
    const selectedEvents = events.filter((e) => e.dateKey === selectedDateKey);
    const selectedVisits = visits.filter((v) => v.dateKey === selectedDateKey);
    const byFirearm = new Map<string, { name: string; rounds: number }>();
    let totalRounds = 0;
    let knownCost = 0;
    let pricedRounds = 0;
    let hasPrice = false;

    for (const event of selectedEvents) {
      totalRounds += event.rounds;
      if (event.pricePerRound !== undefined) {
        hasPrice = true;
        knownCost += event.knownCost ?? 0;
        pricedRounds += event.rounds;
      }
      const current = byFirearm.get(event.firearmId);
      if (current) {
        current.rounds += event.rounds;
      } else {
        byFirearm.set(event.firearmId, {
          name: event.firearmName,
          rounds: event.rounds,
        });
      }
    }

    const priceCoverage =
      totalRounds > 0 && pricedRounds > 0
        ? (pricedRounds / totalRounds) * 100
        : null;

    return {
      selectedEvents,
      selectedVisits,
      byFirearm,
      totalRounds,
      knownCost,
      hasPrice,
      priceCoverage,
    };
  }, [selectedDateKey, events, visits]);

  const singleVisit =
    selected && selected.selectedVisits.length === 1
      ? selected.selectedVisits[0]
      : null;

  const renderCell = (cell: CalendarCell) => {
    const hasActivity = cell.rounds > 0 || cell.visitCount > 0;
    const isSelected = selectedDateKey === cell.dateKey;

    if (!hasActivity) {
      return (
        <View
          key={cell.dateKey}
          className="flex-1 min-h-[44px] items-center justify-center"
        >
          <TerminalText
            className={`${
              cell.inMonth ? "text-terminal-muted" : "text-terminal-placeholder"
            } leading-none`}
          >
            {format(cell.date, "d")}
          </TerminalText>
        </View>
      );
    }

    return (
      <Pressable
        key={cell.dateKey}
        testID={`cal-day-${cell.dateKey}`}
        accessibilityRole="button"
        accessibilityLabel={`${format(cell.date, "MMMM d, yyyy")}, ${
          cell.rounds
        } rounds`}
        onPress={() => setSelectedDateKey(cell.dateKey)}
        className={`flex-1 min-h-[44px] items-center justify-center ${
          isSelected ? "border border-terminal-green" : ""
        }`}
      >
        <TerminalText className="bg-terminal-green text-terminal-bg px-1 min-w-[24px] text-center leading-none">
          {format(cell.date, "d")}
        </TerminalText>
        {cell.visitCount > 1 ? (
          <TerminalText className="text-terminal-muted text-sm leading-none">
            {cell.visitCount}
          </TerminalText>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View className="mb-6">
      <SectionHeading title="RANGE VISITS" />

      <View className="flex-row items-center justify-between mb-2">
        <Pressable
          testID="cal-prev"
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => setVisibleMonth((m) => subMonths(m, 1))}
          className="min-h-[44px] min-w-[44px] justify-center items-center"
        >
          <TerminalText>{"<"}</TerminalText>
        </Pressable>
        <Pressable
          testID="cal-title"
          accessibilityRole="button"
          accessibilityLabel="Choose month"
          onPress={() => {
            setPickerYear(visibleMonth.getFullYear());
            setPickerVisible(true);
          }}
          className="min-h-[44px] justify-center px-4"
        >
          <TerminalText>{format(visibleMonth, "MMMM yyyy").toUpperCase()}</TerminalText>
        </Pressable>
        <Pressable
          testID="cal-next"
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => setVisibleMonth((m) => addMonths(m, 1))}
          className="min-h-[44px] min-w-[44px] justify-center items-center"
        >
          <TerminalText>{">"}</TerminalText>
        </Pressable>
      </View>

      <View className="flex-row mb-1">
        {WEEKDAYS.map((day) => (
          <View key={day} className="flex-1 items-center">
            <TerminalText className="text-terminal-muted text-sm">{day}</TerminalText>
          </View>
        ))}
      </View>

      {calendarData.weeks.map((week, weekIndex) => (
        <View key={weekIndex} className="flex-row">
          {week.map((cell) => renderCell(cell))}
        </View>
      ))}

      {selected ? (
        <View testID="cal-selected-day" className="border border-terminal-border p-3 mt-3">
          <TerminalText className="mb-1">
            {`${format(parseISO(selectedDateKey ?? ""), "dd MMM yyyy").toUpperCase()}${
              selected.selectedVisits.length > 1
                ? ` · ${selected.selectedVisits.length} VISITS`
                : ""
            }`}
          </TerminalText>

          {[...selected.byFirearm.values()].map((firearm) => (
            <TerminalText key={firearm.name} className="text-terminal-muted">
              {`${firearm.name}  ${firearm.rounds} RDS`}
            </TerminalText>
          ))}

          <TerminalText className="text-terminal-muted">
            {`${formatInteger(selected.totalRounds)} ROUNDS`}
          </TerminalText>
          <TerminalText className="text-terminal-muted">
            {formatKnownCost(
              selected.knownCost,
              currency,
              selected.hasPrice,
              selected.priceCoverage
            )}
          </TerminalText>

          {singleVisit ? (
            <Pressable
              testID={`cal-visit-${singleVisit.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Open visit ${singleVisit.location}`}
              onPress={() => onOpenVisit(singleVisit.id)}
              className="min-h-[44px] justify-center mt-2"
            >
              <TerminalText className="text-terminal-green">
                {`${singleVisit.location} ›`}
              </TerminalText>
            </Pressable>
          ) : (
            selected.selectedVisits.map((visit) => (
              <Pressable
                key={visit.id}
                testID={`cal-visit-${visit.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Open visit ${visit.location}`}
                onPress={() => onOpenVisit(visit.id)}
                className="min-h-[44px] justify-center border-t border-terminal-border/30 mt-1"
              >
                <TerminalText className="text-terminal-green">
                  {`${visit.location}  ${visit.rounds} RDS ›`}
                </TerminalText>
              </Pressable>
            ))
          )}
        </View>
      ) : null}

      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-terminal-bg border border-terminal-border rounded p-4">
            <TerminalText className="text-xl mb-2">SELECT MONTH</TerminalText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-2"
            >
              <View className="flex-row">
                {yearList.map((year) => {
                  const selectedYear = year === String(pickerYear);
                  return (
                    <Pressable
                      key={year}
                      testID={`cal-year-${year}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selectedYear }}
                      accessibilityLabel={`Year ${year}`}
                      onPress={() => setPickerYear(Number(year))}
                      className="min-h-[44px] justify-center px-3"
                    >
                      <TerminalText
                        className={
                          selectedYear
                            ? "text-terminal-green"
                            : "text-terminal-muted"
                        }
                      >
                        {year}
                      </TerminalText>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            <View className="flex-row flex-wrap">
              {MONTHS.map((month, index) => {
                const monthNumber = index + 1;
                const activeMonthKey = `${pickerYear}-${String(
                  monthNumber
                ).padStart(2, "0")}`;
                const isActive = activeMonthsSet.has(activeMonthKey);
                return (
                  <Pressable
                    key={month}
                    testID={`cal-month-${monthNumber}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${month} ${pickerYear}`}
                    onPress={() => {
                      setVisibleMonth(new Date(pickerYear, index, 1));
                      setPickerVisible(false);
                    }}
                    className="w-1/4 min-h-[44px] items-center justify-center"
                  >
                    <TerminalText
                      className={
                        isActive
                          ? "text-terminal-green"
                          : "text-terminal-muted"
                      }
                    >
                      {month}
                    </TerminalText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
