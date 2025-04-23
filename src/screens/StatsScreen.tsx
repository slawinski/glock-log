import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { FirearmStats } from "../types/firearm";
import { RangeVisitStats } from "../types/rangeVisit";
import { Terminal, TerminalText, TerminalInput } from "../components/Terminal";
import { api } from "../services/api";

export default function StatsScreen() {
  const [firearmStats, setFirearmStats] = useState<FirearmStats | null>(null);
  const [rangeVisitStats, setRangeVisitStats] =
    useState<RangeVisitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const [firearmData, rangeVisitData] = await Promise.all([
        api.getStats(),
        api.getRangeVisitStats(),
      ]);
      setFirearmStats(firearmData);
      setRangeVisitStats(rangeVisitData);
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

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <TerminalText className="text-terminal-error text-lg mb-4">
          {error}
        </TerminalText>
        <TouchableOpacity
          onPress={fetchStats}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>RETRY</TerminalText>
        </TouchableOpacity>
      </View>
    );
  }

  if (!firearmStats || !rangeVisitStats) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <TerminalText className="text-lg">NO DATA AVAILABLE</TerminalText>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-terminal-bg">
      <View className="p-4">
        <Terminal title="SYSTEM STATISTICS">
          <View className="mb-4">
            <TerminalText className="text-2xl mb-4">
              COLLECTION OVERVIEW
            </TerminalText>

            <View className="flex-row justify-between mb-2">
              <TerminalText className="text-terminal-dim">
                TOTAL FIREARMS:
              </TerminalText>
              <TerminalText>{firearmStats.totalFirearms}</TerminalText>
            </View>

            <View className="flex-row justify-between mb-2">
              <TerminalText className="text-terminal-dim">
                TOTAL VALUE:
              </TerminalText>
              <TerminalText>${firearmStats.totalValue.toFixed(2)}</TerminalText>
            </View>

            <View className="flex-row justify-between">
              <TerminalText className="text-terminal-dim">
                MOST USED CALIBER:
              </TerminalText>
              <TerminalText>{firearmStats.mostUsedCaliber}</TerminalText>
            </View>
          </View>

          <View className="mb-4">
            <TerminalText className="text-2xl mb-4">
              RANGE VISIT OVERVIEW
            </TerminalText>

            <View className="flex-row justify-between mb-2">
              <TerminalText className="text-terminal-dim">
                TOTAL VISITS:
              </TerminalText>
              <TerminalText>{rangeVisitStats.totalVisits}</TerminalText>
            </View>

            <View className="flex-row justify-between mb-2">
              <TerminalText className="text-terminal-dim">
                TOTAL ROUNDS FIRED:
              </TerminalText>
              <TerminalText>{rangeVisitStats.totalRoundsFired}</TerminalText>
            </View>

            <View className="flex-row justify-between mb-2">
              <TerminalText className="text-terminal-dim">
                MOST VISITED LOCATION:
              </TerminalText>
              <TerminalText>{rangeVisitStats.mostVisitedLocation}</TerminalText>
            </View>

            <View className="flex-row justify-between">
              <TerminalText className="text-terminal-dim">
                AVERAGE ROUNDS PER VISIT:
              </TerminalText>
              <TerminalText>
                {rangeVisitStats.averageRoundsPerVisit.toFixed(1)}
              </TerminalText>
            </View>
          </View>

          <View className="mb-4">
            <TerminalText className="text-lg mb-2">
              VALUE BREAKDOWN
            </TerminalText>
            <View className="h-40 border border-terminal-border mb-2">
              {/* TODO: Add chart visualization */}
            </View>
            <TerminalText className="text-terminal-dim text-center">
              AVERAGE VALUE PER FIREARM: $
              {(firearmStats.totalValue / firearmStats.totalFirearms).toFixed(
                2
              )}
            </TerminalText>
          </View>
        </Terminal>
      </View>
    </ScrollView>
  );
}
