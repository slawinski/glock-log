import React from "react";
import { View, TouchableOpacity } from "react-native";
import { TerminalText } from "../terminal-text/TerminalText";

export type TabId = string;

export interface TabConfig {
  id: TabId;
  title: string;
}

type TabProps = {
  title: string;
  active: boolean;
  onPress: () => void;
};

const Tab = ({ title, active, onPress }: TabProps) => (
  <TouchableOpacity onPress={onPress} className="flex-1 items-center py-3">
    {active ? (
      <TerminalText className="bg-terminal-green text-terminal-bg px-1">
        {title}
      </TerminalText>
    ) : (
      <TerminalText className="text-terminal-border px-1">{title}</TerminalText>
    )}
  </TouchableOpacity>
);

type Props = {
  tabs: TabConfig[];
  activeTab: TabId;
  onTabPress: (id: TabId) => void;
};

export const TerminalTabs = ({
  tabs,
  activeTab,
  onTabPress,
}: Props) => (
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
