import React from "react";
import { View, Pressable } from "react-native";
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
  <Pressable
    onPress={onPress}
    className="flex-1 items-center py-3"
    accessibilityRole="tab"
    accessibilityLabel={title}
    accessibilityState={{ selected: active }}
  >
    {active ? (
      <TerminalText
        testID="active-tab-text"
        className="bg-terminal-green text-terminal-bg px-1"
      >
        {title}
      </TerminalText>
    ) : (
      <TerminalText testID="inactive-tab-text" className="text-terminal-border px-1">
        {title}
      </TerminalText>
    )}
  </Pressable>
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
  <View className="flex-row justify-around mb-4 bg-terminal-bg border-b-2 border-terminal-border">
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
