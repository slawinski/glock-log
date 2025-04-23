import React, { useState, useEffect } from "react";
import {
  View,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
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

  useEffect(() => {
    fetchData();
  }, []);

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
