import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import type { TimelineBucket } from "../../analytics/stats";
import {
  computeStepChartGeometry,
  StepChart,
  STEP_CHART_PADDING,
} from "./StepChart";

const bucket = (overrides: Partial<TimelineBucket>): TimelineBucket => ({
  startDateKey: "2025-01-01",
  endDateKey: "2025-01-31",
  label: "JAN 2025",
  granularity: "month",
  rounds: 0,
  knownCost: 0,
  pricedRounds: 0,
  visitCount: 0,
  cumulativeRounds: 0,
  cumulativeKnownCost: 0,
  ...overrides,
});

describe("computeStepChartGeometry", () => {
  const buckets: TimelineBucket[] = [
    bucket({ cumulativeRounds: 0, cumulativeKnownCost: 0 }),
    bucket({ cumulativeRounds: 10, cumulativeKnownCost: 5, rounds: 10 }),
    bucket({ cumulativeRounds: 25, cumulativeKnownCost: 12, rounds: 15 }),
  ];

  it("builds a step path starting at bottom-left with horizontal/vertical segments", () => {
    const geometry = computeStepChartGeometry(buckets, 320, 200, "rounds");

    expect(geometry.path.startsWith("M ")).toBe(true);
    expect(geometry.path).toContain("L");

    const bottom = 200 - STEP_CHART_PADDING.bottom;
    expect(geometry.points[0].x).toBe(STEP_CHART_PADDING.left);
    expect(geometry.points[0].y).toBe(bottom);
  });

  it("emits one point per bucket and maps cumulative values upward", () => {
    const geometry = computeStepChartGeometry(buckets, 320, 200, "rounds");

    expect(geometry.points).toHaveLength(buckets.length);
    expect(geometry.points[0].bucketIndex).toBe(0);
    expect(geometry.points[2].bucketIndex).toBe(2);
    expect(geometry.maxValue).toBe(25);
    expect(geometry.points[2].y).toBeLessThan(geometry.points[0].y);
  });

  it("keeps label counts within the required caps", () => {
    const geometry = computeStepChartGeometry(buckets, 320, 200, "rounds");

    expect(geometry.xLabels.length).toBeLessThanOrEqual(7);
    expect(geometry.yLabels.length).toBeLessThanOrEqual(5);
    expect(geometry.xLabels).toHaveLength(buckets.length);
  });

  it("returns an empty geometry for zero buckets", () => {
    const geometry = computeStepChartGeometry([], 320, 200, "rounds");

    expect(geometry.path).toBe("");
    expect(geometry.points).toHaveLength(0);
    expect(geometry.maxValue).toBe(0);
  });

  it("handles a single bucket as a flat line", () => {
    const geometry = computeStepChartGeometry(
      [bucket({ cumulativeRounds: 10, rounds: 10 })],
      320,
      200,
      "rounds"
    );

    expect(geometry.points).toHaveLength(1);
    expect(geometry.path.startsWith("M ")).toBe(true);
    expect(geometry.path).toContain("L");
  });
});

describe("StepChart", () => {
  it("renders without throwing", () => {
    const buckets: TimelineBucket[] = [
      bucket({ cumulativeRounds: 0 }),
      bucket({ cumulativeRounds: 10, rounds: 10 }),
      bucket({ cumulativeRounds: 25, rounds: 15 }),
    ];

    const { getByTestId, getByLabelText } = render(
      <StepChart
        buckets={buckets}
        mode="rounds"
        selectedBucketIndex={null}
        onSelectBucket={jest.fn()}
        currency="USD"
      />
    );

    fireEvent(getByTestId("step-chart"), "layout", {
      nativeEvent: { layout: { width: 320, height: 200 } },
    });

    expect(getByLabelText("Ammunition usage chart")).toBeTruthy();
  });
});
