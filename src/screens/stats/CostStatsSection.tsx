import type { CostResult } from "../../analytics/stats";
import { DetailRow, DetailSection, TerminalText } from "../../components";
import { formatCurrency } from "../../utils/currency";
import { formatKnownCost } from "./format";

type Props = {
  costs: CostResult;
  currency: string;
  hidePurchased: boolean;
  hasFiredRounds: boolean;
};

export const CostStatsSection = ({
  costs,
  currency,
  hidePurchased,
  hasFiredRounds,
}: Props) => (
  <DetailSection title="COSTS">
    {!hidePurchased && (
      <DetailRow
        label="AMMO PURCHASED"
        value={formatCurrency(costs.ammoPurchased, currency)}
      />
    )}
    <DetailRow
      label="AMMO FIRED"
      value={
        hasFiredRounds && costs.hasPriceData
          ? formatKnownCost(costs.ammoFired, currency, true, costs.priceCoverage)
          : "—"
      }
    />
    <DetailRow
      label="AVG COST / ROUND"
      value={
        costs.avgCostPerRound == null
          ? "—"
          : formatCurrency(costs.avgCostPerRound, currency)
      }
    />
    <DetailRow
      label="AVG AMMO COST / VISIT"
      value={
        costs.avgAmmoCostPerVisit == null
          ? "—"
          : formatCurrency(costs.avgAmmoCostPerVisit, currency)
      }
    />
    <DetailRow
      label="CURRENT STOCK VALUE"
      value={formatCurrency(costs.currentStockValue, currency)}
    />
    <TerminalText className="text-terminal-muted text-sm -mt-1 mb-2">
      CURRENT · NOT PERIOD FILTERED
    </TerminalText>
    <DetailRow
      label="PRICE COVERAGE"
      value={
        costs.priceCoverage == null
          ? "—"
          : `${Math.round(costs.priceCoverage)}%`
      }
    />
    {hasFiredRounds && !costs.hasPriceData ? (
      <TerminalText className="text-terminal-muted text-sm mt-1">
        NO AMMO PRICE DATA
      </TerminalText>
    ) : null}
  </DetailSection>
);
