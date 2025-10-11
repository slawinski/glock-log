import React, {
  useCallback,
  useState,
  useLayoutEffect,
  useEffect,
} from "react";
import { View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import {
  FirearmStorage,
  RangeVisitStorage,
  AmmunitionStorage,
} from "../../validation/storageSchemas";
import { handleError } from "../../services/error-handler";
import { storage } from "../../services/storage-new";
import { TerminalText, HeaderButton, TerminalTabs } from "../../components";
import { BottomButtonGroup } from "../../components/bottom-button-group/BottomButtonGroup";
import { FirearmsTab } from "./FirearmsTab";
import { VisitsTab } from "./VisitsTab";
import { AmmunitionTab } from "./AmmunitionTab";

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

  const fetchData = useCallback(async (isRefresh = false) => {
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
      handleError(error, "Home.fetchData", { isUserFacing: true, userMessage: "Failed to load data." });
      setError("Failed to load data.");
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
    }
  }, [isInitialLoad]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderButton
          onPress={() => navigation.navigate("Menu")}
          caption="☰"
          className="text-2xl"
        />
      ),
      title: "TRIGGERNOTE",
    });
  }, [navigation]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      if (!isInitialLoad) {
        fetchData(true);
      }
    }, [isInitialLoad, fetchData])
  );

  const onRefresh = () => {
    fetchData(true);
  };

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

  const getAddButtonCaption = () => {
    switch (activeTab) {
      case "firearms":
        return "+ ADD FIREARM";
      case "visits":
        return "+ ADD VISIT";
      case "ammunition":
        return "+ ADD AMMO";
      default:
        return "+ ADD";
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
          <FirearmsTab
            firearms={firearms}
            onRefresh={onRefresh}
            refreshing={false}
          />
        );
      case "visits":
        return (
          <VisitsTab
            rangeVisits={rangeVisits}
            onRefresh={onRefresh}
            refreshing={false}
          />
        );
      case "ammunition":
        return (
          <AmmunitionTab
            ammunition={ammunition}
            onRefresh={onRefresh}
            refreshing={false}
          />
        );
    }
  };

  return (
    <View className="flex-1 bg-terminal-bg">
      <TerminalTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabPress={(tabId) => setActiveTab(tabId as TabType)}
      />
      <View className="flex-1">{renderContent()}</View>
      <BottomButtonGroup
        buttons={[
          {
            caption: getAddButtonCaption(),
            onPress: () => navigation.navigate(getAddScreen()),
          },
        ]}
      />
    </View>
  );
};
