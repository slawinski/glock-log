import React from "react";
import { View, TouchableOpacity } from "react-native";
import { TerminalText } from "../terminal-text/TerminalText";

export type TabId = string;

export interface TabConfig {
  id: TabId;
  title: string;
}

interface TabProps {
  title: string;
  active: boolean;
  onPress: () => void;
}

const Tab: React.FC<TabProps> = ({ title, active, onPress }) => (
  <TouchableOpacity onPress={onPress} className="flex-1 items-center py-3">
    <TerminalText
      className={`${active ? "text-terminal-green" : "text-terminal-border"}`}
    >
      {active ? `[ ${title} ]` : title}
    </TerminalText>
  </TouchableOpacity>
);

interface TabBarProps {
  tabs: TabConfig[];
  activeTab: TabId;
  onTabPress: (tabId: TabId) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
}) => (
  <View className="flex-row justify-around mb-4 bg-terminal-bg border-b border-terminal-border">
    {tabs.map((tab) => (
      <Tab
        key={tab.id}
        title={tab.title}
        active={activeTab === tab.id}
        onPress={() => onTabPress(tab.id)}
      />
    ))}
  </View>
);
