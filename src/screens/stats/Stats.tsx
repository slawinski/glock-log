import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { logAndReportError } from "../../services/error-handler";
import { TerminalText, TerminalTabs, TerminalButton, } from "../../components";
import {
  FirearmStorage,
  RangeVisitStorage,
  AmmunitionStorage,
} from "../../validation/storageSchemas";
import { storage } from "../../services/storage-new";
import { VisitsTab } from "./VisitsTab";
import { FirearmsTab } from "./FirearmsTab";
import { AmmunitionTab } from "./AmmunitionTab";

type TabType = "visits" | "firearms" | "ammunition";

const TABS = [
  { id: "firearms", title: "FIREARMS" },
  { id: "visits", title: "VISITS" },
  { id: "ammunition", title: "AMMUNITION" },
];

export const Stats = () => {
  const [firearms, setFirearms] = useState<FirearmStorage[]>([]);
  const [ammunition, setAmmunition] = useState<AmmunitionStorage[]>([]);
  const [rangeVisits, setRangeVisits] = useState<RangeVisitStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("firearms");
  const [visibleFirearms, setVisibleFirearms] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (firearms.length > 0) {
      setVisibleFirearms(new Set(firearms.map((f) => f.id)));
    }
  }, [firearms]);

  const toggleFirearm = (firearmId: string) => {
    setVisibleFirearms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(firearmId)) {
        newSet.delete(firearmId);
      } else {
        newSet.add(firearmId);
      }
      return newSet;
    });
  };

  const toggleAllFirearms = () => {
    if (visibleFirearms.size === firearms.length) {
      setVisibleFirearms(new Set());
    } else {
      setVisibleFirearms(new Set(firearms.map((f) => f.id)));
    }
  };

  const isAllSelected = visibleFirearms.size === firearms.length;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [firearmsData, ammunitionData, visitsData] = await Promise.all([
        storage.getFirearms(),
        storage.getAmmunition(),
        storage.getRangeVisits(),
      ]);
      setFirearms(firearmsData);
      setAmmunition(ammunitionData);
      setRangeVisits(visitsData);
    } catch (error) {
      const userMessage = logAndReportError(error, "Stats.fetchData", "Failed to load statistics.");
      setError(userMessage);
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
        <TerminalButton onPress={fetchData} caption="RETRY" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-terminal-bg">
      <TerminalTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabPress={(tabId) => setActiveTab(tabId as TabType)}
      />
      {activeTab === "visits" && <VisitsTab rangeVisits={rangeVisits} />}
      {activeTab === "firearms" && (
        <FirearmsTab
          firearms={firearms}
          rangeVisits={rangeVisits}
          visibleFirearms={visibleFirearms}
          onToggleFirearm={toggleFirearm}
          onToggleAllFirearms={toggleAllFirearms}
          isAllSelected={isAllSelected}
        />
      )}
      {activeTab === "ammunition" && (
        <AmmunitionTab ammunition={ammunition} rangeVisits={rangeVisits} />
      )}
    </View>
  );
}
