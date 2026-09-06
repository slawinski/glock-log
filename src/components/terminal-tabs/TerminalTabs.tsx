import React from "react";
import { View, Pressable } from "react-native";
import { TerminalText } from "../terminal-text/TerminalText";

export type TabId = string;

export interface TabConfig {
  id: TabId;
  title: string;
}

type TabVariant = "primary" | "secondary";

type TabProps = {
  title: string;
  active: boolean;
  onPress: () => void;
  variant: TabVariant;
  testIDPrefix: string;
};

const Tab = ({ title, active, onPress, variant, testIDPrefix }: TabProps) => {
  const containerClass =
    variant === "primary"
      ? "flex-1 items-center justify-center min-h-[44px] py-3"
      : "flex-1 items-center justify-center min-h-[36px] py-1";

  return (
    <Pressable
      onPress={onPress}
      className={containerClass}
      accessibilityRole="tab"
      accessibilityLabel={title}
      accessibilityState={{ selected: active }}
    >
      <TerminalText
        testID={`${testIDPrefix}${active ? "active" : "inactive"}-tab-text`}
        className={
          active
            ? "bg-terminal-green text-terminal-bg px-1"
            : "text-terminal-border px-1"
        }
      >
        {title}
      </TerminalText>
    </Pressable>
  );
};

type Props = {
  tabs: TabConfig[];
  activeTab: TabId;
  onTabPress: (id: TabId) => void;
  variant?: TabVariant;
  testIDPrefix?: string;
};

export const TerminalTabs = ({
  tabs,
  activeTab,
  onTabPress,
  variant = "primary",
  testIDPrefix = "",
}: Props) => (
  <View
    className={
      variant === "primary"
        ? "flex-row justify-around mb-4 bg-terminal-bg border-b-2 border-terminal-border"
        : "flex-row justify-around mb-2 bg-terminal-bg"
    }
  >
    {tabs.map((tab) => (
      <Tab
        key={tab.id}
        title={tab.title}
        active={activeTab === tab.id}
        onPress={() => onTabPress(tab.id)}
        variant={variant}
        testIDPrefix={testIDPrefix}
      />
    ))}
  </View>
);
