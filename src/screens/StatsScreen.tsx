import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { FirearmStats } from "../types/firearm";
import { Terminal, TerminalText, TerminalInput } from "../components/Terminal";
import { api } from "../services/api";

export default function StatsScreen() {
  const [stats, setStats] = useState<FirearmStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getStats();
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

  if (!stats) {
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
              <TerminalText>{stats.totalFirearms}</TerminalText>
            </View>

            <View className="flex-row justify-between mb-2">
              <TerminalText className="text-terminal-dim">
                TOTAL VALUE:
              </TerminalText>
              <TerminalText>${stats.totalValue.toFixed(2)}</TerminalText>
            </View>

            <View className="flex-row justify-between">
              <TerminalText className="text-terminal-dim">
                MOST USED CALIBER:
              </TerminalText>
              <TerminalText>{stats.mostUsedCaliber}</TerminalText>
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
              {(stats.totalValue / stats.totalFirearms).toFixed(2)}
            </TerminalText>
          </View>
        </Terminal>
      </View>
    </ScrollView>
  );
}
