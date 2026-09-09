import { useMemo, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { format, parseISO } from "date-fns";
import Svg, {
  Path,
  Line,
  Rect,
  Circle,
  Text as SvgText,
} from "react-native-svg";
import type { TimelineBucket } from "../../analytics/stats";
import { COLORS } from "../../theme";
import { formatCurrency } from "../../utils/currency";
import { formatCompactNumber } from "./format";

export const STEP_CHART_PADDING = {
  left: 40,
  right: 12,
  top: 12,
  bottom: 24,
} as const;

export type StepChartGeometry = {
  path: string;
  areaPath: string;
  points: { x: number; y: number; bucketIndex: number }[];
  xLabels: { x: number; label: string }[];
  yLabels: { y: number; label: string }[];
  maxValue: number;
};

const niceNum = (range: number, round: boolean): number => {
  if (range <= 0) {
    return 0;
  }
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let nice: number;
  if (round) {
    nice = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
  } else {
    nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  }
  return nice * Math.pow(10, exponent);
};

const computeTicks = (maxValue: number): number[] => {
  if (maxValue <= 0) {
    return [0];
  }
  const step = niceNum(maxValue / 4, true);
  const top = Math.ceil(maxValue / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top + step * 1e-6; value += step) {
    ticks.push(Number(value.toFixed(10)));
  }
  if (ticks.length <= 5) {
    return ticks;
  }
  const thinned: number[] = [];
  for (let i = 0; i < 5; i += 1) {
    thinned.push(ticks[Math.round((i * (ticks.length - 1)) / 4)]);
  }
  return thinned;
};

const pickLabelIndices = (n: number): number[] => {
  if (n === 0) {
    return [];
  }
  if (n <= 7) {
    return Array.from({ length: n }, (_, i) => i);
  }
  const indices: number[] = [];
  for (let i = 0; i < 7; i += 1) {
    indices.push(Math.round((i * (n - 1)) / 6));
  }
  return [...new Set(indices)];
};

const shortLabel = (bucket: TimelineBucket): string => {
  switch (bucket.granularity) {
    case "day":
    case "week":
      return bucket.label;
    case "month":
      return format(parseISO(bucket.startDateKey), "MMM yy").toUpperCase();
    case "quarter":
    case "year":
      return bucket.label;
  }
};

const compactCurrency = (value: number, currency: string): string => {
  const formatted = formatCurrency(value, currency);
  if (value >= 1000) {
    return formatted.replace(/\.\d{2}$/, "");
  }
  return formatted;
};

export const computeStepChartGeometry = (
  buckets: TimelineBucket[],
  width: number,
  height: number,
  mode: "rounds" | "cost",
  currency: string = "USD"
): StepChartGeometry => {
  const empty: StepChartGeometry = {
    path: "",
    areaPath: "",
    points: [],
    xLabels: [],
    yLabels: [],
    maxValue: 0,
  };

  const n = buckets.length;
  if (n === 0 || width <= 0 || height <= 0) {
    return empty;
  }

  const plotLeft = STEP_CHART_PADDING.left;
  const plotRight = width - STEP_CHART_PADDING.right;
  const plotTop = STEP_CHART_PADDING.top;
  const plotBottom = height - STEP_CHART_PADDING.bottom;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const columnWidth = plotWidth / n;

  const values = buckets.map((bucket) =>
    mode === "rounds" ? bucket.cumulativeRounds : bucket.cumulativeKnownCost
  );
  const maxValue = Math.max(0, ...values);

  const ticks = computeTicks(maxValue);
  const niceMax = ticks[ticks.length - 1];

  const yFor = (value: number): number => {
    if (niceMax <= 0) {
      return plotBottom;
    }
    return plotBottom - (value / niceMax) * plotHeight;
  };

  const points = buckets.map((_, index) => ({
    x: plotLeft + index * columnWidth,
    y: yFor(values[index]),
    bucketIndex: index,
  }));

  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i += 1) {
    path += ` L ${points[i].x + columnWidth},${points[i].y}`;
    path += ` L ${points[i].x + columnWidth},${points[i + 1].y}`;
  }
  path += ` L ${plotRight},${points[n - 1].y}`;

  let areaPath = `M ${plotLeft},${plotBottom} L ${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i += 1) {
    areaPath += ` L ${points[i].x + columnWidth},${points[i].y}`;
    areaPath += ` L ${points[i].x + columnWidth},${points[i + 1].y}`;
  }
  areaPath += ` L ${plotRight},${points[n - 1].y} L ${plotRight},${plotBottom} Z`;

  const xLabels = pickLabelIndices(n).map((index) => ({
    x: points[index].x + columnWidth / 2,
    label: shortLabel(buckets[index]),
  }));

  const yLabels = ticks.map((tick) => ({
    y: yFor(tick),
    label:
      mode === "rounds"
        ? formatCompactNumber(tick)
        : compactCurrency(tick, currency),
  }));

  return { path, areaPath, points, xLabels, yLabels, maxValue };
};

type Props = {
  buckets: TimelineBucket[];
  mode: "rounds" | "cost";
  selectedBucketIndex: number | null;
  onSelectBucket: (index: number) => void;
  currency: string;
  height?: number;
};

export const StepChart = ({
  buckets,
  mode,
  selectedBucketIndex,
  onSelectBucket,
  currency,
  height = 200,
}: Props) => {
  const [width, setWidth] = useState(0);

  const geometry = useMemo(
    () => computeStepChartGeometry(buckets, width, height, mode, currency),
    [buckets, width, height, mode, currency]
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth !== width) {
      setWidth(nextWidth);
    }
  };

  const n = buckets.length;
  const columnWidth =
    n > 0
      ? (width - STEP_CHART_PADDING.left - STEP_CHART_PADDING.right) / n
      : 0;

  return (
    <View
      testID="step-chart"
      onLayout={onLayout}
      style={{ width: "100%", height }}
    >
      {width > 0 && n > 0 ? (
        <Svg
          width={width}
          height={height}
          accessible
          accessibilityLabel="Ammunition usage chart"
        >
          {geometry.yLabels.map((tick, index) => (
            <Line
              key={`grid-${index}`}
              x1={STEP_CHART_PADDING.left}
              x2={width - STEP_CHART_PADDING.right}
              y1={tick.y}
              y2={tick.y}
              stroke="rgba(0,255,0,0.15)"
              strokeWidth={1}
            />
          ))}
          {geometry.yLabels.map((tick, index) => (
            <SvgText
              key={`y-label-${index}`}
              x={STEP_CHART_PADDING.left - 6}
              y={tick.y + 4}
              fill={COLORS.TERMINAL_GREEN}
              fontSize={12}
              textAnchor="end"
            >
              {tick.label}
            </SvgText>
          ))}
          {geometry.xLabels.map((label, index) => (
            <SvgText
              key={`x-label-${index}`}
              x={label.x}
              y={height - 6}
              fill={COLORS.TERMINAL_GREEN}
              fontSize={12}
              textAnchor="middle"
            >
              {label.label}
            </SvgText>
          ))}
          {geometry.areaPath ? (
            <Path d={geometry.areaPath} fill="rgba(0,255,0,0.08)" />
          ) : null}
          {selectedBucketIndex !== null &&
          geometry.points[selectedBucketIndex] ? (
            <Rect
              x={geometry.points[selectedBucketIndex].x}
              y={0}
              width={columnWidth}
              height={height}
              fill="rgba(0,255,0,0.08)"
            />
          ) : null}
          {geometry.path ? (
            <Path
              d={geometry.path}
              stroke={COLORS.TERMINAL_GREEN}
              strokeWidth={2}
              fill="none"
            />
          ) : null}
          {selectedBucketIndex !== null &&
          geometry.points[selectedBucketIndex] ? (
            <Circle
              cx={geometry.points[selectedBucketIndex].x}
              cy={geometry.points[selectedBucketIndex].y}
              r={4}
              fill={COLORS.TERMINAL_GREEN}
            />
          ) : null}
          {geometry.points.map((point, index) => (
            <Rect
              key={`tap-${index}`}
              x={point.x}
              y={0}
              width={columnWidth}
              height={height}
              fill="transparent"
              onPress={() => onSelectBucket(index)}
            />
          ))}
        </Svg>
      ) : null}
    </View>
  );
};
