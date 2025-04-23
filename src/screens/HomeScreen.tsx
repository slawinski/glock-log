import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { Firearm } from "../types/firearm";
import { api } from "../services/api";
import { Terminal, TerminalText, TerminalInput } from "../components/Terminal";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  // Fetch firearms when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (initialLoad) {
        setInitialLoad(false);
        fetchFirearms();
      }
    }, [initialLoad])
  );

  const fetchFirearms = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching firearms...");

      const data = await api.getFirearms();
      console.log("Received firearms data:", data);

      if (data.length === 0) {
        setFirearms([]);
      } else {
        setFirearms(data);
      }
    } catch (error) {
      console.error("Error in fetchFirearms:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load firearms"
      );
    } finally {
      setLoading(false);
    }
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

  return (
    <View className="flex-1 bg-terminal-bg p-4">
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity
          onPress={() => navigation.navigate("Stats")}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>STATS</TerminalText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("AddFirearm")}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>ADD FIREARM</TerminalText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#00ff00" size="large" />
          <TerminalText className="mt-4">LOADING DATABASE...</TerminalText>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-4">
          <TerminalText className="text-terminal-error text-center mb-4">
            {error}
          </TerminalText>
          <TouchableOpacity
            onPress={fetchFirearms}
            className="border border-terminal-border px-4 py-2"
          >
            <TerminalText>RETRY</TerminalText>
          </TouchableOpacity>
        </View>
      ) : firearms.length === 0 ? (
        <View className="flex-1 justify-center items-center p-4">
          <TerminalText className="text-center text-lg mb-2">
            NO FIREARMS DETECTED
          </TerminalText>
          <TerminalText className="text-terminal-dim text-center mb-6">
            INITIALIZE DATABASE WITH NEW ENTRY
          </TerminalText>
          <TouchableOpacity
            onPress={() => navigation.navigate("AddFirearm")}
            className="border border-terminal-border px-6 py-3"
          >
            <TerminalText>ADD FIREARM</TerminalText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={firearms}
          renderItem={renderFirearmItem}
          keyExtractor={(item) => item.id}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
