import {
  formatCompactNumber,
  formatInteger,
  formatKnownCost,
  formatCoverageLabel,
} from "./format";

describe("formatCompactNumber", () => {
  it("returns plain numbers below 1000", () => {
    expect(formatCompactNumber(0)).toBe("0");
    expect(formatCompactNumber(999)).toBe("999");
  });

  it("formats integer thousands without a decimal", () => {
    expect(formatCompactNumber(1000)).toBe("1K");
    expect(formatCompactNumber(2000)).toBe("2K");
    expect(formatCompactNumber(5000)).toBe("5K");
  });

  it("formats non-integer thousands with one decimal", () => {
    expect(formatCompactNumber(12400)).toBe("12.4K");
    expect(formatCompactNumber(1500)).toBe("1.5K");
  });
});

describe("formatInteger", () => {
  it("uses locale grouping", () => {
    expect(formatInteger(4820)).toBe("4,820");
    expect(formatInteger(0)).toBe("0");
  });
});

describe("formatKnownCost", () => {
  it("returns an em dash when there is no price data", () => {
    expect(formatKnownCost(0, "USD", false, null)).toBe("—");
  });

  it("appends a plus to signal a lower bound for partial pricing", () => {
    expect(formatKnownCost(12.5, "USD", true, 50)).toBe("$12.50+");
  });

  it("omits the plus when pricing is complete", () => {
    expect(formatKnownCost(12.5, "USD", true, 100)).toBe("$12.50");
  });
});

describe("formatCoverageLabel", () => {
  it("returns an empty string for null coverage", () => {
    expect(formatCoverageLabel(null)).toBe("");
  });

  it("rounds coverage to a whole percent", () => {
    expect(formatCoverageLabel(66.6)).toBe("67% PRICED");
  });
});
