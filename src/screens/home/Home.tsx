import React, {
  useCallback,
  useState,
  useLayoutEffect,
  useEffect,
} from "react";
import { View } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import {
  FirearmStorage,
  RangeVisitStorage,
  AmmunitionStorage,
  AccessoryStorage,
  CleaningSettings,
  CleaningEvent,
  PartSlot,
  PartInstance,
  PartInstallationPeriod,
} from "../../validation/storageSchemas";
import { handleError } from "../../services/error-handler";
import { storage } from "../../services/storage-new";
import {
  computeFirearmAttention,
  AttentionLevel,
} from "../../services/maintenance-attention";
import { ErrorDisplay, HeaderButton, LoadingScreen, TerminalTabs } from "../../components";
import { BottomButtonGroup } from "../../components/bottom-button-group/BottomButtonGroup";
import { FirearmsTab } from "./FirearmsTab";
import { VisitsTab } from "./VisitsTab";
import { AmmunitionTab } from "./AmmunitionTab";
import { AccessoriesTab } from "./AccessoriesTab";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

type TabType = "firearms" | "gear" | "visits" | "ammunition";

const TABS = [
  { id: "firearms", title: "GUNS" },
  { id: "gear", title: "GEAR" },
  { id: "visits", title: "VISITS" },
  { id: "ammunition", title: "AMMO" },
];

export const Home = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [firearms, setFirearms] = useState<FirearmStorage[]>([]);
  const [rangeVisits, setRangeVisits] = useState<RangeVisitStorage[]>([]);
  const [ammunition, setAmmunition] = useState<AmmunitionStorage[]>([]);
  const [accessories, setAccessories] = useState<AccessoryStorage[]>([]);
  const [attention, setAttention] = useState<Record<string, AttentionLevel>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("firearms");
  const [currency, setCurrency] = useState("USD");

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      const [
        firearmsData,
        visitsData,
        ammunitionData,
        accessoriesData,
        cleaningSettingsData,
        cleaningEventsData,
        partSlotsData,
        partInstancesData,
        partPeriodsData,
        currencyData,
      ] = await Promise.all([
        storage.getFirearms(),
        storage.getRangeVisits(),
        storage.getAmmunition(),
        storage.getAccessories(),
        storage.getAllCleaningSettings(),
        storage.getAllCleaningEvents(),
        storage.getAllPartSlots(),
        storage.getAllPartInstances(),
        storage.getAllPartPeriods(),
        storage.getCurrency(),
      ]);

      const settingsByFirearm = new Map(
        cleaningSettingsData.map((s: CleaningSettings) => [s.firearmId, s])
      );
      const attentionMap: Record<string, AttentionLevel> = {};
      for (const firearm of firearmsData) {
        const level = computeFirearmAttention(
          firearm.id,
          settingsByFirearm.get(firearm.id),
          cleaningEventsData,
          partSlotsData,
          partInstancesData,
          partPeriodsData,
          visitsData
        );
        if (level) {
          attentionMap[firearm.id] = level;
        }
      }

      setFirearms(firearmsData);
      setRangeVisits(visitsData);
      setAmmunition(ammunitionData);
      setAccessories(accessoriesData);
      setAttention(attentionMap);
      setCurrency(currencyData);
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
      case "gear":
        return "AddAccessory";
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
      case "gear":
        return "+ ADD ACCESSORY";
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
      return <LoadingScreen />;
    }

    if (error) {
      return <ErrorDisplay errorMessage={error} onRetry={() => fetchData(false)} />;
    }

    switch (activeTab) {
      case "firearms":
        return (
          <FirearmsTab
            firearms={firearms}
            accessories={accessories}
            attention={attention}
            onRefresh={onRefresh}
            refreshing={false}
          />
        );
      case "gear":
        return (
          <AccessoriesTab
            accessories={accessories}
            firearms={firearms}
            rangeVisits={rangeVisits}
            onRefresh={onRefresh}
            refreshing={false}
          />
        );
      case "visits":
        return (
          <VisitsTab
            rangeVisits={rangeVisits}
            firearms={firearms}
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
            currency={currency}
          />
        );
    }
  };

  return (
    <View className="flex-1 bg-terminal-bg px-4">
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
