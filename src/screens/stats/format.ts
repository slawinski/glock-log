import { formatCurrency } from "../../utils/currency";

export const formatCompactNumber = (n: number): string => {
  if (n < 1000) {
    return String(n);
  }
  const thousands = (n / 1000) * 10;
  const rounded = Math.round(thousands) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}K`;
};

export const formatInteger = (n: number): string => n.toLocaleString("en-US");

export const formatKnownCost = (
  knownCost: number,
  currency: string,
  hasPriceData: boolean,
  priceCoverage: number | null
): string => {
  if (!hasPriceData) {
    return "—";
  }
  const suffix = priceCoverage !== null && priceCoverage < 100 ? "+" : "";
  return `${formatCurrency(knownCost, currency)}${suffix}`;
};

export const formatCoverageLabel = (priceCoverage: number | null): string => {
  if (priceCoverage === null) {
    return "";
  }
  return `${Math.round(priceCoverage)}% PRICED`;
};
