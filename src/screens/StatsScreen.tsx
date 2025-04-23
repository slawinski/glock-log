import React from "react";
import { View, Text, ScrollView } from "react-native";
import { FirearmStats } from "../types/firearm";

// Temporary mock data - will be replaced with actual data from the database
const mockStats: FirearmStats = {
  totalFirearms: 5,
  totalValue: 2999.95,
  totalRounds: 2500,
  mostUsedCaliber: "9mm",
};

export default function StatsScreen() {
  const stats = mockStats; // TODO: Fetch actual stats from the database

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-4">
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-2xl font-bold mb-4">Collection Overview</Text>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Total Firearms:</Text>
            <Text className="font-semibold">{stats.totalFirearms}</Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Total Value:</Text>
            <Text className="font-semibold">
              ${stats.totalValue.toFixed(2)}
            </Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Total Rounds:</Text>
            <Text className="font-semibold">{stats.totalRounds}</Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-gray-600">Most Used Caliber:</Text>
            <Text className="font-semibold">{stats.mostUsedCaliber}</Text>
          </View>
        </View>

        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-semibold mb-2">Value Breakdown</Text>
          <View className="h-40 bg-gray-200 rounded-lg mb-2">
            {/* TODO: Add chart visualization */}
          </View>
          <Text className="text-gray-500 text-center">
            Average value per firearm: $
            {(stats.totalValue / stats.totalFirearms).toFixed(2)}
          </Text>
        </View>

        <View className="bg-white rounded-lg p-4">
          <Text className="text-lg font-semibold mb-2">
            Ammunition Overview
          </Text>
          <View className="h-40 bg-gray-200 rounded-lg mb-2">
            {/* TODO: Add chart visualization */}
          </View>
          <Text className="text-gray-500 text-center">
            Average rounds per firearm:{" "}
            {Math.round(stats.totalRounds / stats.totalFirearms)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
