import React, { useCallback, useState, useLayoutEffect } from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import {
  FirearmStorage,
  RangeVisitStorage,
  AmmunitionStorage,
} from "../../validation/storageSchemas";
import { storage } from "../../services/storage-new";
import {
  TerminalText,
  HeaderButton,
  TerminalTabs,
  FirearmImage,
} from "../../components";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

type TabType = "firearms" | "visits" | "ammunition";

const TABS = [
  { id: "firearms", title: "FIREARMS" },
  { id: "visits", title: "VISITS" },
  { id: "ammunition", title: "AMMUNITION" },
];

export const Home = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [firearms, setFirearms] = useState<FirearmStorage[]>([]);
  const [rangeVisits, setRangeVisits] = useState<RangeVisitStorage[]>([]);
  const [ammunition, setAmmunition] = useState<AmmunitionStorage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("firearms");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderButton
          onPress={() => navigation.navigate("Stats")}
          caption="STATS"
          className="text-2xl"
        />
      ),
      headerRight: () => (
        <HeaderButton
          onPress={() => navigation.navigate(getAddScreen())}
          caption="+"
          className="text-3xl"
        />
      ),
      title: "TRIGGERNOTE",
    });
  }, [navigation, activeTab]);

  useFocusEffect(
    useCallback(() => {
      if (isInitialLoad) {
        fetchData(false);
      } else {
        fetchData(true);
      }
    }, [isInitialLoad])
  );

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      const [firearmsData, visitsData, ammunitionData] = await Promise.all([
        storage.getFirearms(),
        storage.getRangeVisits(),
        storage.getAmmunition(),
      ]);

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

  const onRefresh = () => {
    fetchData(true);
  };

  const renderFirearmItem = ({ item }: { item: FirearmStorage }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("FirearmDetails", { id: item.id })}
      className="bg-terminal-bg border border-terminal-border p-4 mb-4"
    >
      <View className="flex-row items-start">
        <FirearmImage photoUri={item.photos?.[0]} size={60} className="mr-4" />
        <View className="flex-1 flex-row flex-wrap">
          <View className="w-1/2 pr-2">
            <TerminalText className="text-lg" numberOfLines={1}>
              {item.modelName} ({item.caliber})
            </TerminalText>
          </View>
          <View className="w-1/2 items-end">
            <TerminalText>{item.roundsFired} rounds</TerminalText>
          </View>
          <View className="w-1/2 pr-2 mt-1">
            <TerminalText>
              Added: {new Date(item.createdAt).toLocaleDateString()}
            </TerminalText>
          </View>
          <View className="w-1/2 items-end justify-end">
            <TerminalText className="text-lg">{">"}</TerminalText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderVisitItem = ({ item }: { item: RangeVisitStorage }) => {
    const totalRounds = Object.values(item.ammunitionUsed || {}).reduce(
      (sum, usage) => sum + usage.rounds,
      0
    );
    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("RangeVisitDetails", { id: item.id })
        }
        className="bg-terminal-bg border border-terminal-border p-4 mb-2"
      >
        <View className="flex-row flex-wrap">
          <View className="w-1/2 pr-2">
            <TerminalText className="text-lg">{item.location}</TerminalText>
          </View>
          <View className="w-1/2 items-end">
            <TerminalText>{totalRounds} rounds</TerminalText>
          </View>
          <View className="w-1/2 pr-2 mt-1">
            <TerminalText>
              {new Date(item.date).toLocaleDateString()}
            </TerminalText>
          </View>
          <View className="w-1/2 items-end justify-end">
            <TerminalText className="text-lg">{">"}</TerminalText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAmmunitionItem = ({ item }: { item: AmmunitionStorage }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("AmmunitionDetails", { id: item.id })}
      className="bg-terminal-bg border border-terminal-border p-4 mb-2"
    >
      <View className="flex-row flex-wrap">
        <View className="w-1/2 pr-2">
          <TerminalText className="text-lg" numberOfLines={1}>
            {item.brand} ({item.caliber})
          </TerminalText>
        </View>
        <View className="w-1/2 items-end">
          <TerminalText>{item.quantity} rounds</TerminalText>
        </View>
        <View className="w-1/2 pr-2 mt-1">
          <TerminalText>
            {item.pricePerRound && `$${item.pricePerRound.toFixed(2)}/rd`}
          </TerminalText>
        </View>
        <View className="w-1/2 items-end justify-end">
          <TerminalText className="text-lg">{">"}</TerminalText>
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
                <TerminalText>NO FIREARMS FOUND</TerminalText>
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
                <TerminalText>NO RANGE VISITS FOUND</TerminalText>
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
                <TerminalText>NO AMMUNITION FOUND</TerminalText>
              </View>
            }
          />
        );
    }
  };

  return (
    <View className="flex-1 p-4 bg-terminal-bg">
      <TerminalTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabPress={(tabId) => setActiveTab(tabId as TabType)}
      />
      {renderContent()}
    </View>
  );
};
