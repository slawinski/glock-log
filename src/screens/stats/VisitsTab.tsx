import React from "react";
import { View, ScrollView } from "react-native";
import { TerminalText, TerminalCalendar } from "../../components";
import { RangeVisitStorage } from "../../validation/storageSchemas";

type Props = {
  rangeVisits: RangeVisitStorage[];
};

export const VisitsTab = ({ rangeVisits }: Props) => {
  const calculateVisitStats = () => {
    const visitsByMonth = rangeVisits.reduce((acc, visit) => {
      const month = new Date(visit.date).toLocaleString("default", {
        month: "long",
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const busiestMonth =
      Object.entries(visitsByMonth).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "None";

    const totalRoundsFired = rangeVisits.reduce((sum, visit) => {
      return (
        sum +
        Object.values(visit.ammunitionUsed || {}).reduce(
          (a, b) => a + b.rounds,
          0
        )
      );
    }, 0);

    const mostVisitedLocation =
      Object.entries(
        rangeVisits.reduce((acc, visit) => {
          acc[visit.location] = (acc[visit.location] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort(([, a], [, b]) => b - a)[0]?.[0] || "None";

    const averageRoundsPerVisit =
      rangeVisits.length > 0 ? totalRoundsFired / rangeVisits.length : 0;

    return {
      busiestMonth,
      totalRoundsFired,
      mostVisitedLocation,
      averageRoundsPerVisit,
    };
  };

  const visitStats = calculateVisitStats();
  const visitDates = rangeVisits.map((visit) => new Date(visit.date));

  return (
    <ScrollView className="flex-1">
      <View className="mb-4">
        <TerminalCalendar highlightedDates={visitDates} />
      </View>

      <View className="mb-4 flex-row">
        <TerminalText className="text-lg">TOTAL VISITS: </TerminalText>
        <TerminalText>{rangeVisits.length}</TerminalText>
      </View>

      <View className="mb-4 flex-row">
        <TerminalText className="text-lg">TOTAL ROUNDS FIRED: </TerminalText>
        <TerminalText>{visitStats.totalRoundsFired}</TerminalText>
      </View>

      <View className="mb-4 flex-row">
        <TerminalText className="text-lg">
          MOST VISITED LOCATION:{" "}
        </TerminalText>
        <TerminalText className=" flex-shrink">
          {visitStats.mostVisitedLocation}
        </TerminalText>
      </View>

      <View className="mb-4 flex-row">
        <TerminalText className="text-lg">
          AVERAGE ROUNDS PER VISIT:{" "}
        </TerminalText>
        <TerminalText>
          {visitStats.averageRoundsPerVisit.toFixed(1)}
        </TerminalText>
      </View>

      <View className="mb-4 flex-row">
        <TerminalText className="text-lg">BUSIEST MONTH: </TerminalText>
        <TerminalText className=" flex-shrink">
          {visitStats.busiestMonth}
        </TerminalText>
      </View>
    </ScrollView>
  );
};