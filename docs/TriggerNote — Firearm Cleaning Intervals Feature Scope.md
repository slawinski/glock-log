# TriggerNote — Firearm Cleaning Intervals

## Feature Scope

### Status

Proposed feature.

### Scope boundary

This specification covers **firearm cleaning tracking only**.

It explicitly excludes:

- firearm part/component life tracking;
- part replacement;
- wear estimation;
- accessory maintenance;
- ammunition maintenance considerations;
- malfunction tracking.

Those may consume the same firearm round-history infrastructure but are separate features.

---

# 1. Objective

Allow users to:

1. define cleaning intervals for individual firearms;
2. track two levels of firearm cleaning:
   - **Field Strip Cleaning**
   - **Complete Disassembly Cleaning**
3. see how many rounds have been fired since the relevant cleaning;
4. see how close a firearm is to its next configured cleaning interval;
5. log historical and current cleaning events;
6. receive warnings when cleaning is approaching or overdue;
7. have cleaning status automatically recalculate when historical range visits or cleaning events are added, edited, or deleted.

The feature should answer:

> When did I last clean this firearm, how many rounds have I fired since then, and when should I clean it again?

without requiring the user to manually maintain an odometer.

---

# 2. Core Product Model

Cleaning tracking belongs to a **firearm**.

Each firearm may independently configure:

```text
Field Strip Cleaning
    interval: N rounds

Complete Disassembly Cleaning
    interval: N rounds
```

Example:

```text
Glock 17

Field strip:
Every 500 rounds

Complete disassembly:
Every 3,000 rounds
```

These values are user-defined.

TriggerNote should **not hard-code manufacturer-independent cleaning recommendations as authoritative defaults**. Different firearms, ammunition, environments, use patterns, and manufacturer instructions make one universal interval inappropriate.

Cleaning tracking therefore starts disabled until configured.

---

# 3. Cleaning Types

## 3.1 Field Strip Cleaning

Represents normal routine cleaning performed after field stripping the firearm.

A Field Strip Cleaning event resets:

```text
rounds since field-strip cleaning
```

It does NOT reset:

```text
rounds since complete-disassembly cleaning
```

---

## 3.2 Complete Disassembly Cleaning

Represents the more extensive cleaning performed after substantially or completely disassembling the firearm beyond routine field stripping.

A Complete Disassembly Cleaning event resets:

```text
rounds since complete-disassembly cleaning
```

AND:

```text
rounds since field-strip cleaning
```

Rationale:

A complete cleaning inherently satisfies the lesser routine-cleaning requirement.

Therefore:

```text
FIELD_STRIP
    resets FIELD_STRIP

COMPLETE_DISASSEMBLY
    resets FIELD_STRIP
    resets COMPLETE_DISASSEMBLY
```

This hierarchy is fundamental business logic.

---

# 4. Cleaning Events

Each cleaning is stored as an immutable-style historical event associated with one firearm.

Conceptual model:

```ts
CleaningEvent {
  id: string
  firearmId: string

  type:
    | "field_strip"
    | "complete_disassembly"

  performedAt: string

  notes?: string

  createdAt: string
  updatedAt: string
}
```

The application should **not store `roundsSinceCleaning` on the event**.

Rounds since cleaning are calculated from range-visit history.

Optionally, a derived value may be displayed:

```text
Firearm mileage at cleaning: 4,820 rounds
```

but this should be calculated from historical activity rather than treated as an independently editable odometer.

---

# 5. Source of Truth for Round Counts

The source of truth remains:

```text
Range Visit
    ↓
Firearm usage
    ↓
Rounds fired
```

Cleaning tracking consumes this data.

It must not create another independent round counter.

For a firearm:

```text
Rounds since cleaning =
sum of rounds from qualifying range usage after the cleaning event
```

This has an important consequence:

## Historical data is dynamic

Adding, editing or deleting a historical range visit may change:

- total firearm mileage;
- rounds since last field strip;
- rounds since last complete disassembly;
- due/overdue state;
- progress toward cleaning intervals.

The system must recalculate automatically.

---

# 6. Temporal Semantics

Cleaning calculations are based on **event date/time**, not record creation time.

For example:

```text
January 1
Complete disassembly

January 10
Range visit
200 rounds

January 20
Range visit
300 rounds
```

Current status:

```text
Field strip: 500 rounds since cleaning
Complete:    500 rounds since cleaning
```

Now the user enters a forgotten cleaning:

```text
January 15
Field strip
```

TriggerNote recalculates:

```text
Field strip: 300 rounds
Complete:    500 rounds
```

The fact that the cleaning event was entered today is irrelevant.

Its `performedAt` date determines its position in history.

---

# 7. Retroactive Range Visit Handling

The same rule applies to backdated shooting activity.

Given:

```text
January 1
Field strip

January 20
Field strip
```

and initially only:

```text
January 25
Range visit — 100 rounds
```

the status is:

```text
100 rounds since field strip
```

If the user later adds:

```text
January 10
Range visit — 300 rounds
```

the current counter remains:

```text
100 rounds since field strip
```

because those 300 rounds occurred before the January 20 cleaning.

However, the January 20 cleaning event should now show:

```text
Previous interval: 300 rounds
```

Historical interval data changes accordingly.

---

# 8. Events Occurring on the Same Date

Because users may usually know the date but not the exact time, same-day cleaning and range visits create ambiguity.

Example:

```text
2026-09-07
Range visit — 250 rounds

2026-09-07
Field strip
```

Most likely interpretation:

> The firearm was cleaned after shooting.

Therefore TriggerNote should use the following default ordering when events contain only a date:

```text
range activity → cleaning
```

A cleaning recorded on the same calendar date as a range visit therefore includes that day's rounds in the interval that just ended.

After the cleaning:

```text
rounds since cleaning = 0
```

This matches the most common user workflow.

### Future enhancement

Exact event times could later remove this ambiguity, but they are not required for MVP.

---

# 9. Initial State / Existing Firearms

This is an important edge case.

An existing TriggerNote firearm may already have:

```text
4,700 total recorded rounds
```

but no cleaning history.

Enabling cleaning tracking must NOT automatically interpret this as:

```text
4,700 rounds since last cleaning
```

That would generate false overdue warnings.

When cleaning tracking is enabled for an existing firearm, TriggerNote should ask for a **tracking baseline**.

## Recommended UX

```text
START CLEANING TRACKING

Field strip interval
[ 500 ] rounds

Complete cleaning interval
[ 3000 ] rounds

Start counting from:

● Now
○ Existing cleaning history
```

### Start from now

Creates a cleaning-tracking baseline at the firearm's current historical position.

Conceptually:

```text
Rounds before this point are ignored for cleaning status.
```

No fake cleaning needs to appear in the visible history.

Example:

```text
Firearm total mileage: 4,700 rounds

Tracking enabled today.

Field strip:
0 / 500

Complete:
0 / 3,000
```

Future range visits begin increasing the counters.

---

## Existing cleaning history

User can instead add historical cleaning events.

Example:

```text
Last field strip:
2026-08-20

Last complete cleaning:
2026-05-12
```

TriggerNote then derives current round counts using historical range visits.

---

# 10. New Firearms

For a newly added firearm with zero recorded rounds:

```text
0 rounds total
```

cleaning tracking can naturally start from zero.

No synthetic cleaning event is necessary.

If the firearm already had usage before being entered into TriggerNote, the same baseline mechanism applies.

---

# 11. Unknown Previous Cleaning

The application must distinguish:

```text
0 rounds since cleaning
```

from:

```text
unknown rounds since cleaning
```

These are not equivalent.

If the user has no cleaning history and has not explicitly selected a baseline, show:

```text
Cleaning tracking not initialized
```

rather than:

```text
0 rounds
```

or:

```text
Overdue
```

TriggerNote should never pretend it knows historical maintenance state that the user has not supplied.

---

# 12. Interval Configuration

Each firearm has independent cleaning settings.

Conceptual model:

```ts
CleaningSettings {
  firearmId: string

  fieldStripEnabled: boolean
  fieldStripIntervalRounds?: number

  completeEnabled: boolean
  completeIntervalRounds?: number

  warningThresholdPercent: number

  trackingBaselineAt?: string

  createdAt: string
  updatedAt: string
}
```

Recommended default warning threshold:

```text
80%
```

Example:

```text
Field strip every 500 rounds

0–399     OK
400–499   DUE SOON
500+      DUE / OVERDUE
```

The user does not need to configure the warning percentage in MVP.

80% should be an application-level default.

A future advanced setting can expose it.

---

# 13. Status Model

Each interval has one of four user-visible states.

## Not configured

```text
—
```

Cleaning interval disabled or tracking not initialized.

---

## OK

Usage:

```text
< 80% of interval
```

Example:

```text
218 / 500 rounds
282 remaining
```

---

## Due Soon

Usage:

```text
>= 80%
AND
< 100%
```

Example:

```text
432 / 500 rounds
68 remaining
```

---

## Due

Usage:

```text
>= 100%
```

Example:

```text
527 / 500 rounds
27 overdue
```

Do not cap progress at 100%.

The user needs to know how overdue something is.

Therefore:

```text
712 / 500 rounds
212 overdue
```

is preferable to:

```text
500 / 500
100%
```

---

# 14. Progress Calculation

For a configured interval:

```ts
progress =
  roundsSinceQualifyingCleaning /
  intervalRounds
```

Status:

```ts
if progress < 0.8:
    OK

if progress >= 0.8 && progress < 1:
    DUE_SOON

if progress >= 1:
    DUE
```

Remaining rounds:

```ts
interval - roundsSinceCleaning
```

When negative:

```text
abs(remaining) overdue
```

---

# 15. Qualifying Cleaning Event

Finding the relevant reset event differs by interval.

## Field-strip counter

Find the latest:

```text
FIELD_STRIP
OR
COMPLETE_DISASSEMBLY
```

because either satisfies field-strip cleaning.

---

## Complete-disassembly counter

Find the latest:

```text
COMPLETE_DISASSEMBLY
```

only.

A field strip never affects this counter.

---

# 16. Example

Configuration:

```text
Field strip: 500 rounds
Complete: 2,000 rounds
```

History:

```text
Jan 01 — Complete cleaning
Jan 10 — 300 rounds
Jan 20 — Field strip
Feb 01 — 400 rounds
```

Current state:

```text
FIELD STRIP

400 / 500
80%
100 remaining
DUE SOON
```

because the January 20 field strip reset the field-strip counter.

Complete:

```text
COMPLETE CLEANING

700 / 2,000
35%
1,300 remaining
OK
```

because the January field strip did not reset the complete-cleaning counter.

---

# 17. Firearm Details UX

Cleaning status should live primarily on the firearm detail screen because it represents the state of that firearm.

Add a section:

```text
CLEANING
────────────────────────────

FIELD STRIP
432 / 500 RDS
68 RDS REMAINING
[DUE SOON]

COMPLETE
1,824 / 3,000 RDS
1,176 RDS REMAINING

LAST CLEANED
Field strip · Aug 24

[ LOG CLEANING ]
```

The exact visual design should follow TriggerNote's existing terminal aesthetic.

The information hierarchy should prioritize:

1. status;
2. rounds since cleaning;
3. next interval;
4. last cleaning date.

---

# 18. Quick Action

The most common action is:

```text
Log Cleaning
```

It should therefore be available directly from the firearm details screen.

Tap:

```text
[ LOG CLEANING ]
```

opens a lightweight form.

---

# 19. Log Cleaning Form

## Fields

### Firearm

Preselected when entered from firearm details.

If entered globally:

```text
Firearm *
```

selector required.

---

### Cleaning type

Required.

Large choice controls:

```text
○ FIELD STRIP
○ COMPLETE DISASSEMBLY
```

Do not use a tiny dropdown.

These two options have materially different business effects and should be obvious.

---

### Date

Required.

Default:

```text
Today
```

Historical dates allowed.

Future dates prohibited.

---

### Notes

Optional multiline text.

Examples:

```text
Normal cleaning after match.
Heavy carbon buildup.
Cleaned before competition.
```

Do not introduce structured fields for solvents, brushes, lubrication products, etc. in MVP.

They provide little value relative to complexity.

---

# 20. Save Confirmation

After saving:

```text
FIELD STRIP LOGGED

0 / 500 rounds
Next cleaning in 500 rounds
```

or:

```text
COMPLETE CLEANING LOGGED

Field strip: 0 / 500
Complete: 0 / 3000
```

The latter reinforces the hierarchical reset behavior.

---

# 21. Cleaning History

Firearm details should expose:

```text
CLEANING HISTORY
```

Example:

```text
SEP 07
COMPLETE DISASSEMBLY
1,742 rounds since previous complete cleaning

AUG 18
FIELD STRIP
486 rounds since previous qualifying cleaning

JUL 30
FIELD STRIP
521 rounds since previous qualifying cleaning
```

History is reverse chronological.

Each entry can be opened.

---

# 22. Cleaning Event Details

Display:

```text
FIELD STRIP

Glock 17 Gen 5

Date
Aug 18, 2026

Rounds since previous field-strip-level cleaning
486

Firearm mileage at event
5,842 rounds

Notes
Cleaned after IPSC match.
```

Actions:

```text
EDIT
DELETE
```

Derived round values are read-only.

---

# 23. Editing Cleaning Events

Users may edit:

```text
type
date
notes
```

Changing either type or date may alter the firearm's entire cleaning timeline.

Example:

Changing:

```text
Field Strip
```

to:

```text
Complete Disassembly
```

may reset both counters historically.

Therefore after editing:

```text
recalculate cleaning timeline
```

for the affected firearm.

No special warning is necessary for ordinary edits.

The resulting state simply becomes the new source of truth.

---

# 24. Deleting Cleaning Events

Deleting a cleaning event may substantially increase current rounds-since-cleaning.

Example:

```text
Jan 01 Complete
Jan 20 Field Strip
Feb 20 Field Strip
```

Deleting Feb 20 may move the current field-strip baseline back to Jan 20.

Deletion therefore requires confirmation:

```text
DELETE CLEANING EVENT?

Removing this event may change the firearm's
cleaning interval status.

[CANCEL] [DELETE]
```

After deletion, recalculate immediately.

---

# 25. Editing Historical Range Visits

The same recalculation must occur when range usage changes.

These operations may affect cleaning state:

```text
create range visit
edit visit date
change firearm
change rounds fired
delete range visit
```

Example:

Current:

```text
460 / 500 rounds
DUE SOON
```

User edits an old visit:

```text
+100 rounds
```

New state:

```text
560 / 500
60 overdue
```

No manual synchronization action should exist.

---

# 26. Cleaning Timeline Calculation

Cleaning should conceptually operate on a chronological firearm activity timeline.

Example:

```text
2026-01-01 CLEAN_COMPLETE
2026-01-10 SHOOT 250
2026-01-12 SHOOT 200
2026-01-15 CLEAN_FIELD
2026-01-25 SHOOT 400
2026-02-01 CLEAN_FIELD
2026-02-10 SHOOT 100
```

From this timeline the application derives:

```text
current field-strip interval
current complete-cleaning interval

rounds between historical cleanings

mileage at every cleaning
```

This approach is preferable to mutating counters whenever a visit is logged because retroactive edits remain correct automatically.

---

# 27. Notification / Alert Logic

Alerts should be driven by **state transitions**, not every time the application opens.

Relevant transitions:

```text
OK → DUE_SOON
DUE_SOON → DUE
OK → DUE
```

Example:

Before range visit:

```text
380 / 500
OK
```

Range visit:

```text
+70 rounds
```

After:

```text
450 / 500
DUE SOON
```

Generate alert:

```text
Glock 17 cleaning due soon
450 of 500 rounds since last field strip.
```

---

# 28. Overdue Alert

If a range visit crosses the limit:

```text
480 / 500
```

then:

```text
+100
```

becomes:

```text
580 / 500
```

Alert:

```text
Glock 17 field-strip cleaning due
580 rounds since last cleaning · 80 rounds overdue.
```

Do not emit both:

```text
Due soon
Due
```

for the same update.

Only emit the final resulting severity.

---

# 29. Avoid Notification Spam

Do not generate an alert every time another range visit is logged while the firearm remains overdue.

Example:

```text
520
580
640
700
```

should not produce four identical overdue alerts.

The initial transition to:

```text
DUE
```

generates the notification.

The firearm remains visibly overdue inside the app until cleaning is logged.

Optional future reminders can be a separate feature.

---

# 30. Recalculation vs Notifications

Retroactive data edits need special treatment.

Suppose:

```text
current status = OK
```

and the user adds a range visit from six months ago that causes:

```text
current status = DUE
```

The UI must immediately show:

```text
DUE
```

However the app should avoid presenting this as though a newly occurring shooting event just happened.

Recommended rule:

### Normal newly logged range usage

May trigger a user notification.

### Historical edits/imports/recalculations

Update status but do **not automatically fire a system notification**.

This prevents imports and bulk corrections from generating a burst of stale alerts.

An in-app indicator may still appear.

---

# 31. Notification Channels

MVP should have an **in-app cleaning alert state** regardless of OS notification permission.

Potential locations:

```text
Home
Firearms list
Firearm details
```

System local notifications are additive.

If OS notifications are implemented:

```text
Cleaning alerts
[ON/OFF]
```

must exist in settings.

Denying notification permission must never disable cleaning tracking itself.

---

# 32. Firearms List

Cleaning status should be visible without opening every firearm.

For firearms needing attention:

```text
GLOCK 17
9×19
6,420 RDS

FIELD STRIP · DUE SOON
```

or:

```text
AR-15
5.56
3,812 RDS

COMPLETE CLEANING · DUE
```

Do not show large green `OK` badges on every firearm.

Normal state should remain visually quiet.

Only exceptional states deserve prominence:

```text
DUE SOON
DUE
```

---

# 33. Home / Dashboard

If at least one firearm requires cleaning, show a compact summary.

Example:

```text
MAINTENANCE
2 FIREARMS NEED ATTENTION

Glock 17
Field strip · 54 rounds remaining

AR-15
Complete cleaning · 122 rounds overdue
```

Tap opens the relevant firearm.

If everything is fine, this section may be omitted rather than taking permanent dashboard space.

---

# 34. Cleaning Settings UX

Inside firearm edit/details:

```text
CLEANING INTERVALS
```

Fields:

```text
FIELD STRIP
[x] Track
Every [ 500 ] rounds

COMPLETE DISASSEMBLY
[x] Track
Every [ 3000 ] rounds
```

Rules:

```text
positive integers only
zero invalid
decimals invalid
negative values invalid
```

The values represent rounds.

No unit selector is necessary.

---

# 35. Changing an Interval

Changing:

```text
500 → 750 rounds
```

does NOT reset cleaning history.

It immediately recalculates status against the new interval.

Example:

```text
Rounds since cleaning: 600

Old:
600 / 500
DUE

New:
600 / 750
OK
```

Similarly:

```text
750 → 500
```

could immediately make the firearm overdue.

Changing settings should not create a cleaning event.

Configuration and maintenance history are different concepts.

---

# 36. Disabling Tracking

Turning off one cleaning type:

```text
Track field strip [OFF]
```

must not delete cleaning history.

It only disables:

```text
progress calculation
status
alerts
```

for that interval.

Re-enabling restores calculation from existing history/baseline.

---

# 37. Complete Cleaning with Field-Strip Tracking Disabled

Hierarchy still applies internally.

Example:

```text
Field strip tracking: OFF
Complete tracking: ON
```

A complete cleaning resets the complete interval.

If field-strip tracking is later enabled, that complete cleaning may be used as the most recent qualifying field-strip cleaning if it occurs after the tracking baseline.

Historical semantics do not change based on what UI features happened to be enabled at the time.

---

# 38. Range Visit With Multiple Firearms

Cleaning calculations operate per firearm.

Example:

```text
Range Visit

Glock 17   150 rounds
AR-15      120 rounds
```

Only:

```text
+150
```

affects Glock cleaning intervals.

Only:

```text
+120
```

affects AR-15 cleaning intervals.

Visit-level total rounds must never be blindly applied to every firearm.

---

# 39. Deleted Firearms

Deleting a firearm should cascade/remove or archive its cleaning:

```text
settings
events
derived status
alerts
```

according to TriggerNote's existing firearm deletion semantics.

No orphan cleaning records should remain visible.

---

# 40. Import / Export

Cleaning configuration and history must participate in TriggerNote backup/export.

Exported firearm-related data should preserve:

```text
CleaningSettings
CleaningEvent[]
tracking baseline
```

Derived fields should not need to be exported:

```text
roundsSinceCleaning
status
remainingRounds
progress
```

Those should be recalculated after import.

This avoids stale derived data.

---

# 41. Imported Historical Data

After import:

1. load firearms;
2. load range history;
3. load cleaning configuration;
4. load cleaning events;
5. rebuild cleaning state.

Import must not produce dozens of system notifications because old events happen to be overdue.

The current state may be shown in-app immediately after import.

---

# 42. Data Integrity

Required invariants:

```text
CleaningEvent.firearmId
must reference a valid firearm.

CleaningEvent.type
must be one of the supported cleaning types.

performedAt
must not be in the future.

intervalRounds
must be a positive integer.
```

Derived counters must never become negative.

---

# 43. Boundary Semantics

A cleaning event divides firearm usage into intervals.

Rounds occurring:

```text
before cleaning
```

belong to the interval that ended with that cleaning.

Rounds occurring:

```text
after cleaning
```

belong to the new interval.

Example:

```text
100 rounds
CLEAN
200 rounds
```

Result:

```text
Rounds since clean = 200
```

not 300.

---

# 44. Historical Interval Statistics

Each cleaning event may display the number of rounds since the previous qualifying cleaning.

This creates useful maintenance history without introducing a separate analytics feature.

Example:

```text
FIELD STRIP HISTORY

482 rounds
511 rounds
437 rounds
603 rounds
```

This information is derived.

It provides a natural foundation for future features such as:

```text
average cleaning interval
cleaning frequency
maintenance adherence
```

but those analytics are outside MVP.

---

# 45. No Time-Based Cleaning Interval in MVP

MVP should use:

```text
rounds fired
```

as the cleaning trigger.

Do not initially introduce:

```text
every X days
every X months
whichever comes first
```

unless a separate product requirement emerges.

Why:

TriggerNote's strongest existing signal is firearm usage, and adding simultaneous calendar scheduling substantially complicates:

- configuration;
- states;
- notification logic;
- wording;
- testing.

The data model should not deliberately prevent a future time-based interval, but it does not belong in this first feature.

---

# 46. No Automatic Cleaning Assumption

Logging a range visit must never implicitly create a cleaning.

TriggerNote must not assume:

```text
user cleaned gun after every range visit
```

Even if this is common behavior.

Cleaning must remain an explicit user action.

---

# 47. No Round Counter Editing

Do not expose:

```text
Rounds since cleaning [ ___ ]
```

as an editable field.

Doing so would create two conflicting histories:

```text
range history
vs.
maintenance counter
```

If the calculated value is wrong, the user fixes:

```text
range history
cleaning history
tracking baseline
```

rather than overwriting the result.

---

# 48. Suggested Navigation

The feature does not require a top-level `Cleaning` tab.

Cleaning is subordinate to firearms.

Recommended hierarchy:

```text
Firearms
 └── Firearm Details
      ├── Cleaning Status
      ├── Log Cleaning
      ├── Cleaning History
      └── Cleaning Settings
```

A dashboard-level maintenance summary may aggregate overdue firearms, but detailed interaction stays within the firearm context.

This avoids adding another major navigation destination for a relatively focused feature.

---

# 49. Empty States

## No cleaning tracking

```text
CLEANING

Cleaning intervals are not configured.

Track rounds between routine and complete
cleanings.

[ SET UP CLEANING ]
```

---

## Tracking configured, no cleaning event yet

If baseline exists:

```text
CLEANING

0 / 500 rounds since tracking started

No cleaning events logged yet.

[ LOG CLEANING ]
```

---

## History empty

```text
NO CLEANING HISTORY

Cleaning events for this firearm
will appear here.
```

---

# 50. Recommended Domain Service

Do not scatter calculation logic across screens.

Provide one domain service responsible for deriving cleaning state.

Conceptually:

```ts
getCleaningStatus(
  firearm,
  cleaningSettings,
  cleaningEvents,
  rangeVisits
)
```

returns:

```ts
{
  fieldStrip: {
    enabled,
    interval,
    roundsSinceCleaning,
    remainingRounds,
    progress,
    status,
    lastCleaningEvent
  },

  completeDisassembly: {
    enabled,
    interval,
    roundsSinceCleaning,
    remainingRounds,
    progress,
    status,
    lastCleaningEvent
  }
}
```

Screens consume the derived result.

They do not implement maintenance arithmetic themselves.

---

# 51. Recalculation Strategy

For the expected TriggerNote dataset size, correctness is more important than precomputed optimization.

Recommended MVP:

```text
derive cleaning state from historical records
```

rather than persisting counters.

Caching can be introduced later if necessary.

This dramatically simplifies correctness for:

```text
backdated events
edited visits
deleted visits
imports
changed cleaning types
changed intervals
```

---

# 52. Acceptance Criteria

## Configuration

- User can enable field-strip tracking independently.
- User can enable complete-disassembly tracking independently.
- Each enabled interval requires a positive integer round count.
- Existing firearms can establish a clean tracking baseline without pretending previous mileage occurred since cleaning.
- Changing an interval does not reset history.

## Logging

- User can log a field-strip cleaning.
- User can log a complete-disassembly cleaning.
- User can choose a historical date.
- Future dates are rejected.
- User can optionally add notes.

## Calculation

- Field strip resets field-strip usage.
- Complete disassembly resets both cleaning counters.
- Field strip does not reset complete-disassembly usage.
- Round counts derive from range-visit firearm usage.
- Historical visits affect the correct cleaning interval.
- Historical cleaning events recalculate all relevant interval data.
- Editing/deleting range visits recalculates cleaning state.
- Editing/deleting cleaning events recalculates cleaning state.
- Same-day range usage is treated as occurring before a date-only cleaning by default.

## Status

- Below 80% displays normal status.
- At or above 80% displays Due Soon.
- At or above 100% displays Due.
- Overdue rounds remain visible.
- Progress is not capped at 100%.

## Alerts

- Crossing into Due Soon can generate an alert.
- Crossing into Due generates an alert.
- One update that crosses both thresholds generates only Due.
- Remaining overdue does not create repeated identical alerts.
- Historical imports/recalculations update state without generating stale system notifications.

## UX

- Cleaning status appears on firearm details.
- Due/Due Soon state can surface on firearm cards.
- Cleaning can be logged directly from firearm details.
- Cleaning history is accessible per firearm.
- Complete-disassembly events visibly communicate that both intervals were reset.
- Unconfigured firearms do not show misleading `0 rounds since cleaning`.

## Persistence

- Cleaning events survive application restart.
- Cleaning settings survive application restart.
- Cleaning data participates in backup/export/import.
- Derived counters are recalculated rather than treated as persisted source-of-truth values.

---

# 53. Critical Test Scenarios

### Scenario A — normal field strip

```text
Interval: 500

Clean
+200 rounds
+150 rounds

Expected:
350 / 500
150 remaining
```

### Scenario B — complete cleaning resets both

```text
Field: 500
Complete: 3000

Current:
Field = 480
Complete = 2200

Complete cleaning

Expected:
Field = 0
Complete = 0
```

### Scenario C — field strip only resets field

```text
Current:
Field = 480
Complete = 2200

Field strip

Expected:
Field = 0
Complete = 2200
```

### Scenario D — retroactive range visit

```text
Jan 01 Clean
Jan 20 Clean
Jan 30 +100

Later add:
Jan 10 +300

Expected current:
100 rounds

Expected Jan 20 historical interval:
300 rounds
```

### Scenario E — backdated cleaning

```text
Jan 01 +200
Jan 20 +300
Jan 30 +100

Current:
600 rounds

Later add:
Jan 25 Field Strip

Expected:
100 rounds since field strip
```

### Scenario F — interval reduction

```text
Current:
600 rounds since cleaning

Interval:
750 → 500

Expected:
100 rounds overdue
```

No cleaning event created.

### Scenario G — imported existing firearm

```text
Total recorded:
5,000 rounds

No known cleaning history.

User:
Start tracking now.

Expected:
0 rounds since tracking baseline
```

Not:

```text
5,000 rounds overdue
```

### Scenario H — same-day visit and cleaning

```text
Sep 07 +250
Sep 07 Field Strip
```

Expected current:

```text
0 rounds
```

The 250 rounds belong to the interval ending with the Sep 07 cleaning.

---

# 54. Recommended MVP

The MVP should include:

1. two cleaning types;
2. per-firearm round intervals;
3. explicit tracking baseline;
4. cleaning event logging;
5. retroactive chronological calculation;
6. firearm cleaning status;
7. cleaning history;
8. Due Soon / Due states;
9. in-app maintenance alerts;
10. notification state-transition logic;
11. editing/deleting events;
12. backup/import/export support.

Do not include in MVP:

- parts;
- replacement tracking;
- wear estimation;
- time-based intervals;
- manufacturer maintenance databases;
- cleaning supplies;
- lubrication tracking;
- detailed cleaning checklists;
- photos;
- recurring reminder schedules;
- maintenance analytics;
- automatic assumptions that a firearm was cleaned.

---

# 55. Product Principle

Cleaning should behave as a **derived maintenance timeline**, not a glorified counter.

The fundamental relationship is:

```text
Firearm
   │
   ├── Range activity
   │      └── rounds fired
   │
   ├── Cleaning events
   │
   └── Cleaning configuration
           │
           ▼
     DERIVED STATUS
```

This gives TriggerNote one consistent historical model.

When the user corrects the past, the present automatically becomes correct.

That should be the defining behavior of the feature.