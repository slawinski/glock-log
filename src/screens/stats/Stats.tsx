import React, { useState, useEffect } from "react";
import {
  View,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { TerminalText } from "../../components/terminal-text/TerminalText";
import {
  FirearmStorage,
  RangeVisitStorage,
  AmmunitionStorage,
} from "../../validation/storageSchemas";
import { storage } from "../../services/storage";

type TabType = "visits" | "firearms" | "ammunition";

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
    // Initialize visible firearms with all firearms when data is loaded
    if (firearms.length > 0) {
      setVisibleFirearms(new Set(firearms.map((f) => f.id)));
    }
  }, [firearms]);

  const toggleFirearm = (firearmId: string) => {
    setVisibleFirearms((prev) => {
      const newSet = new Set(prev);
      // If trying to deselect the last visible firearm, select all instead
      if (newSet.has(firearmId) && newSet.size === 1) {
        return new Set(firearms.map((f) => f.id));
      }
      if (newSet.has(firearmId)) {
        newSet.delete(firearmId);
      } else {
        newSet.add(firearmId);
      }
      return newSet;
    });
  };

  const toggleAllFirearms = () => {
    // If all firearms are selected, deselect all
    if (visibleFirearms.size === firearms.length) {
      setVisibleFirearms(new Set());
    } else {
      // Otherwise, select all firearms
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
      Object.entries(caliberCounts).sort(
        ([, a], [, b]) => (b as number) - (a as number)
      )[0]?.[0] || "None";
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
    // Sort visits by date
    const sortedVisits = [...rangeVisits].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Create a map to track running totals for each firearm
    const runningTotals = new Map<string, number[]>();
    const labels: string[] = [];

    // Initialize running totals for each firearm
    firearms.forEach((firearm) => {
      runningTotals.set(firearm.id, []);
    });

    // Process each visit
    sortedVisits.forEach((visit) => {
      const date = new Date(visit.date);
      const month = date.getMonth() + 1; // getMonth() returns 0-11
      const day = date.getDate();
      const monthYear = `${month}/${day}`;
      labels.push(monthYear);

      // Update running totals for each firearm
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

    // Define line styles and colors
    const lineStyles = [
      { style: "solid", color: "#00ff00", label: "━━━" }, // Bright green
      { style: "dashed", color: "#00cc00", label: "╍╍╍" }, // Medium green
      { style: "dotted", color: "#009900", label: "┄┄┄" }, // Dark green
      { style: "solid", color: "#00ff66", label: "━━━" }, // Light green
      { style: "dashed", color: "#00ff33", label: "╍╍╍" }, // Bright green with dash
      { style: "dotted", color: "#00cc66", label: "┄┄┄" }, // Medium green with dots
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
    const costPerRound = totalSpent / totalRounds;
    const caliberCounts = ammunition.reduce((acc, ammo) => {
      acc[ammo.caliber] = (acc[ammo.caliber] || 0) + ammo.quantity;
      return acc;
    }, {} as Record<string, number>);
    const mostStockedCaliber =
      Object.entries(caliberCounts).sort(
        ([, a], [, b]) => (b as number) - (a as number)
      )[0]?.[0] || "None";

    return {
      totalRounds,
      totalSpent,
      costPerRound,
      mostStockedCaliber,
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
      Object.entries(visitsByMonth).sort(
        ([, a], [, b]) => (b as number) - (a as number)
      )[0]?.[0] || "None";

    const totalRoundsFired = rangeVisits.reduce((sum, visit) => {
      return (
        sum +
        Object.values(visit.ammunitionUsed || {}).reduce(
          (a, b) => a + b.rounds,
          0
        )
      );
    }, 0);

    const locationCounts = rangeVisits.reduce((acc, visit) => {
      if (visit.location) {
        acc[visit.location] = (acc[visit.location] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const mostVisitedLocation =
      Object.entries(locationCounts).sort(
        ([, a], [, b]) => (b as number) - (a as number)
      )[0]?.[0] || "None";

    return {
      totalVisits: rangeVisits.length,
      totalRoundsFired,
      mostVisitedLocation,
      averageRoundsPerVisit:
        rangeVisits.length > 0 ? totalRoundsFired / rangeVisits.length : 0,
      busiestMonth,
    };
  };

  const renderTabBar = () => (
    <View className="flex-row justify-around mb-4 bg-terminal-bg border-b border-terminal-border">
      <TouchableOpacity
        onPress={() => setActiveTab("firearms")}
        className={`flex-1 items-center py-3 ${
          activeTab === "firearms" ? "border-b-2 border-terminal-text" : ""
        }`}
      >
        <TerminalText
          className={`${
            activeTab === "firearms"
              ? "text-terminal-text"
              : "text-terminal-border"
          }`}
        >
          FIREARMS
        </TerminalText>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setActiveTab("visits")}
        className={`flex-1 items-center py-3 ${
          activeTab === "visits" ? "border-b-2 border-terminal-text" : ""
        }`}
      >
        <TerminalText
          className={`${
            activeTab === "visits"
              ? "text-terminal-text"
              : "text-terminal-border"
          }`}
        >
          VISITS
        </TerminalText>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setActiveTab("ammunition")}
        className={`flex-1 items-center py-3 ${
          activeTab === "ammunition" ? "border-b-2 border-terminal-text" : ""
        }`}
      >
        <TerminalText
          className={`${
            activeTab === "ammunition"
              ? "text-terminal-text"
              : "text-terminal-border"
          }`}
        >
          AMMUNITION
        </TerminalText>
      </TouchableOpacity>
    </View>
  );

  const renderVisitsTab = () => {
    const visitStats = calculateVisitStats();
    return (
      <ScrollView className="flex-1">
        <View className="mb-4">
          <TerminalText className="text-lg mb-2">TOTAL VISITS</TerminalText>
          <TerminalText className="text-terminal-dim">
            {visitStats.totalVisits}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">
            TOTAL ROUNDS FIRED
          </TerminalText>
          <TerminalText className="text-terminal-dim">
            {visitStats.totalRoundsFired}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">
            MOST VISITED LOCATION
          </TerminalText>
          <TerminalText className="text-terminal-dim">
            {visitStats.mostVisitedLocation}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">
            AVERAGE ROUNDS PER VISIT
          </TerminalText>
          <TerminalText className="text-terminal-dim">
            {visitStats.averageRoundsPerVisit.toFixed(1)}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">BUSIEST MONTH</TerminalText>
          <TerminalText className="text-terminal-dim">
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
        <View className="mb-4">
          <TerminalText className="text-lg mb-2">TOTAL FIREARMS</TerminalText>
          <TerminalText className="text-terminal-dim">
            {firearms.length}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">TOTAL VALUE</TerminalText>
          <TerminalText className="text-terminal-dim">
            ${firearmStats.totalValue.toFixed(2)}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">
            MOST COMMON CALIBER
          </TerminalText>
          <TerminalText className="text-terminal-dim">
            {firearmStats.mostCommonCaliber}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">
            MOST USED FIREARM
          </TerminalText>
          <TerminalText className="text-terminal-dim">
            {firearmStats.mostUsedFirearm?.modelName} (
            {firearmStats.mostUsedFirearm?.roundsFired} rounds)
          </TerminalText>
        </View>

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
                legend: timelineData.legend,
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
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
            <View className="mt-2">
              <TouchableOpacity onPress={toggleAllFirearms} className="mb-2">
                <TerminalText className="text-terminal-dim">
                  {isAllSelected ? "[✓] ALL" : "[ ] ALL"}
                </TerminalText>
              </TouchableOpacity>
              {firearms.map((firearm) => (
                <TouchableOpacity
                  key={firearm.id}
                  onPress={() => toggleFirearm(firearm.id)}
                  className="mb-1"
                >
                  <TerminalText className="text-terminal-dim">
                    {visibleFirearms.has(firearm.id) ? "[✓] " : "[ ] "}
                    {firearm.modelName}
                  </TerminalText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderAmmunitionTab = () => {
    const ammoStats = calculateAmmunitionStats();
    return (
      <ScrollView className="flex-1">
        <View className="mb-4">
          <TerminalText className="text-lg mb-2">TOTAL ROUNDS</TerminalText>
          <TerminalText className="text-terminal-dim">
            {ammoStats.totalRounds}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">TOTAL SPENT</TerminalText>
          <TerminalText className="text-terminal-dim">
            ${ammoStats.totalSpent.toFixed(2)}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">COST PER ROUND</TerminalText>
          <TerminalText className="text-terminal-dim">
            ${ammoStats.costPerRound.toFixed(2)}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">
            MOST STOCKED CALIBER
          </TerminalText>
          <TerminalText className="text-terminal-dim">
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
        <TouchableOpacity
          onPress={fetchData}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>RETRY</TerminalText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-terminal-bg p-4">
      {renderTabBar()}
      {activeTab === "visits" && renderVisitsTab()}
      {activeTab === "firearms" && renderFirearmsTab()}
      {activeTab === "ammunition" && renderAmmunitionTab()}
    </View>
  );
}
