import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { TerminalText } from "../components/Terminal";
import { api } from "../services/api";

export default function StatsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getRangeVisitStats();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError("Failed to load statistics");
    } finally {
      setLoading(false);
    }
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
    <View className="flex-1 bg-terminal-bg p-4">
      <TerminalText className="text-2xl mb-6">STATISTICS</TerminalText>

      <View className="mb-4">
        <TerminalText className="text-lg mb-2">TOTAL VISITS</TerminalText>
        <TerminalText className="text-terminal-dim">
          {stats.totalVisits}
        </TerminalText>
      </View>

      <View className="mb-4">
        <TerminalText className="text-lg mb-2">TOTAL ROUNDS FIRED</TerminalText>
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
    </View>
  );
}
