import React from "react";
import { View, ScrollView, Dimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { TerminalText } from "../../components";
import { AmmunitionStorage, RangeVisitStorage } from "../../validation/storageSchemas";

type Props = {
  ammunition: AmmunitionStorage[];
  rangeVisits: RangeVisitStorage[];
};

export const AmmunitionTab = ({ ammunition, rangeVisits }: Props) => {
  const calculateAmmunitionStats = () => {
    const totalRounds = ammunition.reduce(
      (sum, ammo) => sum + ammo.quantity,
      0
    );
    const totalSpent = ammunition.reduce(
      (sum, ammo) => sum + ammo.amountPaid,
      0
    );
    const costPerRound = totalRounds > 0 ? totalSpent / totalRounds : 0;
    const caliberCounts = ammunition.reduce((acc, ammo) => {
      acc[ammo.caliber] = (acc[ammo.caliber] || 0) + ammo.quantity;
      return acc;
    }, {} as Record<string, number>);
    const mostStockedCaliber =
      Object.entries(caliberCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "None";

    return {
      totalRounds,
      totalSpent,
      costPerRound,
      mostStockedCaliber,
    };
  };

  const calculateAmmunitionUsageOverTime = () => {
    // Group visits by month
    const usageByMonth = rangeVisits.reduce((acc, visit) => {
      const date = new Date(visit.date);
      const monthYear = `${date.getMonth() + 1}/${date
        .getFullYear()
        .toString()
        .slice(-2)}`;

      const totalRoundsInVisit = Object.values(
        visit.ammunitionUsed || {}
      ).reduce((sum, ammo) => sum + ammo.rounds, 0);

      acc[monthYear] = (acc[monthYear] || 0) + totalRoundsInVisit;
      return acc;
    }, {} as Record<string, number>);

    // Sort by date and get last 12 months or all data if less
    const sortedEntries = Object.entries(usageByMonth).sort((a, b) => {
      const [monthA, yearA] = a[0].split("/");
      const [monthB, yearB] = b[0].split("/");
      const dateA = new Date(2000 + parseInt(yearA), parseInt(monthA) - 1);
      const dateB = new Date(2000 + parseInt(yearB), parseInt(monthB) - 1);
      return dateA.getTime() - dateB.getTime();
    });

    const recentEntries = sortedEntries.slice(-12); // Last 12 months

    return {
      labels: recentEntries.map(([month]) => month),
      data: recentEntries.map(([, rounds]) => rounds),
    };
  };

  const ammoStats = calculateAmmunitionStats();
  const usageData = calculateAmmunitionUsageOverTime();

  if (ammunition.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <TerminalText>NO AMMUNITION DATA</TerminalText>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1">
      {usageData.labels.length > 0 && (
        <View className="mb-4">
          <TerminalText className="text-lg mb-2">
            AMMUNITION USAGE OVER TIME
          </TerminalText>
          <BarChart
            data={{
              labels: usageData.labels,
              datasets: [
                {
                  data: usageData.data.length > 0 ? usageData.data : [0],
                },
              ],
            }}
            width={Dimensions.get("window").width - 32}
            height={220}
            yAxisLabel=""
            yAxisSuffix=" rds"
            fromZero={true}
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
              barPercentage: 0.7,
              propsForLabels: {
                fontFamily: "VT323_400Regular",
                fontSize: 16,
              },
              propsForBackgroundLines: {
                strokeDasharray: "",
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>
      )}

      <View className="mb-4 flex-row">
        <TerminalText className="text-lg">TOTAL ROUNDS: </TerminalText>
        <TerminalText>{ammoStats.totalRounds}</TerminalText>
      </View>

      <View className="mb-4 flex-row">
        <TerminalText className="text-lg">TOTAL SPENT: </TerminalText>
        <TerminalText>${ammoStats.totalSpent.toFixed(2)}</TerminalText>
      </View>

      <View className="mb-4 flex-row">
        <TerminalText className="text-lg">COST PER ROUND: </TerminalText>
        <TerminalText>${ammoStats.costPerRound.toFixed(2)}</TerminalText>
      </View>

      <View className="mb-4 flex-row">
        <TerminalText className="text-lg">
          MOST STOCKED CALIBER:{" "}
        </TerminalText>
        <TerminalText className=" flex-shrink">
          {ammoStats.mostStockedCaliber}
        </TerminalText>
      </View>
    </ScrollView>
  );
};