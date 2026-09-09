import { useMemo, useState } from "react";
import {
  View,
  Pressable,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import {
  PERIOD_IDS,
  type FirearmSelection,
  type PeriodFilterId,
} from "../../analytics/stats";
import { TerminalText } from "../../components";
import { COLORS } from "../../theme";

type FirearmOption = { id: string; label: string };

type Props = {
  period: PeriodFilterId;
  onPeriodChange: (p: PeriodFilterId) => void;
  firearmSelection: FirearmSelection;
  onFirearmChange: (s: FirearmSelection) => void;
  firearmOptions: FirearmOption[];
};

type PickerOption = {
  key: string;
  label: string;
  selection: FirearmSelection;
  testID: string;
};

const ALL_SELECTION: FirearmSelection = { kind: "all" };

export const StatsFilters = ({
  period,
  onPeriodChange,
  firearmSelection,
  onFirearmChange,
  firearmOptions,
}: Props) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState("");

  const options: PickerOption[] = useMemo(() => {
    const list: PickerOption[] = [
      {
        key: "all",
        label: "ALL FIREARMS",
        selection: ALL_SELECTION,
        testID: "firearm-option-all",
      },
      ...firearmOptions.map((option) => ({
        key: option.id,
        label: option.label,
        selection: { kind: "firearm", firearmId: option.id } as FirearmSelection,
        testID: `firearm-option-${option.id}`,
      })),
    ];
    return list;
  }, [firearmOptions]);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query.length === 0) {
      return options;
    }
    return options.filter((option) =>
      option.label.toLowerCase().includes(query)
    );
  }, [options, search]);

  const selectedFirearmLabel =
    firearmSelection.kind === "firearm"
      ? (firearmOptions.find((o) => o.id === firearmSelection.firearmId)
          ?.label ?? "FIREARM")
      : "ALL FIREARMS";

  const selectedOptionKey =
    firearmSelection.kind === "firearm"
      ? firearmSelection.firearmId
      : "all";

  const closeModal = () => {
    setModalVisible(false);
    setSearch("");
  };

  return (
    <View className="mb-4">
      <View
        className="flex-row mb-3"
        accessibilityRole="radiogroup"
        accessibilityLabel="Statistics period"
      >
        {PERIOD_IDS.map((id) => {
          const selected = period === id;
          return (
            <Pressable
              key={id}
              testID={`period-${id}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Period ${id}`}
              onPress={() => onPeriodChange(id)}
              className={`flex-1 min-h-[44px] justify-center items-center px-1 ${
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
                {id}
              </TerminalText>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        testID="firearm-filter-button"
        accessibilityRole="button"
        accessibilityLabel="Filter by firearm"
        onPress={() => setModalVisible(true)}
        className="border border-terminal-border min-h-[44px] justify-center px-3"
      >
        <TerminalText>{`${selectedFirearmLabel} ▾`}</TerminalText>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-terminal-bg border border-terminal-border rounded max-h-[80%]">
            <TerminalText className="text-xl px-4 pt-4 pb-2">
              FILTER BY FIREARM
            </TerminalText>
            <View className="px-4 pb-2">
              <TextInput
                testID="firearm-filter-search"
                value={search}
                onChangeText={setSearch}
                placeholder="SEARCH"
                placeholderTextColor={COLORS.PLACEHOLDER}
                accessibilityLabel="Search firearms"
                className="border border-terminal-border text-terminal-green font-terminal text-lg px-2 py-1"
              />
            </View>
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.key}
              keyboardShouldPersistTaps="handled"
              className="max-h-[320px]"
              renderItem={({ item }) => {
                const selected = item.key === selectedOptionKey;
                return (
                  <Pressable
                    testID={item.testID}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={item.label}
                    onPress={() => {
                      onFirearmChange(item.selection);
                      closeModal();
                    }}
                    className="min-h-[44px] justify-center px-4 border-b border-terminal-border/30"
                  >
                    <View className="flex-row items-center">
                      <TerminalText
                        className={
                          selected
                            ? "text-terminal-green"
                            : "text-terminal-muted"
                        }
                      >
                        {selected ? "●" : "○"}
                      </TerminalText>
                      <TerminalText className="ml-2 flex-shrink">
                        {item.label}
                      </TerminalText>
                    </View>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
