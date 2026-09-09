import { View } from "react-native";
import type { SummaryResult } from "../../analytics/stats";
import { TerminalText } from "../../components";
import {
  formatCoverageLabel,
  formatInteger,
  formatKnownCost,
} from "./format";

type Props = {
  summary: SummaryResult;
  currency: string;
};

type MetricCardProps = {
  value: string;
  label: string;
  accessibilityLabel: string;
  subLabel?: string | null;
};

const MetricCard = ({
  value,
  label,
  accessibilityLabel,
  subLabel,
}: MetricCardProps) => (
  <View
    className="w-1/2 p-2"
    accessible
    accessibilityLabel={accessibilityLabel}
  >
    <View className="border border-terminal-border p-3 min-h-[92px] justify-center">
      <TerminalText className="text-2xl">{value}</TerminalText>
      <TerminalText className="text-terminal-muted uppercase text-sm mt-1">
        {label}
      </TerminalText>
      {subLabel ? (
        <TerminalText className="text-terminal-muted text-xs mt-1">
          {subLabel}
        </TerminalText>
      ) : null}
    </View>
  </View>
);

export const StatsSummary = ({ summary, currency }: Props) => {
  const roundsValue = formatInteger(summary.rounds);
  const visitsValue = formatInteger(summary.visits);
  const ammoValue = summary.hasFiredRounds
    ? formatKnownCost(
        summary.knownCost,
        currency,
        summary.hasPriceData,
        summary.priceCoverage
      )
    : "—";
  const avgValue =
    summary.avgRoundsPerVisit == null
      ? "—"
      : formatInteger(summary.avgRoundsPerVisit);

  let ammoSubLabel: string | null = null;
  if (summary.hasFiredRounds) {
    if (!summary.hasPriceData) {
      ammoSubLabel = "NO PRICE DATA";
    } else if (
      summary.priceCoverage !== null &&
      summary.priceCoverage < 100
    ) {
      ammoSubLabel = formatCoverageLabel(summary.priceCoverage);
    }
  }

  return (
    <View className="flex-row flex-wrap -mx-2 mb-6">
      <MetricCard
        value={roundsValue}
        label="ROUNDS"
        accessibilityLabel={`Rounds fired, ${roundsValue}`}
      />
      <MetricCard
        value={visitsValue}
        label="VISITS"
        accessibilityLabel={`Visits, ${visitsValue}`}
      />
      <MetricCard
        value={ammoValue}
        label="AMMO USED"
        accessibilityLabel={`Ammunition used, ${ammoValue}`}
        subLabel={ammoSubLabel}
      />
      <MetricCard
        value={avgValue}
        label="AVG RDS / VISIT"
        accessibilityLabel={`Average rounds per visit, ${avgValue}`}
      />
    </View>
  );
};
