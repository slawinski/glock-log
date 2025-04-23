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
import { Ammunition } from "../types/ammunition";
import { api } from "../services/api";
import { Terminal, TerminalText, TerminalInput } from "../components/Terminal";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

type TabType = "firearms" | "visits" | "ammunition";

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [rangeVisits, setRangeVisits] = useState<RangeVisit[]>([]);
  const [ammunition, setAmmunition] = useState<Ammunition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("firearms");

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

      const [firearmsData, visitsData, ammunitionData] = await Promise.all([
        api.getFirearms(),
        api.getRangeVisits(),
        api.getAmmunition(),
      ]);

      console.log("Received firearms data:", firearmsData);
      console.log("Received visits data:", visitsData);
      console.log("Received ammunition data:", ammunitionData);

      setFirearms(firearmsData);
      setRangeVisits(visitsData);
      setAmmunition(ammunitionData);
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
            {item.roundsFired} rounds
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

  const renderAmmunitionItem = ({ item }: { item: Ammunition }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("AmmunitionDetails", { id: item.id })}
      className="bg-terminal-bg border border-terminal-border p-4 mb-2"
    >
      <View className="flex-row justify-between items-center">
        <View>
          <TerminalText className="text-lg">{item.brand}</TerminalText>
          <TerminalText className="text-terminal-dim">
            {item.caliber} - {item.grain}gr
          </TerminalText>
        </View>
        <View className="items-end">
          <TerminalText className="text-terminal-dim">
            {item.quantity} rounds
          </TerminalText>
          <TerminalText className="text-terminal-dim">
            ${item.amountPaid.toFixed(2)}
          </TerminalText>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getAddScreen = () => {
    switch (activeTab) {
      case "firearms":
        return "AddFirearm";
      case "visits":
        return "AddRangeVisit";
      case "ammunition":
        return "AddAmmunition";
      default:
        return "AddFirearm";
    }
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

  const renderContent = () => {
    if (loading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#00ff00" />
          <TerminalText className="mt-4">LOADING DATABASE...</TerminalText>
        </View>
      );
    }

    if (error) {
      return (
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
      );
    }

    switch (activeTab) {
      case "firearms":
        return (
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
        );
      case "visits":
        return (
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
        );
      case "ammunition":
        return (
          <FlatList
            data={ammunition}
            renderItem={renderAmmunitionItem}
            keyExtractor={(item) => item.id}
            onRefresh={onRefresh}
            refreshing={false}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center mt-8">
                <TerminalText className="text-terminal-dim">
                  NO AMMUNITION FOUND
                </TerminalText>
              </View>
            }
          />
        );
    }
  };

  return (
    <View className="flex-1 bg-terminal-bg">
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity
          onPress={() => navigation.navigate("Stats")}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>STATS</TerminalText>
        </TouchableOpacity>
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => navigation.navigate(getAddScreen())}
            className="border border-terminal-border px-4 py-2"
          >
            <TerminalText className="text-2xl">+</TerminalText>
          </TouchableOpacity>
        </View>
      </View>
      {renderTabBar()}
      <View className="flex-1 p-4">{renderContent()}</View>
    </View>
  );
}
