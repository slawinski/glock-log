import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, ScrollView, Dimensions } from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import { TerminalText } from "../../components/terminal-text/TerminalText";
import {
  FirearmStorage,
  RangeVisitStorage,
  AmmunitionStorage,
} from "../../validation/storageSchemas";
import { storage } from "../../services/storage-new";
import { TerminalTabs } from "../../components/terminal-tabs";
import { TerminalButton } from "../../components/terminal-button";
import { TerminalCalendar } from "../../components/terminal-calendar";
import { ChartToggles } from "../../components/chart-toggles";

type TabType = "visits" | "firearms" | "ammunition";

const TABS = [
  { id: "firearms", title: "FIREARMS" },
  { id: "visits", title: "VISITS" },
  { id: "ammunition", title: "AMMUNITION" },
];

export default function StatsScreen() {
  const [firearms, setFirearms] = useState<FirearmStorage[]>([]);
  const [ammunition, setAmmunition] = useState<AmmunitionStorage[]>([]);
  const [rangeVisits, setRangeVisits] = useState<RangeVisitStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("firearms");
  const [visibleFirearms, setVisibleFirearms] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (firearms.length > 0) {
      setVisibleFirearms(new Set(firearms.map((f) => f.id)));
    }
  }, [firearms]);

  const toggleFirearm = (firearmId: string) => {
    setVisibleFirearms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(firearmId)) {
        newSet.delete(firearmId);
      } else {
        newSet.add(firearmId);
      }
      return newSet;
    });
  };

  const toggleAllFirearms = () => {
    if (visibleFirearms.size === firearms.length) {
      setVisibleFirearms(new Set());
    } else {
      setVisibleFirearms(new Set(firearms.map((f) => f.id)));
    }
  };

  const isAllSelected = visibleFirearms.size === firearms.length;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [firearmsData, ammunitionData, visitsData] = await Promise.all([
        storage.getFirearms(),
        storage.getAmmunition(),
        storage.getRangeVisits(),
      ]);
      setFirearms(firearmsData);
      setAmmunition(ammunitionData);
      setRangeVisits(visitsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

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

  const renderVisitsTab = () => {
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

  const renderFirearmsTab = () => {
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
                onToggleItem={toggleFirearm}
                onToggleAll={toggleAllFirearms}
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

  const renderAmmunitionTab = () => {
    const ammoStats = calculateAmmunitionStats();
    const usageData = calculateAmmunitionUsageOverTime();

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

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <ActivityIndicator size="large" color="#00ff00" />
        <TerminalText className="mt-4">LOADING DATABASE...</TerminalText>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <TerminalText className="text-terminal-error text-lg mb-4">
          {error}
        </TerminalText>
        <TerminalButton onPress={fetchData} caption="RETRY" />
      </View>
    );
  }

  return (
    <View className="flex-1 p-4 bg-terminal-bg">
      <TerminalTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabPress={(tabId) => setActiveTab(tabId as TabType)}
      />
      {activeTab === "visits" && renderVisitsTab()}
      {activeTab === "firearms" && renderFirearmsTab()}
      {activeTab === "ammunition" && renderAmmunitionTab()}
    </View>
  );
}
