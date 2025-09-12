import React from "react";
import { View, ScrollView, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { TerminalText, ChartToggles } from "../../components";
import { FirearmStorage, RangeVisitStorage } from "../../validation/storageSchemas";

type Props = {
  firearms: FirearmStorage[];
  rangeVisits: RangeVisitStorage[];
  visibleFirearms: Set<string>;
  onToggleFirearm: (firearmId: string) => void;
  onToggleAllFirearms: () => void;
  isAllSelected: boolean;
};

export const FirearmsTab: React.FC<Props> = ({
  firearms,
  rangeVisits,
  visibleFirearms,
  onToggleFirearm,
  onToggleAllFirearms,
  isAllSelected,
}) => {
  const calculateFirearmStats = () => {
    const totalValue = firearms.reduce(
      (sum, firearm) => sum + firearm.amountPaid,
      0
    );
    const caliberCounts = firearms.reduce((acc, firearm) => {
      acc[firearm.caliber] = (acc[firearm.caliber] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostCommonCaliber =
      Object.entries(caliberCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "None";
    const mostUsedFirearm = firearms.sort(
      (a, b) => b.roundsFired - a.roundsFired
    )[0];

    return {
      totalValue,
      mostCommonCaliber,
      mostUsedFirearm,
    };
  };

  const calculateFirearmRoundsTimeline = () => {
    const sortedVisits = [...rangeVisits].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const runningTotals = new Map<string, number[]>();
    const labels: string[] = [];

    firearms.forEach((firearm) => {
      runningTotals.set(firearm.id, []);
    });

    sortedVisits.forEach((visit) => {
      const date = new Date(visit.date);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const monthYear = `${month}/${day}`;
      labels.push(monthYear);

      firearms.forEach((firearm) => {
        const currentTotals = runningTotals.get(firearm.id) || [];
        const lastTotal = currentTotals[currentTotals.length - 1] || 0;
        const roundsInVisit = visit.ammunitionUsed?.[firearm.id]?.rounds || 0;
        runningTotals.set(firearm.id, [
          ...currentTotals,
          lastTotal + roundsInVisit,
        ]);
      });
    });

    const lineStyles = [
      { style: "solid", color: "#00ff00", label: "━━━" },
      { style: "dashed", color: "#00cc00", label: "╍╍╍" },
      { style: "dotted", color: "#009900", label: "┄┄┄" },
      { style: "solid", color: "#00ff66", label: "━━━" },
      { style: "dashed", color: "#00ff33", label: "╍╍╍" },
      { style: "dotted", color: "#00cc66", label: "┄┄┄" },
    ];

    return {
      labels,
      datasets: firearms
        .filter((firearm) => visibleFirearms.has(firearm.id))
        .map((firearm, index) => {
          const style = lineStyles[index % lineStyles.length];
          return {
            data: runningTotals.get(firearm.id) || [],
            color: () => style.color,
            strokeWidth: 2,
            strokeDashArray:
              style.style === "dashed"
                ? [5, 5]
                : style.style === "dotted"
                ? [2, 2]
                : undefined,
          };
        }),
      legend: firearms
        .filter((firearm) => visibleFirearms.has(firearm.id))
        .map((f, index) => {
          const style = lineStyles[index % lineStyles.length];
          return `${style.label} ${f.modelName}`;
        }),
    };
  };

  const firearmStats = calculateFirearmStats();
  const timelineData = calculateFirearmRoundsTimeline();

  return (
    <ScrollView className="flex-1">
      {timelineData.labels.length > 0 && (
        <View className="mb-4">
          <TerminalText className="text-lg mb-2">
            ROUNDS FIRED TIMELINE
          </TerminalText>
          <LineChart
            data={{
              labels: timelineData.labels,
              datasets:
                timelineData.datasets.length > 0
                  ? timelineData.datasets
                  : [
                      {
                        data: new Array(timelineData.labels.length).fill(0),
                        color: () => "rgba(0, 255, 0, 0)",
                        strokeWidth: 0,
                      },
                    ],
            }}
            width={Dimensions.get("window").width - 32}
            height={220}
            chartConfig={{
              backgroundColor: "#0a0a0a",
              backgroundGradientFrom: "#0a0a0a",
              backgroundGradientTo: "#0a0a0a",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "3",
                strokeWidth: "2",
                stroke: "#00ff00",
              },
              propsForLabels: {
                fontFamily: "VT323_400Regular",
                fontSize: 16,
              },
              propsForBackgroundLines: {
                strokeDasharray: "",
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
          <View className="mt-2">
            <ChartToggles
              items={firearms.map((f) => ({
                id: f.id,
                title: f.modelName,
              }))}
              visibleItems={visibleFirearms}
              onToggleItem={onToggleFirearm}
              onToggleAll={onToggleAllFirearms}
              isAllSelected={isAllSelected}
            />
          </View>
        </View>
      )}

      <View className="mb-4 flex-row">
        <TerminalText className="text-lg">TOTAL FIREARMS: </TerminalText>
        <TerminalText>{firearms.length}</TerminalText>
      </View>

      <View className="mb-4 flex-row">
        <TerminalText className="text-lg">TOTAL VALUE: </TerminalText>
        <TerminalText>${firearmStats.totalValue.toFixed(2)}</TerminalText>
      </View>

      <View className="mb-4 flex-row">
        <TerminalText className="text-lg">MOST COMMON CALIBER: </TerminalText>
        <TerminalText className=" flex-shrink">
          {firearmStats.mostCommonCaliber}
        </TerminalText>
      </View>

      <View className="mb-4 flex-row">
        <TerminalText className="text-lg">MOST USED FIREARM: </TerminalText>
        <TerminalText className=" flex-shrink">
          {firearmStats.mostUsedFirearm?.modelName} (
          {firearmStats.mostUsedFirearm?.roundsFired} rounds)
        </TerminalText>
      </View>
    </ScrollView>
  );
};