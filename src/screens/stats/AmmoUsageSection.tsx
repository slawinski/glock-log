import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import type { TimelineBucket } from "../../analytics/stats";
import { SectionHeading, TerminalText } from "../../components";
import { formatInteger, formatKnownCost } from "./format";
import { StepChart } from "./StepChart";

type Props = {
  timeline: TimelineBucket[];
  currency: string;
  priceCoverage: number | null;
  hasFiredRounds: boolean;
};

type Mode = "rounds" | "cost";

const MODES: Mode[] = ["rounds", "cost"];

export const AmmoUsageSection = ({
  timeline,
  currency,
  priceCoverage,
  hasFiredRounds,
}: Props) => {
  const [mode, setMode] = useState<Mode>("rounds");
  const [selectedBucketIndex, setSelectedBucketIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    setSelectedBucketIndex(null);
  }, [timeline]);

  const selectedBucket =
    selectedBucketIndex !== null ? timeline[selectedBucketIndex] : null;

  const handleSelectBucket = (index: number) => {
    setSelectedBucketIndex(selectedBucketIndex === index ? null : index);
  };

  return (
    <View className="mb-6">
      <SectionHeading title="AMMUNITION USAGE" />
      <View className="flex-row mb-3" accessibilityRole="radiogroup">
        {MODES.map((m) => {
          const selected = mode === m;
          return (
            <Pressable
              key={m}
              testID={`mode-${m}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Chart mode ${m}`}
              onPress={() => setMode(m)}
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
                {m === "rounds" ? "ROUNDS" : "COST"}
              </TerminalText>
            </Pressable>
          );
        })}
      </View>

      {mode === "cost" &&
      hasFiredRounds &&
      priceCoverage !== null &&
      priceCoverage < 100 ? (
        <TerminalText className="text-terminal-muted text-sm mb-2">
          {`KNOWN COST · ${Math.round(priceCoverage)}% PRICED`}
        </TerminalText>
      ) : null}

      <StepChart
        buckets={timeline}
        mode={mode}
        selectedBucketIndex={selectedBucketIndex}
        onSelectBucket={handleSelectBucket}
        currency={currency}
      />

      {selectedBucket ? (
        <Pressable
          testID="chart-selection-detail"
          accessibilityRole="button"
          accessibilityLabel="Clear chart selection"
          onPress={() => setSelectedBucketIndex(null)}
          className="border border-terminal-border mt-3 p-3"
        >
          <TerminalText className="mb-1">{selectedBucket.label}</TerminalText>
          <TerminalText className="text-terminal-muted">
            {`${formatInteger(selectedBucket.rounds)} ROUNDS · ${
              selectedBucket.visitCount
            } VISITS`}
          </TerminalText>
          {selectedBucket.pricedRounds > 0 ? (
            <TerminalText className="text-terminal-muted">
              {`${formatKnownCost(
                selectedBucket.knownCost,
                currency,
                true,
                priceCoverage
              )} KNOWN COST`}
            </TerminalText>
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
};
