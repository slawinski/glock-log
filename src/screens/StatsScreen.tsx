import React from "react";
import { View, Text, ScrollView } from "react-native";
import { FirearmStats } from "../types/firearm";
import { Terminal, TerminalText, TerminalInput } from "../components/Terminal";

// Temporary mock data - will be replaced with actual data from the database
const mockStats: FirearmStats = {
  totalFirearms: 5,
  totalValue: 2999.95,
  mostUsedCaliber: "9mm",
};

export default function StatsScreen() {
  const stats = mockStats; // TODO: Fetch actual stats from the database

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
