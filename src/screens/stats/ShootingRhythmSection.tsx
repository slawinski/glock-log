import type { RhythmResult } from "../../analytics/stats";
import { DetailRow, DetailSection } from "../../components";
import { formatInteger } from "./format";

type Props = {
  rhythm: RhythmResult;
};

export const ShootingRhythmSection = ({ rhythm }: Props) => (
  <DetailSection title="SHOOTING RHYTHM">
    <DetailRow
      label="AVG BETWEEN VISITS"
      value={
        rhythm.avgBetweenVisitsDays == null
          ? "—"
          : `${formatInteger(Math.round(rhythm.avgBetweenVisitsDays))} DAYS`
      }
    />
    <DetailRow
      label="ROUNDS / MONTH"
      value={
        rhythm.roundsPerMonth == null
          ? "—"
          : formatInteger(Math.round(rhythm.roundsPerMonth))
      }
    />
    <DetailRow
      label="MOST ACTIVE MONTH"
      value={rhythm.mostActiveMonth?.label ?? "—"}
    />
    <DetailRow
      label="LONGEST GAP"
      value={
        rhythm.longestGapDays == null
          ? "—"
          : `${formatInteger(rhythm.longestGapDays)} DAYS`
      }
    />
  </DetailSection>
);
