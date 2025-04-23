import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { Firearm } from "../types/firearm";
import { RangeVisit } from "../types/rangeVisit";
import { api } from "../services/api";
import { Terminal, TerminalText, TerminalInput } from "../components/Terminal";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [rangeVisits, setRangeVisits] = useState<RangeVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<"firearms" | "visits">("firearms");

  // Fetch data when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (isInitialLoad) {
        fetchData(false); // Show spinner for initial load
      } else {
        fetchData(true); // Don't show spinner for subsequent loads
      }
    }, [isInitialLoad])
  );

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);
      console.log("Fetching data...");

      const [firearmsData, visitsData] = await Promise.all([
        api.getFirearms(),
        api.getRangeVisits(),
      ]);

      console.log("Received firearms data:", firearmsData);
      console.log("Received visits data:", visitsData);

      setFirearms(firearmsData);
      setRangeVisits(visitsData);
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error("Error in fetchData:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
    }
  };

  // Add refresh control to FlatList
  const onRefresh = () => {
    fetchData(true);
  };

  const renderFirearmItem = ({ item }: { item: Firearm }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("FirearmDetails", { id: item.id })}
      className="bg-terminal-bg border border-terminal-border p-4 mb-2"
    >
      <View className="flex-row justify-between items-center">
        <View>
          <TerminalText className="text-lg">{item.modelName}</TerminalText>
          <TerminalText className="text-terminal-dim">
            {item.caliber}
          </TerminalText>
        </View>
        <View className="items-end">
          <TerminalText className="text-terminal-dim">
            ${item.amountPaid.toFixed(2)}
          </TerminalText>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderVisitItem = ({ item }: { item: RangeVisit }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("RangeVisitDetails", { id: item.id })}
      className="bg-terminal-bg border border-terminal-border p-4 mb-2"
    >
      <View className="flex-row justify-between items-center">
        <View>
          <TerminalText className="text-lg">{item.location}</TerminalText>
          <TerminalText className="text-terminal-dim">
            {new Date(item.date).toLocaleDateString()}
          </TerminalText>
        </View>
        <View className="items-end">
          <TerminalText className="text-terminal-dim">
            {item.roundsFired} rounds
          </TerminalText>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-terminal-bg p-4">
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity
          onPress={() => navigation.navigate("Stats")}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>STATS</TerminalText>
        </TouchableOpacity>
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => setActiveTab("firearms")}
            className={`border border-terminal-border px-4 py-2 mr-2 ${
              activeTab === "firearms" ? "bg-terminal-selection" : ""
            }`}
          >
            <TerminalText>FIREARMS</TerminalText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("visits")}
            className={`border border-terminal-border px-4 py-2 ${
              activeTab === "visits" ? "bg-terminal-selection" : ""
            }`}
          >
            <TerminalText>VISITS</TerminalText>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate(
              activeTab === "firearms" ? "AddFirearm" : "AddRangeVisit"
            )
          }
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>
            ADD {activeTab === "firearms" ? "FIREARM" : "VISIT"}
          </TerminalText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#00ff00" />
          <TerminalText className="mt-4">LOADING DATABASE...</TerminalText>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center">
          <TerminalText className="text-terminal-error text-lg mb-4">
            {error}
          </TerminalText>
          <TouchableOpacity
            onPress={() => fetchData(false)}
            className="border border-terminal-border px-4 py-2"
          >
            <TerminalText>RETRY</TerminalText>
          </TouchableOpacity>
        </View>
      ) : activeTab === "firearms" ? (
        <FlatList
          data={firearms}
          renderItem={renderFirearmItem}
          keyExtractor={(item) => item.id}
          onRefresh={onRefresh}
          refreshing={false}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-8">
              <TerminalText className="text-terminal-dim">
                NO FIREARMS FOUND
              </TerminalText>
            </View>
          }
        />
      ) : (
        <FlatList
          data={rangeVisits}
          renderItem={renderVisitItem}
          keyExtractor={(item) => item.id}
          onRefresh={onRefresh}
          refreshing={false}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-8">
              <TerminalText className="text-terminal-dim">
                NO RANGE VISITS FOUND
              </TerminalText>
            </View>
          }
        />
      )}
    </View>
  );
}
