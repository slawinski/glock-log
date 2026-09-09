import { useMemo, useState } from "react";
import {
  Modal,
  View,
  Pressable,
  FlatList,
  TextInput,
} from "react-native";
import type { RankingEntry } from "../../analytics/stats";
import { TerminalText } from "../../components";
import { COLORS } from "../../theme";
import { formatInteger } from "./format";

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  entries: RankingEntry[];
  currency?: string;
};

const ROW_HEIGHT = 44;

export const ViewAllRankingModal = ({
  visible,
  onClose,
  title,
  entries,
}: Props) => {
  const [search, setSearch] = useState("");

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.rounds - a.rounds),
    [entries]
  );

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query.length === 0) {
      return sortedEntries;
    }
    return sortedEntries.filter((entry) =>
      entry.label.toLowerCase().includes(query)
    );
  }, [sortedEntries, search]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/70 justify-center px-6">
        <View className="bg-terminal-bg border border-terminal-border rounded max-h-[80%]">
          <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
            <TerminalText className="text-xl">{title}</TerminalText>
            <Pressable
              testID="rank-close"
              accessibilityRole="button"
              accessibilityLabel="Close ranking"
              onPress={onClose}
              className="min-h-[44px] justify-center px-2"
            >
              <TerminalText className="text-terminal-muted">CLOSE</TerminalText>
            </Pressable>
          </View>
          <View className="px-4 pb-2">
            <TextInput
              testID="rank-search"
              value={search}
              onChangeText={setSearch}
              placeholder="SEARCH"
              placeholderTextColor={COLORS.PLACEHOLDER}
              accessibilityLabel="Search ranking"
              className="border border-terminal-border text-terminal-green font-terminal text-lg px-2 py-1"
            />
          </View>
          <FlatList
            data={filteredEntries}
            keyExtractor={(entry) => entry.key}
            getItemLayout={(_data, index) => ({
              length: ROW_HEIGHT,
              offset: ROW_HEIGHT * index,
              index,
            })}
            keyboardShouldPersistTaps="handled"
            className="max-h-[400px]"
            renderItem={({ item, index }) => (
              <View className="min-h-[44px] justify-center px-4 border-b border-terminal-border/30">
                <TerminalText className="text-base">
                  {`${index + 1}. ${item.label}  ${formatInteger(
                    item.rounds
                  )} RDS · ${Math.round(item.share * 100)}%`}
                </TerminalText>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};
