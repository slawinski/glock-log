# TriggerNote — Statistics Screen Redesign Specification

**Status:** Proposed  
**Scope:** Statistics screen only  
**Target:** TriggerNote mobile app (React Native / Expo)  
**Primary goal:** Replace the current siloed Firearms / Visits / Ammunition statistics tabs with one coherent activity dashboard that remains useful and readable as the user's dataset grows substantially.

---

## 1. Executive Summary

The Statistics screen should answer four questions quickly:

1. **How much am I shooting?**
2. **How often am I shooting?**
3. **What am I shooting most?**
4. **What is my ammunition usage costing me?**

The redesigned screen is centered around two primary visualizations:

- a **cumulative step graph** for ammunition usage;
- an **interactive calendar** for range visits.

Supporting sections provide:

- period totals;
- ammunition cost summaries;
- firearm / caliber usage ranking;
- shooting rhythm metrics.

The current separate `FIREARMS`, `VISITS`, and `AMMUNITION` tabs should be removed. Statistics should instead be derived from the relationships between firearms, visits, and ammunition.

The design must remain readable and performant with:

- years of history;
- thousands of range visits;
- dozens or hundreds of firearms;
- many calibers;
- thousands of ammunition lots;
- large numbers of historical ammunition-use records.

Large datasets are therefore a first-class design constraint, not an optimization to add later.

---

# 2. Product Principles

## 2.1 Activity first

Statistics should primarily describe **shooting activity**, not database contents.

Prefer:

- rounds fired;
- visits;
- shooting frequency;
- ammunition consumed;
- ammunition cost;
- firearm/caliber usage.

De-emphasize or remove metrics such as:

- most stocked caliber;
- most common firearm caliber;
- total number of firearm records.

Those values describe the collection more than the user's activity.

---

## 2.2 One coherent dashboard

All statistics must respond to the same global filters.

The user should never have to mentally reconcile different time ranges or firearm selections across sections.

---

## 2.3 Historical correctness

Past statistics must remain stable when current inventory changes.

Example:

- user buys 1,000 rounds for 1,000 PLN;
- user fires 500 rounds;
- current inventory becomes 500 rounds.

The historical unit price remains **1.00 PLN/round**, not `1000 / 500 = 2.00 PLN/round`.

Ammunition cost statistics must therefore use immutable historical price information, not current inventory quantity.

---

## 2.4 Scalable visual density

No visualization may assume a small dataset.

Charts must aggregate data automatically when the selected period would otherwise produce excessive visual density.

A user with 8 years and 2,000 visits should still see a meaningful chart without horizontal scrolling through thousands of points.

---

## 2.5 Mobile-first interaction

Essential information must never depend on hover.

Charts, calendar days, ranking rows, and filters must work by tap.

Touch targets should be approximately 44×44 px minimum.

---

# 3. Current-State Problems

The current implementation separates statistics into:

- Firearms;
- Visits;
- Ammunition.

This creates three problems.

### 3.1 Relationships are hidden

Interesting questions require combining datasets.

For example:

- ammunition cost per visit;
- rounds per firearm over time;
- most-used caliber;
- cost of ammunition fired;
- visit activity on calendar days.

These cannot be communicated well when each dataset is treated independently.

### 3.2 Current ammunition cost calculation is incorrect after consumption

The current ammunition statistics derive cost per round from:

```text
sum(amountPaid) / sum(currentQuantity)
```

Because `quantity` represents current inventory, consumption increases the apparent historical unit price.

This calculation must be removed from Statistics.

### 3.3 Current ammunition graph does not scale

The existing ammunition usage chart displays a limited set of monthly bars.

The replacement should:

- communicate cumulative shooting history;
- preserve periods of inactivity;
- support filtering;
- adapt automatically to long histories.

### 3.4 Current visit calendar is mostly decorative

The calendar currently highlights visit dates.

The redesign should make those dates interactive and allow the calendar to communicate visit intensity and visit detail.

---

# 4. Information Architecture

Remove the Statistics tab navigation.

The new screen is one vertically scrolling dashboard:

```text
STATISTICS

[ PERIOD FILTER ]
[ FIREARM FILTER ]

SUMMARY

AMMUNITION USAGE
[ ROUNDS | COST ]
<step graph>

RANGE VISITS
<calendar>
<selected-day detail>

COSTS
<cost metrics>

USAGE
[ FIREARMS | CALIBERS ]
<ranking>

SHOOTING RHYTHM
<secondary metrics>
```

Recommended section order is intentional:

1. context/filter;
2. immediate totals;
3. primary trend;
4. visit history;
5. financial context;
6. composition/ranking;
7. secondary insights.

---

# 5. Global Filters

## 5.1 Period filter

Display as a segmented control:

```text
[ 3M ] [ 6M ] [ YTD ] [ 1Y ] [ ALL ]
```

### Definitions

- `3M` — trailing 3 calendar months from today;
- `6M` — trailing 6 calendar months from today;
- `YTD` — January 1 of the current year through today;
- `1Y` — trailing 12 months from today;
- `ALL` — from earliest relevant visit/purchase through today.

### Default

Default to **6M**.

Reason:

- stable window regardless of current month;
- enough data to reveal patterns;
- substantially less likely than `ALL` to become visually dense.

If the user's entire history is shorter than 6 months, the visual result naturally represents all available data inside that window.

### Persistence

Persist the last selected period locally.

On returning to Statistics, restore the last selection.

---

## 5.2 Firearm filter

Below the period control:

```text
[ ALL FIREARMS ▾ ]
```

Single-select only in v1.

Options:

- All firearms;
- each firearm with historical activity.

### Historical firearms

A firearm should remain selectable if historical visits reference it, even if the firearm is archived.

If the application currently hard-deletes firearm records, Statistics must still preserve a usable historical label through snapshots or a fallback historical identity.

### Filter semantics

When a firearm is selected:

- **Rounds** = rounds fired through that firearm;
- **Visits** = visits in which that firearm appears;
- **Ammo used cost** = cost of ammunition fired through that firearm;
- step graph = only that firearm's usage;
- calendar = only visits containing that firearm;
- cost section = only firing-related cost attributable to that firearm;
- firearm usage ranking becomes redundant and should switch automatically to caliber breakdown, or hide the `FIREARMS` mode;
- shooting rhythm = rhythm for visits involving that firearm.

Purchase expenditure is not firearm-specific unless the data model explicitly assigns purchased ammunition to a firearm. Therefore `AMMO PURCHASED` must either:
- remain an all-ammunition metric and be visually labeled as such; or
- be hidden when a firearm filter is active.

**Recommended:** hide `AMMO PURCHASED` when filtering by firearm to avoid implying attribution that does not exist.

---

# 6. Summary Section

Display a compact 2×2 metric grid.

Example:

```text
4,820             27
ROUNDS            VISITS

2,146 PLN         179
AMMO USED         AVG RDS / VISIT
```

## 6.1 Rounds

Total rounds fired during the selected period/filter.

Source:

```text
sum(rangeVisit.ammunitionUsed[*].rounds)
```

after applying period and firearm filters.

---

## 6.2 Visits

Number of matching range visits.

A visit counts once regardless of how many firearms were used.

When a firearm is selected, a visit counts if that firearm was used during the visit.

---

## 6.3 Ammo Used

Known monetary value of ammunition fired during the selected period.

Formula for each ammunition usage entry:

```text
rounds × pricePerRoundSnapshot
```

Then sum across matching usage entries.

If pricing coverage is 100%:

```text
2,146 PLN
AMMO USED
```

If pricing coverage is incomplete:

```text
2,146+ PLN
AMMO USED
84% PRICED
```

The `+` indicates that the known value is a lower bound.

Never treat missing price as zero while presenting the result as a complete total.

If no fired rounds have known pricing:

```text
—
AMMO USED
NO PRICE DATA
```

---

## 6.4 Average Rounds / Visit

Formula:

```text
total matching rounds / matching visits
```

Display as a whole number by default.

Example:

```text
179
AVG RDS / VISIT
```

If there are zero matching visits:

```text
—
AVG RDS / VISIT
```

---

# 7. Ammunition Usage Step Graph

This is the primary visualization on the screen.

## 7.1 Purpose

Communicate:

- accumulated shooting volume;
- frequency of shooting;
- inactive periods;
- bursts of activity;
- long-term changes in activity.

---

## 7.2 Graph semantics

The graph is **cumulative within the selected period**.

At the left boundary:

```text
value = 0
```

Every activity bucket adds to the cumulative total.

Flat horizontal sections represent no shooting.

Vertical changes represent ammunition consumption.

Example:

```text
5000 ┤                         ┌────
     │                    ┌────┘
4000 ┤              ┌─────┘
     │              │
3000 ┤        ┌─────┘
     │    ┌───┘
2000 ┤────┘
     └────────────────────────────
      JAN   MAR   MAY   JUL   SEP
```

Do **not** plot lifetime cumulative totals underneath a shorter selected range.

Example: when viewing `6M`, start the visible six-month series at zero rather than starting at the lifetime total accumulated before the six-month boundary.

This makes the graph directly comparable to the summary totals.

---

## 7.3 Mode toggle

Above the graph:

```text
[ ROUNDS | COST ]
```

### ROUNDS

Y-axis = cumulative rounds fired.

### COST

Y-axis = cumulative known value of fired ammunition.

If price coverage is incomplete:

- label the series as `KNOWN COST`;
- display pricing coverage near the chart;
- use the `+` convention on final totals;
- never interpolate missing price values.

Example:

```text
KNOWN COST · 84% PRICED
```

---

# 8. Step Graph Scalability Rules

The graph must not draw one permanent visual step for every visit when history becomes dense.

## 8.1 Canonical event data

The analytics layer should first normalize visits into daily activity records:

```ts
type DailyShootingActivity = {
  date: string;
  rounds: number;
  knownCost: number;
  pricedRounds: number;
  totalRounds: number;
  visitCount: number;
};
```

Multiple visits on the same calendar date are combined into one daily record for graph purposes.

The source visit records remain unchanged.

---

## 8.2 Adaptive display resolution

Select the graph bucket automatically according to selected span.

Recommended defaults:

| Selected span | Display bucket |
|---|---|
| ≤ 92 days | day |
| 93–370 days | week |
| 371–1,095 days | month |
| > 1,095 days | quarter |

Additionally enforce a target of **no more than ~120 plotted activity buckets**.

If the selected resolution would exceed that target, escalate one level:

```text
day → week → month → quarter → year
```

### Examples

- 3 months → daily;
- 6 months → weekly;
- 1 year → weekly;
- 2 years → monthly;
- 8 years → quarterly;
- exceptionally long datasets → yearly if required.

This is display aggregation only.

All totals, calendar details, ranking calculations, and underlying records retain full precision.

---

## 8.3 Aggregated cumulative steps

For each display bucket:

```text
bucketRounds = sum(rounds in bucket)
bucketKnownCost = sum(known cost in bucket)
```

The step graph adds the bucket total to the prior cumulative total.

Tooltips must reveal that aggregation occurred.

Example:

```text
AUG 3–9
430 ROUNDS
2 VISITS
384.20 PLN KNOWN COST
100% PRICED
```

For a monthly bucket:

```text
JUNE 2025
1,240 ROUNDS
7 VISITS
```

The user should never mistake a weekly or monthly step for a single visit.

---

## 8.4 Axis label density

Regardless of data volume:

- maximum ~5–7 visible X-axis labels;
- maximum ~4–5 Y-axis labels;
- use compact numeric formatting where useful;
- do not render a text label for every data bucket;
- do not rotate dozens of X-axis labels;
- do not require horizontal scrolling for the primary chart.

Examples:

```text
1K
2K
5K
12.4K
```

Currency formatting should use the app's configured currency format.

---

## 8.5 Interaction

Mobile interaction:

- tap graph to select nearest display bucket;
- selected bucket remains highlighted until another bucket is selected;
- render a compact detail row/card below or above the graph;
- no information may require hover.

Optional later enhancement:

- tap selected bucket to drill into its visits.

Not required for v1.

---

## 8.6 No mandatory zoom/pan

Pinch-to-zoom must **not** be required to make the graph readable.

Adaptive aggregation is the primary scalability mechanism.

Zoom/pan can be added later as an enhancement, but should not be necessary for normal use.

---

# 9. Range Visit Calendar

The calendar is the second major visualization.

## 9.1 Default state

Show one month at a time.

If the currently selected period includes today:

- open on the current month.

If the selected period does not contain the current month:

- open on the most recent month containing matching activity.

For `ALL`, current month remains the preferred initial month unless there is no recent data, in which case open the latest month with a visit.

---

## 9.2 Navigation

Provide:

- previous month;
- next month;
- tappable month/year title.

Tapping month/year opens a fast month/year picker.

This is required for large datasets.

A user with 8 years of data must not need to press "previous month" 80 times.

Example picker:

```text
YEAR
[ 2022 | 2023 | 2024 | 2025 | 2026 ]

MONTH
JAN FEB MAR APR MAY JUN
JUL AUG SEP OCT NOV DEC
```

Only years containing matching activity need to be emphasized.

---

## 9.3 Visit marking

A calendar day with activity must be clearly distinguishable from a day without activity.

Recommended encoding:

- visit marker/dot;
- optional three-level activity intensity;
- optional small count when multiple visits occurred that day.

Do not attempt to render individual firearm/ammunition icons directly in calendar cells.

Calendar cells must remain legible at narrow mobile widths.

---

## 9.4 Activity intensity

If intensity is used, calculate it from matching rounds fired.

Use three relative levels within the selected filtered dataset:

- low;
- medium;
- high.

Recommended implementation:

- calculate active-day round totals;
- derive approximately 33rd and 66th percentile thresholds;
- assign each active date to one of three levels.

This avoids arbitrary fixed round thresholds that may be inappropriate for users with very different shooting disciplines.

The calendar should expose a compact legend if the visual treatment is not self-explanatory.

---

## 9.5 Selected day behavior

Tap an active date to display detail directly below the calendar.

Example:

```text
12 SEP 2026
WITU
──────────────────────────
CZ P-09 C        150 RDS
AR-15            120 RDS
──────────────────────────
270 ROUNDS
164.20 PLN+
92% PRICED
```

If multiple visits occurred that day:

```text
12 SEP 2026 · 2 VISITS
```

Then display each visit as a compact tappable row.

A row may include:

- location;
- total rounds;
- known ammo cost;
- firearm count.

Tap navigates to the existing visit details screen.

---

## 9.6 Calendar scalability

The calendar inherently scales because only one month is rendered at a time.

Large-dataset requirements:

- do not pre-render years of calendar months;
- calculate visible-month markers from indexed/aggregated data;
- provide direct year/month jump;
- navigation must remain responsive regardless of total historical visit count.

---

# 10. Costs Section

The Costs section should distinguish **purchase expenditure** from **consumption cost**.

Example:

```text
COSTS

AMMO PURCHASED             3,840 PLN
AMMO FIRED                 2,146 PLN
AVG COST / ROUND             0.89 PLN
AVG AMMO COST / VISIT       79.48 PLN
CURRENT STOCK VALUE        1,694 PLN
PRICE COVERAGE                  94%
```

---

## 10.1 Ammo Purchased

Money spent on ammunition lots with `datePurchased` inside the selected period.

Formula:

```text
sum(ammunition.amountPaid)
```

for matching purchase dates.

This is a cash-spending metric.

It is **not** the same as the value of ammunition fired.

### Important historical dependency

This metric is only historically reliable if ammunition purchase records are preserved.

If ammunition lots can be hard-deleted, old purchase expenditure disappears.

Recommended product rule:

> Ammunition lots that have historical purchase or visit references should be archived, not destructively deleted.

If hard deletion must remain possible, a separate immutable ammunition-purchase history would be required for fully reliable long-term expenditure statistics.

---

## 10.2 Ammo Fired

Known value of ammunition consumed in matching visits.

Formula:

```text
sum(rounds × pricePerRoundSnapshot)
```

This is the primary cost metric.

---

## 10.3 Average Cost / Round

Use only priced fired rounds:

```text
known fired cost / priced fired rounds
```

Do **not** divide by all fired rounds if some rounds have unknown prices.

Always display price coverage nearby when coverage < 100%.

---

## 10.4 Average Ammo Cost / Visit

Recommended definition:

```text
known fired cost / visits containing at least one fired round
```

If some visit ammunition is unpriced, the value is known-cost-only and must be accompanied by price coverage.

---

## 10.5 Current Stock Value

Current estimated value of ammunition inventory:

```text
sum(currentQuantity × pricePerRound)
```

for all active ammunition lots with known price.

This metric is **not period-filtered**, because inventory is a present-state metric.

To avoid ambiguity, visually label it:

```text
CURRENT STOCK VALUE
```

and optionally:

```text
CURRENT · NOT PERIOD FILTERED
```

If this inconsistency with the global period filter feels undesirable during implementation, omit Stock Value from v1 rather than incorrectly period-filtering it.

**Recommended v1 decision:** include it, but explicitly mark it as current.

---

## 10.6 Price Coverage

Price coverage for fired ammunition:

```text
priced fired rounds / total fired rounds × 100
```

Example:

```text
94%
PRICE COVERAGE
```

Coverage is based on rounds, not number of ammunition lots.

Reason:

100 unpriced rounds matter more than one unpriced lot from which zero rounds were fired.

---

# 11. Required Historical Pricing Model

## 11.1 Existing issue

Ammunition currently contains:

```ts
quantity
amountPaid
pricePerRound?
```

`quantity` is mutable current inventory.

Therefore:

```text
amountPaid / quantity
```

must never be used to reconstruct historical purchase price after consumption.

---

## 11.2 Price per round

For newly created ammunition lots, `pricePerRound` should be calculated and persisted when purchase data is entered.

Conceptually:

```text
pricePerRound = amountPaid / purchasedQuantity
```

This requires access to the quantity at purchase time.

### Recommended schema addition

Add immutable original purchase quantity:

```ts
purchasedQuantity: number
```

Example ammunition record:

```ts
{
  id: string;
  caliber: string;
  brand: string;
  grain: string;

  purchasedQuantity: number;
  quantity: number;

  datePurchased: string;
  amountPaid: number;
  pricePerRound?: number;

  ...
}
```

`purchasedQuantity` must not decrease as rounds are consumed.

---

## 11.3 Visit ammunition snapshots

Current visit usage conceptually stores:

```ts
{
  ammunitionId: string;
  rounds: number;
}
```

Extend it to preserve historical context.

Recommended shape:

```ts
{
  ammunitionId: string;
  rounds: number;

  pricePerRoundSnapshot?: number;
  caliberSnapshot?: string;
  brandSnapshot?: string;
  grainSnapshot?: string;
}
```

At minimum, Statistics requires:

```ts
pricePerRoundSnapshot?: number
caliberSnapshot?: string
```

Brand/grain snapshots are recommended because they improve future historical reporting and make visit history resilient to ammunition edits/deletion.

---

## 11.4 Snapshot rule

When a visit is saved:

```text
pricePerRoundSnapshot = ammunition.pricePerRound at that time
```

The snapshot becomes authoritative for that visit.

Later edits to the ammunition lot must not retroactively change historical visit cost.

This matches the application's existing historical-snapshot philosophy used elsewhere.

---

## 11.5 Historical fallback order

For existing visits created before price snapshots:

1. use `pricePerRoundSnapshot` when present;
2. otherwise use the referenced ammunition lot's stored `pricePerRound`;
3. otherwise price is unknown.

Never fall back to:

```text
amountPaid / currentQuantity
```

because that becomes incorrect after ammunition is consumed.

---

## 11.6 Legacy data migration

For ammunition records where:

```text
pricePerRound exists
```

retain the value.

For records where `pricePerRound` is absent:

- do not attempt to infer it from current `quantity` unless the application can prove that quantity is still the original purchased quantity;
- mark historical usage of that lot as unpriced.

If a reliable original purchase quantity can be reconstructed from import/version metadata, migration may calculate it.

Otherwise correctness is more important than fake precision.

---

# 12. Usage Ranking

Section:

```text
USAGE

[ FIREARMS | CALIBERS ]
```

Display horizontal bars.

Example:

```text
CZ P-09 C       ████████████████  2,480
AR-15           ██████████        1,620
S&W 586         ████                520
SHOTGUN         ██                  200
```

Caliber mode:

```text
9×19            ████████████████  3,100
5.56            ████████          1,300
.357            ███                520
12 GA           █                  200
```

---

# 13. Ranking Scalability

Never render an arbitrarily long bar chart.

Default view:

- Top 5 categories;
- optional `OTHER` aggregate.

Example with many firearms:

```text
CZ P-09 C       ███████████  2,480
AR-15           ███████      1,620
S&W 586         ███            520
MOSSBERG 500    ██             390
10/22           ██             340
OTHER           ████           910
```

## 13.1 `OTHER`

`OTHER` represents the combined value of all categories outside the top 5.

Only show `OTHER` when there are more than 5 categories.

---

## 13.2 View all

Provide:

```text
VIEW ALL >
```

This opens a modal/bottom sheet with a virtualized, searchable/sortable ranking list.

Do not expand 50–100 rows inline on the Statistics screen.

Default sorting:

```text
rounds descending
```

Each row:

```text
1. CZ P-09 C       2,480 RDS · 31%
2. AR-15           1,620 RDS · 20%
...
```

---

## 13.3 Firearm filter interaction

When one firearm is globally selected:

- disable/hide `FIREARMS` ranking;
- show `CALIBERS` as the only relevant breakdown.

Reason:

a one-item firearm ranking is not useful.

---

# 14. Shooting Rhythm

This section communicates cadence rather than totals.

Example:

```text
SHOOTING RHYTHM

AVG BETWEEN VISITS          12 DAYS
ROUNDS / MONTH                  402
MOST ACTIVE MONTH         JUNE 2026
LONGEST GAP                   41 DAYS
```

---

## 14.1 Average Between Visits

Calculate differences between chronologically sorted matching visit dates.

Formula:

```text
mean(date[i] - date[i - 1])
```

If fewer than 2 matching visits:

```text
—
```

---

## 14.2 Rounds / Month

Recommended definition:

```text
total rounds / number of calendar-month equivalents in selected period
```

For `ALL`, use elapsed time between earliest matching visit and today, but do not count time before the user's first matching visit.

Alternative implementation acceptable:

- aggregate by calendar month;
- average over months between first and last relevant month, including zero-activity months.

The latter better represents shooting cadence and is preferred.

---

## 14.3 Most Active Month

Rank calendar months by matching rounds fired.

Display month and year:

```text
JUNE 2026
```

Do not use only the month name (`June`) because multi-year datasets would become ambiguous.

Tie-breaker:

1. greater rounds;
2. greater visit count;
3. most recent month.

---

## 14.4 Longest Gap

Maximum number of days between consecutive matching visits inside the relevant history.

For filtered periods, avoid counting an artificial gap from the filter's left boundary to the first visit.

Only actual visit-to-visit intervals count.

---

# 15. Removed / De-emphasized Metrics

Remove from primary Statistics:

- most stocked caliber;
- most common firearm caliber;
- raw firearm count;
- raw ammunition inventory round total as a headline activity metric.

### Most visited location

Do not show as a primary KPI.

It may later appear in a dedicated `RANGES` or `LOCATIONS` insight view.

Reason:

location frequency is secondary to shooting activity and consumes valuable mobile space.

---

# 16. Cross-Filtering Rules

All activity-derived sections must use one normalized filtered event set.

Pseudo-flow:

```text
all visits
    ↓ period filter
period visits
    ↓ firearm filter
matching visits
    ↓
summary
step graph
calendar
fired cost
usage breakdown
shooting rhythm
```

Purchase spending is the only intentional exception because ammunition purchases are not necessarily attributable to a firearm.

Current stock value is also intentionally not period-filtered.

These exceptions must be communicated in the UI rather than silently violating filter expectations.

---

# 17. Data Normalization Layer

Do not let each UI section independently re-scan raw storage and implement slightly different statistics.

Create a statistics/analytics domain layer.

Suggested structure:

```text
src/
  analytics/
    stats/
      buildActivityIndex.ts
      filterActivity.ts
      aggregateTimeline.ts
      calculateSummary.ts
      calculateCosts.ts
      calculateRanking.ts
      calculateRhythm.ts
      types.ts
```

Exact filenames are flexible.

The important requirement is separation between:

- raw storage;
- normalized analytics data;
- presentation components.

---

## 17.1 Normalized visit event

Suggested internal representation:

```ts
type ShootingUsageEvent = {
  visitId: string;
  date: string;
  location: string;

  firearmId: string;
  firearmName: string;

  ammunitionId?: string;
  caliber: string;

  rounds: number;

  pricePerRound?: number;
  knownCost?: number;
};
```

Generate this representation once from visit records and related storage.

It becomes the canonical input for activity statistics.

---

# 18. Large Dataset Performance Requirements

## 18.1 Complexity target

A full analytics rebuild should be approximately linear in raw dataset size:

```text
O(visits + ammunition usage records + ammunition lots + firearms)
```

Avoid nested full-array lookups such as:

```text
for every visit
  for every ammunition usage
    find ammunition by scanning whole ammunition array
```

Build lookup maps first:

```ts
Map<ammunitionId, Ammunition>
Map<firearmId, Firearm>
```

---

## 18.2 Build indexes once

Useful indexes:

```ts
visitsByDate
visitsByMonth
usageByFirearm
usageByCaliber
ammunitionById
firearmById
```

The exact persistent/cache design is implementation-dependent.

At minimum, analytics functions should avoid repeated expensive recomputation during one render.

---

## 18.3 Memoization

Recalculate derived statistics when relevant source data or filters change, not on every render.

Suggested boundaries:

- normalized event index depends on source storage data;
- filtered events depend on index + selected filters;
- chart aggregation depends on filtered events + period span;
- visible calendar month depends on filtered date index + visible month.

---

## 18.4 Point-count budget

Primary step graph:

```text
target ≤ 120 activity buckets
```

X-axis labels:

```text
target ≤ 7
```

Ranking chart:

```text
≤ 6 displayed bars
(top 5 + Other)
```

Calendar:

```text
1 month rendered
```

These are UX budgets as much as performance budgets.

---

## 18.5 No silent truncation

Aggregation is allowed.

Silent truncation is not.

Do not implement:

```text
take last 100 visits and ignore earlier ones
```

or:

```text
slice last 12 months
```

when `ALL` is selected.

All matching data must contribute to totals.

Only the **visual resolution** may be reduced.

---

## 18.6 Stress-test dataset

Statistics should be explicitly tested with at least:

### Small

- 2 firearms;
- 3 ammo lots;
- 5 visits.

### Normal

- 8 firearms;
- 30 ammo lots;
- 100 visits;
- 2 years.

### Large

- 50 firearms;
- 500 ammo lots;
- 2,000 visits;
- 10 years;
- several ammunition usages per visit.

### Extreme synthetic

- 200 firearms;
- 5,000 ammo lots;
- 10,000 visits;
- 20+ years.

The extreme dataset does not need to represent common real-world use. It exists to reveal algorithms or rendering logic that scales poorly.

---

# 19. Empty States

Avoid replacing the entire Statistics screen with one generic empty message when only one data type is missing.

## 19.1 No visits

Show:

```text
NO SHOOTING DATA YET

Log a range visit to start building
your activity statistics.
```

Hide:

- graph;
- calendar activity;
- usage ranking;
- rhythm.

Purchase/stock cost statistics may still appear if ammunition purchases exist.

---

## 19.2 Visits but no ammunition usage

Show visit calendar and visit count.

Rounds-based sections show:

```text
NO ROUND DATA
```

Do not assume zero rounds means confirmed zero shooting if ammunition usage was simply not recorded.

---

## 19.3 No price data

Rounds/visits continue to work fully.

Cost section:

```text
NO AMMO PRICE DATA

Add a price per round to ammunition
to enable firing-cost statistics.
```

Do not block the rest of Statistics.

---

## 19.4 Partial price data

Show known values plus coverage.

Example:

```text
1,284+ PLN
AMMO FIRED

72% PRICED
```

---

## 19.5 Filter returns no results

Keep controls visible.

Show:

```text
NO ACTIVITY IN THIS PERIOD
```

Provide one-tap recovery where appropriate:

```text
VIEW ALL TIME
```

---

# 20. Loading and Error States

## 20.1 Loading

Use the application's existing loading treatment.

Avoid showing stale metric values with loading chart placeholders that could be mistaken for current results.

---

## 20.2 Error

Use existing global error handling.

If the analytics calculation fails after storage loaded successfully, show:

```text
STATISTICS COULD NOT BE CALCULATED
[ RETRY ]
```

Do not crash the entire app.

---

# 21. Visual Design

Maintain TriggerNote's existing terminal/CRT identity.

However, data visualizations prioritize legibility over decoration.

## Requirements

- high-contrast graph line;
- restrained grid lines;
- minimal chart chrome;
- no unnecessary gradients;
- no decorative 3D effects;
- no pie charts;
- no tiny legends;
- no overlapping labels;
- no dense vertical tick text;
- no blinking/animated data points.

CRT effects must never make fine chart geometry unreadable.

If necessary, charts may locally reduce CRT/noise intensity while remaining visually consistent with the app.

---

# 22. Accessibility

## 22.1 Color independence

Calendar intensity and chart states must not rely only on color.

Use combinations such as:

- fill intensity + marker;
- line + selected indicator;
- text labels.

---

## 22.2 Screen readers

Summary metrics should expose meaningful labels, e.g.:

```text
"Rounds fired, 4,820"
"Range visits, 27"
"Known ammunition cost, 2,146 Polish zloty, 84 percent price coverage"
```

Chart must have an accessible summary.

Example:

```text
"Ammunition usage, last six months.
4,820 rounds fired across 27 visits."
```

Individual chart points do not need to expose hundreds of focusable elements.

---

## 22.3 Touch targets

Period tabs, toggles, month navigation, filter controls, and selected calendar days should meet approximately 44×44 px targets.

---

# 23. Responsive Behavior

Primary target is phone portrait.

At narrow widths:

- summary remains 2×2;
- graph occupies full content width;
- calendar remains seven equal columns;
- long firearm names truncate gracefully;
- metric values must not force horizontal page scrolling.

On larger widths/tablets:

- do not simply stretch chart labels infinitely;
- increase chart width where useful;
- sections may use two-column composition later, but this is not required in v1.

---

# 24. Recommended Component Structure

Possible component hierarchy:

```text
StatsScreen
├── StatsFilters
│   ├── PeriodSelector
│   └── FirearmSelector
├── StatsSummary
│   └── MetricCard × 4
├── AmmoUsageSection
│   ├── MetricToggle
│   ├── StepChart
│   └── ChartSelectionDetails
├── VisitCalendarSection
│   ├── MonthNavigator
│   ├── ActivityCalendar
│   └── SelectedDayVisits
├── CostStatsSection
├── UsageRankingSection
│   ├── BreakdownToggle
│   └── HorizontalRanking
└── ShootingRhythmSection
```

This structure is illustrative, not mandatory.

---

# 25. Step Chart Implementation Recommendation

The existing application currently includes `react-native-chart-kit`, but the new chart requires:

- true stepped geometry;
- custom aggregation;
- tap selection;
- strict control over label density;
- predictable performance with up to ~120 rendered buckets.

Recommended approach:

**build the step chart as a focused custom SVG visualization using the already available `react-native-svg` dependency**, rather than forcing the behavior through the existing bar-chart abstraction.

Benefits:

- exact step path;
- minimal dependency impact;
- full control over interaction;
- predictable visual density;
- easy terminal-theme integration.

The analytics layer should produce display-ready buckets; the SVG component should not perform business calculations.

---

# 26. Date Handling

Statistics are calendar-oriented.

Use consistent local-calendar date handling.

Avoid converting date-only concepts through UTC in ways that can move a visit into a neighboring day.

For grouping:

```text
visit → user's local calendar date
```

For weekly/monthly/quarterly buckets, use the same timezone/calendar convention throughout.

---

# 27. Metric Definitions Reference

| Metric | Definition |
|---|---|
| Rounds | Sum of matching fired rounds |
| Visits | Count of matching range visits |
| Ammo Used / Ammo Fired | Known monetary value of matching fired rounds |
| Avg Rds / Visit | Matching rounds ÷ matching visits |
| Ammo Purchased | Purchase amount for ammo lots purchased during selected period |
| Avg Cost / Round | Known fired cost ÷ priced fired rounds |
| Avg Ammo Cost / Visit | Known fired cost ÷ matching visits containing fired rounds |
| Current Stock Value | Current quantity × known unit price |
| Price Coverage | Priced fired rounds ÷ all fired rounds |
| Avg Between Visits | Mean interval between consecutive matching visits |
| Rounds / Month | Average monthly rounds including inactive months between relevant boundaries |
| Most Active Month | Calendar month with highest matching rounds |
| Longest Gap | Longest interval between consecutive matching visits |

---

# 28. Data Integrity Rules

1. Negative rounds are invalid.
2. Negative prices are invalid.
3. `pricePerRoundSnapshot` may be absent, but must never be silently interpreted as zero.
4. Historical price snapshots are immutable after a visit is saved, except through an explicit user edit to that visit.
5. Editing a current ammunition lot must not retroactively change prior visit costs.
6. Deleting or archiving an ammunition lot must not erase historical visit usage.
7. Deleted/archived firearms must not erase historical activity.
8. All period totals must use the same inclusive/exclusive date-boundary convention.
9. `ALL` must include all historical matching activity; no visual convenience may silently omit older data.
10. Summary and graph totals must reconcile.

Example:

```text
final cumulative ROUNDS graph value
=
ROUNDS summary value
```

for the same active filters.

---

# 29. Acceptance Criteria

## 29.1 Navigation / layout

- [ ] Statistics opens as a single dashboard.
- [ ] Firearms / Visits / Ammunition statistics tabs are removed.
- [ ] Period selector is visible near the top.
- [ ] Firearm selector is visible near the top.
- [ ] All activity sections respond consistently to global filters.

---

## 29.2 Summary

- [ ] Rounds are correct for active filters.
- [ ] Visit count is correct for active filters.
- [ ] Ammo Used shows known fired-ammo cost.
- [ ] Average rounds per visit is correct.
- [ ] Partial pricing is explicitly indicated.

---

## 29.3 Step graph

- [ ] Graph uses stepped cumulative geometry.
- [ ] Graph begins at zero for the selected period.
- [ ] Flat segments represent inactivity.
- [ ] ROUNDS/COST toggle works.
- [ ] COST mode handles incomplete pricing.
- [ ] Tap selects nearest bucket.
- [ ] Selected bucket displays date span, rounds, and visit count.
- [ ] Visual aggregation changes automatically for long ranges.
- [ ] Graph normally renders no more than ~120 activity buckets.
- [ ] X-axis renders no more than ~7 meaningful labels.
- [ ] `ALL` includes all matching history even when visual buckets are aggregated.

---

## 29.4 Calendar

- [ ] Visit dates are clearly marked.
- [ ] Tapping a visit date shows matching visit details.
- [ ] Multiple same-day visits are handled.
- [ ] Month navigation works.
- [ ] Month/year quick-jump works.
- [ ] Firearm filtering updates calendar markers.
- [ ] Calendar renders one visible month rather than years of nodes.

---

## 29.5 Cost calculations

- [ ] No cost metric uses `amountPaid / currentQuantity`.
- [ ] New ammunition lots persist reliable unit price data.
- [ ] New visit usages snapshot unit price where available.
- [ ] Historic visit cost does not change when current ammo quantity changes.
- [ ] Missing pricing does not count as zero.
- [ ] Price coverage is calculated by fired rounds.
- [ ] Purchase cost and fired cost are visibly distinguished.

---

## 29.6 Rankings

- [ ] FIREARMS breakdown ranks by rounds.
- [ ] CALIBERS breakdown ranks by rounds.
- [ ] Default chart shows top 5 plus Other at most.
- [ ] Large numbers of categories do not create a huge inline chart.
- [ ] View All uses a scalable/virtualized list.

---

## 29.7 Rhythm

- [ ] Average between visits uses actual visit-to-visit intervals.
- [ ] Most active month includes year.
- [ ] Longest gap uses consecutive matching visits.
- [ ] Rounds/month includes inactive months within the relevant activity span.

---

## 29.8 Large datasets

- [ ] 2,000-visit test dataset remains visually readable.
- [ ] 10,000-visit synthetic dataset does not cause pathological render time or memory use.
- [ ] Graph does not attempt to render 10,000 points.
- [ ] Calendar navigation remains responsive.
- [ ] Rankings remain bounded.
- [ ] No totals silently discard old records.
- [ ] Filter changes do not cause obviously repeated full nested scans of all datasets.

---

# 30. Test Cases

## Case A — simple history

Given:

- 2 visits;
- 100 rounds each;
- all ammunition priced at 1 PLN/round.

Expected:

```text
ROUNDS = 200
VISITS = 2
AMMO USED = 200 PLN
PRICE COVERAGE = 100%
```

Final step-graph value:

```text
200
```

---

## Case B — inventory decreases

Given:

- ammunition purchased: 1,000 rounds;
- amount paid: 1,000 PLN;
- unit price: 1 PLN;
- current quantity after shooting: 500;
- 500 historical fired rounds.

Expected:

```text
AVG COST / ROUND = 1 PLN
AMMO FIRED = 500 PLN
```

Must **not** become:

```text
2 PLN / round
```

---

## Case C — partial pricing

Given:

- 100 fired rounds at 1 PLN;
- 100 fired rounds with unknown price.

Expected:

```text
ROUNDS = 200
AMMO FIRED = 100+ PLN
PRICE COVERAGE = 50%
AVG COST / PRICED ROUND = 1 PLN
```

---

## Case D — same-day visits

Given:

- visit A: 100 rounds on September 10;
- visit B: 200 rounds on September 10.

Expected graph daily activity:

```text
September 10 = +300 rounds
2 visits
```

Calendar:

```text
September 10 marked as activity
selected detail shows 2 visits
```

---

## Case E — large history

Given:

- 8 years;
- 2,000 visits.

With `ALL` selected:

- chart uses quarterly display aggregation unless point-density logic allows finer;
- all 2,000 visits contribute to totals;
- graph is not horizontally scrollable by necessity;
- selected quarter reports aggregated rounds and visit count;
- calendar can jump directly to any active year/month.

---

## Case F — firearm filter

Given:

Visit 1:

```text
Gun A = 100 rounds
Gun B = 50 rounds
```

Visit 2:

```text
Gun B = 150 rounds
```

With `Gun A` selected:

```text
ROUNDS = 100
VISITS = 1
```

With `Gun B` selected:

```text
ROUNDS = 200
VISITS = 2
```

With `ALL FIREARMS`:

```text
ROUNDS = 300
VISITS = 2
```

---

## Case G — archived firearm

Given:

- firearm was used in historical visits;
- firearm is later archived.

Expected:

- historical totals unchanged;
- historical calendar visits remain;
- firearm remains available as a historical Statistics filter when appropriate.

---

# 31. Out of Scope

Do not add to this Statistics redesign:

- accessory round-exposure statistics;
- parts-life analytics;
- cleaning interval analytics;
- maintenance alerts;
- accuracy/group-size analytics;
- competition scores;
- training drill performance;
- location maps;
- ammunition price-market comparison;
- external currency conversion.

These can be designed separately later.

The Statistics screen should first establish a strong, scalable activity model.

---

# 32. Future Extensions Enabled by This Architecture

The normalized activity layer should make these possible later without redesigning the screen foundation:

- comparison with previous period;
- yearly summaries;
- firearm-specific trends;
- caliber cost trends;
- range/location breakdown;
- ammunition brand breakdown;
- exportable annual report;
- activity streaks;
- personal milestones;
- accessory exposure overlays.

Do not implement these in v1 unless specifically scoped.

---

# 33. Final Recommended Screen

```text
STATISTICS

[ 3M | 6M | YTD | 1Y | ALL ]
[ ALL FIREARMS ▾ ]


4,820             27
ROUNDS            VISITS

2,146 PLN         179
AMMO USED         AVG RDS / VISIT


AMMUNITION USAGE
[ ROUNDS | COST ]

┌──────────────────────────────┐
│        cumulative step graph │
│        adaptive resolution   │
└──────────────────────────────┘

AUG 3–9
430 RDS · 2 VISITS


RANGE VISITS

< SEP 2026 >

 M  T  W  T  F  S  S
    1  2  3  4  5  6
 7  ●  9 10 11  ● 13
14 15 16 17 18 19 20
21  ● 23 24 25 26 27
28 29 30

12 SEP · WITU
270 RDS · 164.20 PLN


COSTS

AMMO PURCHASED              3,840 PLN
AMMO FIRED                  2,146 PLN
AVG COST / ROUND              0.89 PLN
AVG AMMO COST / VISIT        79.48 PLN
CURRENT STOCK VALUE         1,694 PLN
PRICE COVERAGE                   94%


USAGE
[ FIREARMS | CALIBERS ]

CZ P-09 C      █████████████  2,480
AR-15          █████████      1,620
S&W 586        ███              520
MOSSBERG 500   ██               390
10/22          ██               340
OTHER          ████             910

VIEW ALL >


SHOOTING RHYTHM

AVG BETWEEN VISITS           12 DAYS
ROUNDS / MONTH                   402
MOST ACTIVE MONTH          JUNE 2026
LONGEST GAP                    41 DAYS
```

---

# 34. Implementation Priority

## Phase 1 — analytics foundation

1. Correct ammunition pricing model.
2. Add/preserve `purchasedQuantity`.
3. Add visit ammunition snapshots.
4. Add historical fallback logic.
5. Build normalized shooting activity model.
6. Add filter + aggregation functions.
7. Add automated calculation tests.

## Phase 2 — primary dashboard

1. Remove existing statistics tabs.
2. Add global period/firearm filters.
3. Add summary.
4. Implement scalable step graph.
5. Implement interactive calendar.

## Phase 3 — supporting insights

1. Costs section.
2. Usage ranking.
3. Shooting rhythm.
4. Large-dataset performance validation.
5. Accessibility pass.
6. Edge-state polish.

---

# 35. Definition of Done

The redesign is complete when:

- the Statistics screen behaves as one unified activity dashboard;
- the step graph clearly communicates accumulated ammunition usage;
- the calendar makes historical range activity browsable;
- ammunition costs are historically correct;
- missing price information is transparent;
- all major sections respond coherently to filters;
- the screen remains legible with many years of data;
- visualizations aggregate rather than truncate;
- large category counts never create unbounded charts;
- statistics remain correct after ammunition inventory changes;
- automated tests cover calculations and large-dataset aggregation;
- no removed legacy statistic is needed to understand the user's shooting activity.

The intended outcome is a Statistics screen that becomes **more useful as the user's TriggerNote history grows**, rather than progressively less readable.
