import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { startOfDay } from "date-fns";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import { handleError } from "../../services/error-handler";
import {
  EmptyState,
  ErrorDisplay,
  LoadingScreen,
} from "../../components";
import { storage } from "../../services/storage-new";
import {
  AmmunitionStorage,
  FirearmStorage,
  RangeVisitStorage,
} from "../../validation/storageSchemas";
import {
  buildActivityIndex,
  calculateRanking,
  filterActivity,
  resolvePeriod,
  PERIOD_IDS,
  type FirearmSelection,
  type PeriodFilterId,
} from "../../analytics/stats";
import { StatsFilters } from "./StatsFilters";
import { StatsSummary } from "./StatsSummary";
import { AmmoUsageSection } from "./AmmoUsageSection";
import { VisitCalendarSection } from "./VisitCalendarSection";
import { CostStatsSection } from "./CostStatsSection";
import { UsageRankingSection } from "./UsageRankingSection";
import { ShootingRhythmSection } from "./ShootingRhythmSection";

type StatsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Stats"
>;

const isPeriodId = (value: string): value is PeriodFilterId =>
  (PERIOD_IDS as readonly string[]).includes(value);

export const Stats = () => {
  const navigation = useNavigation<StatsScreenNavigationProp>();

  const [firearms, setFirearms] = useState<FirearmStorage[]>([]);
  const [ammunition, setAmmunition] = useState<AmmunitionStorage[]>([]);
  const [rangeVisits, setRangeVisits] = useState<RangeVisitStorage[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodId, setPeriodId] = useState<PeriodFilterId>("6M");
  const [firearmSelection, setFirearmSelection] = useState<FirearmSelection>({
    kind: "all",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [
        firearmsData,
        ammunitionData,
        visitsData,
        currencyData,
        periodData,
      ] = await Promise.all([
        storage.getFirearms(),
        storage.getAmmunition(),
        storage.getRangeVisits(),
        storage.getCurrency(),
        storage.getStatsPeriod(),
      ]);
      setFirearms(firearmsData);
      setAmmunition(ammunitionData);
      setRangeVisits(visitsData);
      setCurrency(currencyData || "USD");
      setPeriodId(isPeriodId(periodData) ? periodData : "6M");
    } catch (err) {
      handleError(err, "Stats.load", {
        isUserFacing: true,
        userMessage: "Failed to load statistics.",
      });
      setError("Failed to load statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const today = useMemo(() => startOfDay(new Date()), []);

  const index = useMemo(
    () => buildActivityIndex({ firearms, ammunition, rangeVisits }),
    [firearms, ammunition, rangeVisits]
  );

  const period = useMemo(
    () => resolvePeriod(periodId, today, index),
    [periodId, today, index]
  );

  const activity = useMemo(
    () => filterActivity(index, { period, firearm: firearmSelection }, ammunition),
    [index, period, firearmSelection, ammunition]
  );

  const caliberRanking = useMemo(
    () => calculateRanking(activity.events, "calibers"),
    [activity.events]
  );

  const firearmOptions = useMemo(
    () =>
      [...index.firearmNames]
        .map(([id, label]) => ({ id, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [index]
  );

  const hidePurchased = firearmSelection.kind === "firearm";

  const onPeriodChange = (next: PeriodFilterId) => {
    setPeriodId(next);
    void storage.setStatsPeriod(next);
  };

  const onFirearmChange = (selection: FirearmSelection) => {
    setFirearmSelection(selection);
  };

  const onOpenVisit = (visitId: string) => {
    navigation.navigate("RangeVisitDetails", { id: visitId });
  };

  const viewAllTime = () => {
    setPeriodId("ALL");
    setFirearmSelection({ kind: "all" });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorDisplay errorMessage={error} onRetry={load} />;
  }

  const noVisitsAtAll = index.visits.length === 0;
  const noActivityInPeriod = !noVisitsAtAll && activity.visits.length === 0;

  return (
    <ScrollView
      className="flex-1 bg-terminal-bg"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View className="px-4">
        {noVisitsAtAll ? (
          <>
            <EmptyState
              title="NO SHOOTING DATA YET"
              message="Log a range visit to start building your activity statistics."
            />
            {ammunition.length > 0 ? (
              <CostStatsSection
                costs={activity.costs}
                currency={currency}
                hidePurchased={hidePurchased}
                hasFiredRounds={activity.summary.hasFiredRounds}
              />
            ) : null}
          </>
        ) : noActivityInPeriod ? (
          <>
            <StatsFilters
              period={periodId}
              onPeriodChange={onPeriodChange}
              firearmSelection={firearmSelection}
              onFirearmChange={onFirearmChange}
              firearmOptions={firearmOptions}
            />
            <EmptyState
              title="NO ACTIVITY IN THIS PERIOD"
              message="No range visits match this period and firearm filter."
              primaryAction={{
                caption: "VIEW ALL TIME",
                onPress: viewAllTime,
              }}
            />
          </>
        ) : (
          <>
            <StatsFilters
              period={periodId}
              onPeriodChange={onPeriodChange}
              firearmSelection={firearmSelection}
              onFirearmChange={onFirearmChange}
              firearmOptions={firearmOptions}
            />
            <StatsSummary summary={activity.summary} currency={currency} />
            <AmmoUsageSection
              timeline={activity.timeline}
              currency={currency}
              priceCoverage={activity.summary.priceCoverage}
              hasFiredRounds={activity.summary.hasFiredRounds}
            />
            <VisitCalendarSection
              daily={activity.daily}
              visits={activity.visits}
              events={activity.events}
              period={period}
              firearmSelection={firearmSelection}
              currency={currency}
              onOpenVisit={onOpenVisit}
            />
            <CostStatsSection
              costs={activity.costs}
              currency={currency}
              hidePurchased={hidePurchased}
              hasFiredRounds={activity.summary.hasFiredRounds}
            />
            <UsageRankingSection
              firearmRanking={activity.ranking}
              caliberRanking={caliberRanking}
              firearmSelected={firearmSelection.kind === "firearm"}
            />
            <ShootingRhythmSection rhythm={activity.rhythm} />
          </>
        )}
      </View>
    </ScrollView>
  );
};
