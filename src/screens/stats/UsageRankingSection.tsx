import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import type { RankingEntry } from "../../analytics/stats";
import { SectionHeading, TerminalText } from "../../components";
import { formatInteger } from "./format";
import { ViewAllRankingModal } from "./ViewAllRankingModal";

type Props = {
  firearmRanking: RankingEntry[];
  caliberRanking: RankingEntry[];
  firearmSelected: boolean;
};

type Mode = "firearms" | "calibers";

const TOP_COUNT = 5;

export const UsageRankingSection = ({
  firearmRanking,
  caliberRanking,
  firearmSelected,
}: Props) => {
  const [mode, setMode] = useState<Mode>("firearms");
  const [modalVisible, setModalVisible] = useState(false);

  const effectiveMode: Mode = firearmSelected ? "calibers" : mode;
  const activeRanking =
    effectiveMode === "firearms" ? firearmRanking : caliberRanking;

  const segments: Mode[] = firearmSelected
    ? ["calibers"]
    : ["firearms", "calibers"];

  const displayEntries = useMemo(() => {
    if (activeRanking.length <= TOP_COUNT) {
      return activeRanking;
    }
    const top = activeRanking.slice(0, TOP_COUNT);
    const rest = activeRanking.slice(TOP_COUNT);
    const other = {
      key: "OTHER",
      label: "OTHER",
      rounds: rest.reduce((sum, entry) => sum + entry.rounds, 0),
      share: rest.reduce((sum, entry) => sum + entry.share, 0),
    };
    return [...top, other];
  }, [activeRanking]);

  const modalTitle =
    effectiveMode === "firearms" ? "ALL FIREARMS" : "ALL CALIBERS";

  return (
    <View className="mb-6">
      <SectionHeading title="USAGE" />
      <View className="flex-row mb-3" accessibilityRole="radiogroup">
        {segments.map((segment) => {
          const selected = effectiveMode === segment;
          return (
            <Pressable
              key={segment}
              testID={`rank-mode-${segment}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Ranking by ${segment}`}
              onPress={() => setMode(segment)}
              className={`flex-1 min-h-[44px] justify-center items-center ${
                selected
                  ? "bg-terminal-green"
                  : "border border-terminal-border"
              }`}
            >
              <TerminalText
                className={
                  selected ? "text-terminal-bg" : "text-terminal-green"
                }
              >
                {segment === "firearms" ? "FIREARMS" : "CALIBERS"}
              </TerminalText>
            </Pressable>
          );
        })}
      </View>

      {displayEntries.length === 0 ? (
        <TerminalText className="text-terminal-muted mb-3">
          NO USAGE DATA
        </TerminalText>
      ) : (
        <View className="mb-3">
          {displayEntries.map((entry) => {
            const pct = Math.min(100, Math.round(entry.share * 100));
            return (
              <View
                key={entry.key}
                testID={`rank-row-${entry.key}`}
                className="flex-row items-center mb-2"
              >
                <TerminalText
                  numberOfLines={1}
                  className="w-28 flex-shrink-0 mr-2 text-base"
                >
                  {entry.label}
                </TerminalText>
                <View className="flex-1 h-5 border border-terminal-border overflow-hidden">
                  <View
                    className="h-full bg-terminal-green"
                    style={{ width: `${pct}%` }}
                  />
                </View>
                <TerminalText className="w-16 text-right ml-2 text-base">
                  {formatInteger(entry.rounds)}
                </TerminalText>
              </View>
            );
          })}
        </View>
      )}

      {activeRanking.length > 0 ? (
        <Pressable
          testID="rank-view-all"
          accessibilityRole="button"
          accessibilityLabel="View all ranking entries"
          onPress={() => setModalVisible(true)}
          className="min-h-[44px] justify-center items-end"
        >
          <TerminalText className="text-terminal-green">
            VIEW ALL &gt;
          </TerminalText>
        </Pressable>
      ) : null}

      <ViewAllRankingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalTitle}
        entries={activeRanking}
      />
    </View>
  );
};
