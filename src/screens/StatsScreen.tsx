import React, { useState, useEffect } from "react";
import {
  View,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { TerminalText } from "../components/Terminal";
import { api } from "../services/api";
import { Firearm } from "../types/firearm";
import { Ammunition } from "../types/ammunition";
import { RangeVisit } from "../types/rangeVisit";

type TabType = "visits" | "firearms" | "ammunition";

export default function StatsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [ammunition, setAmmunition] = useState<Ammunition[]>([]);
  const [rangeVisits, setRangeVisits] = useState<RangeVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("visits");
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, firearmsData, ammunitionData, visitsData] =
        await Promise.all([
          api.getRangeVisitStats(),
          api.getFirearms(),
          api.getAmmunition(),
          api.getRangeVisits(),
        ]);
      setStats(statsData);
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

  const selectFirearm = (firearmId: string | null) => {
    if (firearmId === null) {
      // Show all firearms
      setVisibleFirearms(new Set(firearms.map((f) => f.id)));
    } else {
      // Show only the selected firearm
      setVisibleFirearms(new Set([firearmId]));
    }
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
        const roundsInVisit = visit.roundsPerFirearm[firearm.id] || 0;
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
      Object.entries(caliberCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "None";

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
      Object.entries(visitsByMonth).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "None";

    return {
      busiestMonth,
    };
  };

  const renderTabBar = () => (
    <View className="flex-row justify-around mb-4 bg-terminal-bg border-b border-terminal-border">
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
            {stats.totalVisits}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">
            TOTAL ROUNDS FIRED
          </TerminalText>
          <TerminalText className="text-terminal-dim">
            {stats.totalRoundsFired}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">
            AVERAGE ROUNDS PER VISIT
          </TerminalText>
          <TerminalText className="text-terminal-dim">
            {Math.round(stats.averageRoundsPerVisit)}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">
            MOST VISITED LOCATION
          </TerminalText>
          <TerminalText className="text-terminal-dim">
            {stats.mostVisitedLocation || "No visits recorded"}
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
    const roundsTimeline = calculateFirearmRoundsTimeline();
    const isAllSelected = visibleFirearms.size === firearms.length;

    return (
      <ScrollView className="flex-1">
        <View className="mb-4">
          <TerminalText className="text-lg mb-2">TOTAL FIREARMS</TerminalText>
          <TerminalText className="text-terminal-dim">
            {firearms.length}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">
            TOTAL COLLECTION VALUE
          </TerminalText>
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
            {firearmStats.mostUsedFirearm
              ? `${firearmStats.mostUsedFirearm.modelName} (${firearmStats.mostUsedFirearm.roundsFired} rounds)`
              : "None"}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">
            ROUNDS FIRED OVER TIME
          </TerminalText>

          <View className="flex-row flex-wrap gap-2 mb-4">
            <TouchableOpacity
              onPress={() => selectFirearm(null)}
              className={`px-3 py-1 border ${
                isAllSelected
                  ? "border-terminal-text bg-terminal-text/10"
                  : "border-terminal-border"
              }`}
            >
              <TerminalText>ALL</TerminalText>
            </TouchableOpacity>
            {firearms.map((firearm) => (
              <TouchableOpacity
                key={firearm.id}
                onPress={() => selectFirearm(firearm.id)}
                className={`px-3 py-1 border ${
                  visibleFirearms.has(firearm.id) && !isAllSelected
                    ? "border-terminal-text bg-terminal-text/10"
                    : "border-terminal-border"
                }`}
              >
                <TerminalText>{firearm.modelName}</TerminalText>
              </TouchableOpacity>
            ))}
          </View>

          <LineChart
            data={roundsTimeline}
            width={Dimensions.get("window").width}
            height={220}
            chartConfig={{
              backgroundColor: "#1a1a1a",
              backgroundGradientFrom: "#1a1a1a",
              backgroundGradientTo: "#1a1a1a",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`,
              style: {
                borderRadius: 0,
              },
              propsForLabels: {
                fontSize: 10,
                fill: "#00ff00",
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: 0,
              backgroundColor: "#1a1a1a",
              padding: 8,
            }}
            withDots={true}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            segments={4}
          />
        </View>
      </ScrollView>
    );
  };

  const renderAmmunitionTab = () => {
    const ammunitionStats = calculateAmmunitionStats();
    return (
      <ScrollView className="flex-1">
        <View className="mb-4">
          <TerminalText className="text-lg mb-2">
            TOTAL ROUNDS IN STOCK
          </TerminalText>
          <TerminalText className="text-terminal-dim">
            {ammunitionStats.totalRounds}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">
            TOTAL SPENT ON AMMUNITION
          </TerminalText>
          <TerminalText className="text-terminal-dim">
            ${ammunitionStats.totalSpent.toFixed(2)}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">
            AVERAGE COST PER ROUND
          </TerminalText>
          <TerminalText className="text-terminal-dim">
            ${ammunitionStats.costPerRound.toFixed(2)}
          </TerminalText>
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">
            MOST STOCKED CALIBER
          </TerminalText>
          <TerminalText className="text-terminal-dim">
            {ammunitionStats.mostStockedCaliber}
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

  if (error || !stats) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <TerminalText className="text-terminal-error text-lg">
          {error || "Failed to load statistics"}
        </TerminalText>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-terminal-bg">
      {renderTabBar()}
      <View className="flex-1 p-4">
        {activeTab === "visits" && renderVisitsTab()}
        {activeTab === "firearms" && renderFirearmsTab()}
        {activeTab === "ammunition" && renderAmmunitionTab()}
      </View>
    </View>
  );
}
