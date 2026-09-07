# TriggerNote — Parts Life Database

## 1. Purpose

Introduce a firearm component lifecycle system that allows users to:

- track important firearm parts,
- track the number of rounds fired while each physical part was installed,
- log part replacements,
- preserve the complete historical lifespan of replaced parts,
- configure optional round-based replacement/service intervals,
- receive warnings when a tracked component is approaching or exceeding its configured interval,
- analyze component life over time.

Examples of tracked components:

- recoil/action spring,
- extractor,
- barrel,
- firing pin / striker,
- firing pin spring,
- trigger return spring,
- magazine catch spring,
- custom user-defined component.

The feature is fundamentally a:

> **parts life database connected to firearm round history**

It is not a simple set of resettable counters.

---

# 2. Scope boundary

This specification covers only:

- firearm component tracking,
- component installation,
- component replacement,
- round-based component usage,
- component lifecycle history,
- optional replacement/service intervals,
- due-soon and due states,
- notifications,
- import/export,
- historical edits,
- component statistics.

Explicitly excluded:

- firearm cleaning,
- field stripping,
- complete disassembly,
- cleaning reminders,
- lubrication,
- general maintenance events unrelated to tracked components.

Cleaning should have its own independent scope later.

---

# 3. Core concept

TriggerNote should model:

```text
Firearm
    ↓
Part Slot
    ↓
Part Instance
```

Example:

```text
Glock 17

Recoil Spring
    ├── Spring #1 — 5,120 rounds — replaced
    ├── Spring #2 — 4,870 rounds — replaced
    └── Spring #3 — 2,340 rounds — currently installed
```

The **Part Slot** represents the component category.

The **Part Instance** represents one actual physical component installed in the firearm.

This distinction is essential.

---

# 4. Do not model parts as resettable counters

Avoid:

```text
recoilSpringRounds = 2340
```

with:

```text
replace spring
→ recoilSpringRounds = 0
```

This destroys historical information.

Instead:

```text
Spring #2
removed
final life = 4,870 rounds

Spring #3
installed
current life = 0 rounds
```

The old component remains permanently available in history.

---

# 5. Counter semantics

A newly installed part starts at:

```text
0 rounds
```

After the first round:

```text
1 round
```

After a 250-round range visit:

```text
250 rounds
```

Therefore counters technically start from zero, not one.

---

# 6. Range visits remain the canonical usage source

TriggerNote already knows which firearm was used during a range visit and how many rounds were fired.

Parts Life should derive usage from this existing data.

The user must never manually increment:

```text
barrel rounds
extractor rounds
spring rounds
```

Normal workflow:

```text
Range visit
↓
250 rounds fired with Glock 17
↓
All components installed during that visit
gain 250 rounds
```

This creates one source of truth.

---

# 7. No secondary firearm odometer

Component usage must not be based solely on:

```text
current firearm rounds
-
firearm rounds at installation
```

That approach fails when historical range visits are edited.

Example:

```text
Spring replacement occurred at 5,000 rounds.

Current firearm total:
8,000 rounds.

Naive spring life:
8,000 - 5,000 = 3,000
```

Later, the user corrects a range visit that occurred before the spring replacement:

```text
old visit:
200 → 300 rounds
```

Firearm total becomes:

```text
8,100
```

Naive calculation:

```text
8,100 - 5,000 = 3,100
```

But the current spring did not fire those additional 100 rounds.

Correct result:

```text
3,000
```

Therefore usage must be derived from the range visits occurring while that part instance was installed.

---

# 8. Component usage calculation

For a component with complete TriggerNote history:

```text
component usage =
sum(
    rounds fired with firearm
    while component was installed
)
```

For an existing component that already had usage before TriggerNote began tracking it:

```text
component usage =
startingUsageRounds
+
rounds recorded while component was installed
```

Conceptually:

```text
PartInstance {
    startingUsageRounds
    installedAt
    removedAt?
}
```

---

# 9. Existing firearm initialization

The application must handle firearms already containing significant round history.

Example:

```text
Firearm total:
12,000 rounds

Current recoil spring:
installed approximately 2,000 rounds ago
```

The component must not automatically inherit all 12,000 rounds.

When adding a tracked component, ask:

```text
CURRENT PART USAGE

How much usage does this part already have?

○ Original part — same known lifetime as firearm
○ I know approximately how many rounds are on it
○ Prior usage is unknown
○ New part — start at 0
```

---

# 10. Original component

If:

```text
Original part
```

is selected:

TriggerNote may initialize its starting usage from the firearm's existing known lifetime.

Example:

```text
Firearm current lifetime:
8,400 rounds

Barrel:
Original part
```

Result:

```text
Barrel
8,400 rounds
```

Future firearm usage then accumulates normally.

---

# 11. Known current usage

Example:

```text
Current extractor usage:
1,750 rounds
```

TriggerNote stores:

```text
startingUsageRounds = 1750
```

If another 500 rounds are subsequently fired:

```text
current extractor usage = 2250
```

---

# 12. Unknown historical usage

Unknown history must be explicitly supported.

Example:

```text
Extractor

Tracked usage:
1,250+ rounds

Previous usage:
Unknown
```

The application must not pretend the part has exactly 1,250 total rounds.

Recommended UI:

```text
EXTRACTOR

1,250+ rounds

Tracking started:
07 Sep 2026

Previous usage unknown
```

Once the extractor is replaced, the new instance gets an exact zero baseline.

---

# 13. New component

A newly installed component starts from:

```text
0 rounds
```

This represents the strongest possible baseline.

Example:

```text
Recoil spring
Installed 07 Sep 2026

0 rounds
```

---

# 14. Part slots

Each firearm has zero or more tracked **Part Slots**.

Examples:

```text
Recoil spring
Extractor
Barrel
Striker
Striker spring
Trigger return spring
Custom
```

Part slots are firearm-specific.

Example:

```text
Glock 17
    Recoil spring

Glock 19
    Recoil spring
```

These are separate records.

---

# 15. User-defined components

TriggerNote should not constrain users to a fixed built-in parts list.

The user must be able to create:

```text
CUSTOM PART

Name
[________________]

Optional description
[________________]
```

Examples:

```text
Locking block
Ejector
Hammer spring
Gas rings
Buffer spring
Bolt
Firing pin
```

This keeps the model compatible with:

- pistols,
- revolvers,
- rifles,
- shotguns,
- PCCs,
- unusual firearm designs.

---

# 16. Suggested components

TriggerNote may provide convenience suggestions.

Example:

```text
ADD TRACKED PART

Suggested

[ Recoil / Action Spring ]
[ Extractor ]
[ Barrel ]
[ Firing Pin / Striker ]
[ Other... ]
```

These are UI shortcuts only.

They must not imply:

> TriggerNote recommends that this component must be replaced.

---

# 17. No automatic universal replacement intervals

TriggerNote should not ship arbitrary rules such as:

```text
Extractor:
replace every 10,000 rounds
```

unless the application later maintains a properly sourced firearm-specific maintenance database.

For MVP, intervals should be:

> **user-defined service intervals**

not:

> manufacturer replacement intervals

Recommended wording:

```text
SERVICE INTERVAL
5,000 rounds
```

rather than:

```text
EXPECTED PART LIFE
5,000 rounds
```

---

# 18. Why “service interval” is preferable

A part reaching:

```text
5,000 rounds
```

does not mean it has:

```text
100% physical wear
```

Round count is only a usage metric.

Therefore the UI should not say:

```text
95% worn
```

It may say:

```text
95% of configured service interval
```

or:

```text
4,750 / 5,000 rounds
250 rounds remaining
```

---

# 19. Part instance

Each physical component installed in a slot becomes a Part Instance.

Suggested model:

```text
PartInstance {
    id

    firearmId
    partSlotId

    installedAt
    removedAt?

    startingUsageRounds

    baselineType:
        "new"
        | "original"
        | "known_usage"
        | "unknown"

    manufacturer?
    model?
    partNumber?

    notes?

    installationEventId
    removalEventId?

    replacementReason?
}
```

Only one active instance may exist in one part slot at any given moment.

---

# 20. Part slot model

Conceptually:

```text
PartSlot {
    id
    firearmId

    name

    serviceIntervalRounds?
    notifyBeforeRounds?

    enabled

    createdAt
    updatedAt
}
```

The Part Slot holds configuration.

The Part Instance holds lifecycle history.

---

# 21. Part replacement

Replacement is the central lifecycle action.

Example:

```text
Current recoil spring

Installed:
04 May 2026

Current usage:
4,870 rounds

[ REPLACE PART ]
```

Replacement should:

1. end the current part instance;
2. preserve its final lifetime;
3. store why it was removed;
4. create a new instance;
5. initialize that new instance;
6. normally start the new instance at 0 rounds.

---

# 22. Replace Part UX

Suggested flow:

```text
REPLACE RECOIL SPRING

Replacement date
07 Sep 2026


CURRENT PART

Rounds
4,870


REASON

○ Scheduled / preventive
○ Failure
○ Wear found during inspection
○ Damage
○ Upgrade
○ Other


NEW PART

Manufacturer
[ optional ]

Model / description
[ optional ]

Part number
[ optional ]

Starting usage
○ New — 0 rounds
○ Used — enter existing usage
○ Usage unknown

Notes
[ optional ]


[ SAVE REPLACEMENT ]
```

---

# 23. Replacement reasons

Replacement reason should be structured rather than only free text.

Suggested values:

```text
scheduled
failure
wear
damage
upgrade
unknown
other
```

This will enable meaningful future statistics.

Example:

```text
Average recoil spring life before scheduled replacement:
4,820 rounds

Average recoil spring life before failure:
6,150 rounds
```

Preventive replacements must not be interpreted as failures.

---

# 24. Part installation without previous tracked part

A user may begin tracking a component after buying the firearm.

Example:

```text
ADD RECOIL SPRING

Current part:

○ New
○ Original
○ Known usage
○ Unknown usage
```

This creates the first Part Instance.

No artificial replacement event is necessary.

---

# 25. Removal without replacement

The system must also support:

```text
REMOVE PART
```

without installing a replacement.

Example:

```text
Alternate barrel removed
```

or a component is intentionally no longer tracked/installed.

After removal:

```text
Part Slot:
active

Current instance:
none
```

Usage accumulation stops.

Notifications also stop until another instance is installed.

---

# 26. Reinstalling a previously removed physical part

This deserves explicit handling.

A physical component may be:

```text
installed
→ removed
→ later installed again
```

Example:

```text
Factory barrel
→ threaded barrel
→ factory barrel again
```

TriggerNote should eventually support reinstallation of an existing Part Instance rather than always pretending it is a new physical component.

The cleanest model is therefore not merely:

```text
installedAt
removedAt
```

but potentially:

```text
PartInstallationPeriod[]
```

However, this adds complexity.

---

# 27. MVP recommendation for reinstallation

For MVP:

support:

```text
REINSTALL PREVIOUS PART
```

when replacing/removing components.

The same Part Instance retains cumulative lifetime usage.

Example:

```text
Factory barrel

Period 1:
4,000 rounds

Removed

Period 2:
+2,000 rounds

Lifetime:
6,000 rounds
```

This is materially better than creating:

```text
Factory barrel #1
Factory barrel #2
```

for the same physical object.

---

# 28. Revised physical-part model

Because reinstallation is realistic, the more robust domain model should be:

```text
PartInstance
    ↓
InstallationPeriods
```

Example:

```text
PartInstance {
    id
    partSlotId

    startingUsageRounds

    manufacturer?
    model?
    partNumber?
    notes?

    replacementReason?
}
```

and:

```text
PartInstallationPeriod {
    id
    partInstanceId
    firearmId

    installedAt
    removedAt?
}
```

Component usage becomes:

```text
startingUsageRounds
+
sum(rounds fired during all installation periods)
```

This is the model I recommend implementing rather than assuming every component is installed only once.

---

# 29. One installed component per slot

Business rule:

> A Part Slot can have at most one active installed Part Instance at any moment.

Attempting to install another part should automatically invoke a replacement/removal flow.

Do not permit overlapping installation periods for the same slot.

---

# 30. Backdated replacements

Historical replacements must be supported.

Example:

Today:

```text
07 Sep
```

User enters:

```text
I replaced the recoil spring on 15 Aug.
```

Range history:

```text
10 Aug    200 rounds
20 Aug    300 rounds
01 Sep    250 rounds
```

New spring usage becomes:

```text
550 rounds
```

The 10 Aug rounds belong to the previous spring.

---

# 31. Backdated insertion may rewrite history

Example existing history:

```text
Spring A
01 Jan → 01 Jun

Spring B
01 Jun → current
```

User later enters:

```text
Spring A was actually replaced by Spring X on 01 Apr,
and X lasted until Spring B on 01 Jun.
```

Correct history becomes:

```text
A
01 Jan → 01 Apr

X
01 Apr → 01 Jun

B
01 Jun → current
```

All part lifetimes must be recalculated.

Historical records should not depend on immutable odometer snapshots.

---

# 32. Same-day ambiguity

If a range visit and part replacement occur on the same date, ordering matters.

Example:

```text
07 Sep
300-round range visit

07 Sep
Extractor replacement
```

Was the extractor replaced:

```text
before the visit
```

or:

```text
after the visit
```

The application must know.

---

# 33. Datetime storage

All installation/removal timestamps should therefore be stored as actual datetimes.

Not just:

```text
2026-09-07
```

but conceptually:

```text
2026-09-07T18:30
```

Even if the normal UI primarily displays dates.

---

# 34. Same-date conflict UX

When a backdated replacement occurs on a date containing a recorded visit:

```text
A range visit with 300 rounds is recorded on this date.

When was the replacement performed?

○ Before the range visit
○ After the range visit
```

If multiple visits occurred that day:

```text
Replacement happened:

○ Before all visits
○ Between visit 1 and visit 2
○ After all visits
```

The UI should resolve this rather than guessing.

---

# 35. Historical range-visit edits

Editing:

```text
250 rounds → 300 rounds
```

must automatically update usage of whichever parts were installed during that visit.

Likewise:

```text
delete range visit
```

must subtract those rounds.

No maintenance-specific counter update should be manually persisted.

---

# 36. Part life should be derived

Do not persist authoritative values such as:

```text
currentRounds = 4870
remainingRounds = 130
percentUsed = 97.4
status = "due_soon"
```

These can become stale.

Persist:

```text
starting usage
installation periods
service interval
range visits
```

Derive everything else.

---

# 37. Current usage calculation

Conceptually:

```text
currentPartUsage =
    startingUsageRounds
    +
    sum(
        rounds from visits
        occurring during installation periods
    )
```

---

# 38. Current status

Each Part Slot has one of these states:

```text
NOT_TRACKED
NO_PART_INSTALLED
BASELINE_UNKNOWN
NO_INTERVAL
OK
DUE_SOON
DUE
```

---

# 39. NO_INTERVAL state

Example:

```text
BARREL

12,420 rounds

No service interval configured
```

This is a perfectly valid configuration.

Users may want historical data without reminders.

---

# 40. BASELINE_UNKNOWN state

Example:

```text
EXTRACTOR

1,420+ rounds

Previous usage unknown

Service interval:
5,000 rounds
```

A precise:

```text
3,580 rounds remaining
```

would be misleading.

Therefore no exact remaining-life value should be displayed.

Possible status:

```text
BASELINE UNKNOWN

1,420 rounds tracked since 07 Sep 2026
```

---

# 41. Due status

With exact baseline and configured interval:

```text
OK
```

until warning threshold.

Example:

```text
Service interval:
5,000

Notify before:
500

Current:
4,000
```

Status:

```text
OK
```

---

# 42. Due Soon

At:

```text
4,500 / 5,000
```

status:

```text
DUE SOON

500 rounds remaining
```

---

# 43. Due

At:

```text
5,100 / 5,000
```

status:

```text
DUE

100 rounds beyond configured interval
```

TriggerNote must not block further range visits.

These are advisory statuses.

---

# 44. Interval changes

Users may change:

```text
5,000 rounds
```

to:

```text
4,000 rounds
```

Current status should recalculate immediately.

The historical life of prior component instances remains unchanged.

Do not retroactively label historical replacements as overdue unless explicitly shown in analytics.

---

# 45. Firearm Details integration

The firearm details screen should expose a concise Parts Life summary.

Example:

```text
PARTS LIFE

1 PART DUE SOON

Recoil spring
4,650 / 5,000
350 remaining

Extractor
7,200 / 10,000
2,800 remaining

Barrel
12,420 rounds
No interval

[ VIEW ALL PARTS ]
```

---

# 46. No parts configured

```text
PARTS LIFE

No components are being tracked.

Track springs, barrels, extractors and
other components by round usage.

[ SET UP PART TRACKING ]
```

---

# 47. Firearm Parts screen

Dedicated screen:

```text
GLOCK 17
PARTS LIFE

12,420 firearm rounds


DUE SOON
──────────────────

RECOIL SPRING

4,650 / 5,000 rounds
350 remaining

[ REPLACE ]


TRACKED PARTS
──────────────────

EXTRACTOR
7,200 / 10,000
2,800 remaining

BARREL
12,420 rounds
No interval

STRIKER SPRING
3,120 / 8,000
4,880 remaining


[ + ADD PART ]
```

---

# 48. Part Details screen

Selecting a tracked component opens its lifecycle.

Example:

```text
RECOIL SPRING

CURRENT PART
──────────────────

Spring #3

Installed
04 May 2026

Usage
3,842 rounds

Service interval
5,000 rounds

Remaining
1,158 rounds

Status
OK


[ REPLACE PART ]
[ REMOVE PART ]


PART HISTORY
──────────────────

SPRING #2

04 Jan 2026 → 04 May 2026

4,710 rounds

Scheduled replacement


SPRING #1

Original → 04 Jan 2026

5,210 rounds

Scheduled replacement
```

---

# 49. Part instance detail

Each historical physical component should be inspectable.

Example:

```text
RECOIL SPRING #2

Manufacturer
Wolff

Model
17 lb

Part number
...

Initial usage
0 rounds

Total usage
4,710 rounds


INSTALLATION HISTORY

Installed
04 Jan 2026

Removed
04 May 2026


REMOVAL

Reason
Scheduled replacement

Notes
No visible damage
```

---

# 50. Reinstalled part UX

When installing a component:

```text
INSTALL RECOIL SPRING

○ Install new part
○ Reinstall previous part
```

Selecting previous part:

```text
SELECT PART

Wolff 17 lb
4,710 lifetime rounds
Last removed 04 May

Factory spring
3,820 lifetime rounds
Last removed 10 Jan
```

After reinstallation:

```text
Lifetime:
4,710 rounds

Current installation:
0 rounds since reinstall
```

After 300 rounds:

```text
Lifetime:
5,010 rounds

Current installation:
300 rounds
```

The service interval should normally apply to **physical part lifetime**, not the latest installation period.

---

# 51. Current installation vs lifetime

Part detail should distinguish:

```text
TOTAL PART LIFE
5,010 rounds
```

from:

```text
CURRENT INSTALLATION
300 rounds
```

This distinction becomes important for:

- alternate barrels,
- rotating springs,
- bolts,
- components removed for testing,
- spare component rotation.

---

# 52. Collection-level overview

Users with multiple firearms need one place to see approaching component intervals.

Add:

```text
MENU → PARTS LIFE
```

or:

```text
MENU → MAINTENANCE → PARTS
```

if a broader Maintenance section is added later.

For this standalone feature I prefer:

```text
PARTS LIFE
```

---

# 53. Parts Life overview

Example:

```text
PARTS LIFE


DUE
──────────────────

GLOCK 17
Recoil spring

5,120 / 5,000
120 over


DUE SOON
──────────────────

CZ SHADOW 2
Extractor

9,400 / 10,000
600 remaining


AR-15
Bolt

8,650 / 10,000
1,350 remaining
```

Sorting:

1. most overdue;
2. due;
3. smallest number of rounds remaining.

---

# 54. Firearm list indication

Do not clutter every firearm card with normal maintenance status.

Only surface exceptions.

Example:

```text
Glock 17
9×19
12,420 rounds

⚠ 1 PART DUE
```

or:

```text
1 PART DUE SOON
```

When everything is healthy, show nothing.

---

# 55. Add Part flow

Suggested flow:

```text
ADD TRACKED PART

Part
[ Recoil spring ▼ ]

or

[ Custom part ]


CURRENT PART

○ Brand new — 0 rounds
○ Original firearm part
○ Known current usage
○ Previous usage unknown


SERVICE INTERVAL

○ No interval
○ Track interval

Interval
[ 5000 ] rounds

Notify before
[ 500 ] rounds


OPTIONAL DETAILS

Manufacturer
[________________]

Model
[________________]

Part number
[________________]

Notes
[________________]


[ START TRACKING ]
```

---

# 56. Recommended setup UX

Do not force users through a large “maintenance setup wizard”.

A better flow is incremental.

Example:

```text
PARTS LIFE

No tracked components.

[ + ADD PART ]
```

User adds:

```text
Recoil spring
```

Later:

```text
Extractor
```

Later:

```text
Barrel
```

This keeps setup lightweight.

---

# 57. Notifications

Notifications should be triggered by component status transitions caused by new round usage.

Example:

```text
Range visit saved
↓
300 rounds added
↓
Part state recalculated
↓
Recoil spring crosses Due Soon threshold
↓
Notification
```

---

# 58. Due Soon notification

Example:

```text
TriggerNote

Glock 17 recoil spring is approaching
its configured service interval.

4,650 / 5,000 rounds
350 rounds remaining
```

---

# 59. Due notification

Example:

```text
TriggerNote

Glock 17 recoil spring reached its
configured service interval.

5,020 / 5,000 rounds
```

---

# 60. Notification deduplication

Do not send:

```text
4,600 → warning
4,700 → warning
4,800 → warning
4,900 → warning
```

One physical Part Instance gets:

```text
Due Soon notification:
maximum once

Due notification:
maximum once
```

until it is replaced.

---

# 61. Reinstalled-component notifications

Notification state belongs to the physical Part Instance.

Example:

```text
Spring A
4,800 / 5,000
Due Soon already emitted
```

Remove it.

Later reinstall it.

At:

```text
4,800
```

do not emit another Due Soon notification.

At:

```text
5,000
```

emit the Due notification once.

---

# 62. New component resets notification lifecycle

Replacing:

```text
Spring A
```

with:

```text
Spring B
```

creates a new notification lifecycle.

Spring B may later independently produce:

```text
Due Soon
Due
```

alerts.

---

# 63. Historical correction and alerts

Suppose:

```text
Spring:
4,700 / 5,000

Due Soon notification already emitted.
```

User edits an old relevant range visit.

New total:

```text
4,300
```

Status becomes:

```text
OK
```

If later usage again reaches:

```text
4,500
```

do not issue a duplicate warning for the same physical part.

Historical corrections must not cause alert spam.

---

# 64. Notification permission

System notification permission should only be requested when the user enables Parts Life alerts.

Do not request permission during initial app launch.

If permission is denied:

- Parts Life still functions;
- Due Soon/Due statuses remain in the app;
- firearm warning badges remain available.

---

# 65. Parts with no service interval

These should never create Due Soon or Due notifications.

Example:

```text
BARREL

16,240 lifetime rounds

No service interval
```

This component is tracked purely for historical information.

---

# 66. Part history timeline

At firearm level:

```text
PART HISTORY

07 SEP 2026
Recoil spring replaced
4,870 rounds on previous part

04 MAY 2026
Extractor replaced
8,220 rounds on previous part

14 FEB 2026
Barrel installed
New part
```

This gives the firearm a chronological service history without introducing cleaning into the feature.

---

# 67. Event model

Internally, lifecycle changes should still be recorded as events.

Suggested types:

```text
part_added
part_installed
part_removed
part_replaced
part_reinstalled
```

This history is useful for auditing and import/export.

---

# 68. Part lifecycle event

Conceptually:

```text
PartLifecycleEvent {
    id

    firearmId
    partSlotId
    partInstanceId

    type

    occurredAt

    previousPartInstanceId?
    nextPartInstanceId?

    reason?

    notes?

    createdAt
    updatedAt
}
```

The event represents what the user did.

Installation periods represent resulting component state.

---

# 69. Why events and state should both exist

Events answer:

> What happened?

Example:

```text
07 Sep
Spring B replaced with Spring C.
```

State answers:

> Which part was installed during this range visit?

Example:

```text
07 Sep 18:00 → current
Spring C
```

Both concepts are useful.

The state can technically be reconstructed from events, but keeping explicit normalized installation periods makes range-based usage calculations simpler and safer.

---

# 70. Service layer

Introduce:

```text
parts-life-service.ts
```

rather than a broad:

```text
maintenance-service.ts
```

until cleaning/general maintenance actually exists.

Responsibilities:

```text
getPartSlots(firearmId)

addPartSlot(...)

updatePartSlot(...)

removePartSlot(...)

installPart(...)

replacePart(...)

removeInstalledPart(...)

reinstallPart(...)

getCurrentPart(...)

getPartUsage(...)

getPartHistory(...)

getPartStatus(...)

getFirearmPartsStatus(...)

getCollectionPartsStatus(...)

evaluatePartAlerts(...)

deletePartsForFirearm(...)
```

---

# 71. Domain folder

Recommended structure:

```text
src/
  services/
    parts-life-service.ts

  validation/
    partsLifeSchemas.ts

  screens/
    parts-life/
    firearm-parts/
    part-details/
    add-part/
    replace-part/
```

Avoid coupling all this logic into:

```text
firearm-service.ts
```

---

# 72. Storage strategy

I recommend storing Parts Life independently from the Firearm entity.

Do not add:

```text
recoilSpringRounds
extractorRounds
barrelRounds
```

to Firearm.

Conceptually:

```text
@storage:part-slots:{firearmId}
@storage:part-instance:{id}
@storage:part-events:{firearmId}
```

Exact indexing can follow TriggerNote's existing storage conventions.

---

# 73. Derived state

These should generally not be authoritative storage values:

```text
currentUsage
remainingRounds
percentage
status
```

They should be calculated.

Optional caches are acceptable only if:

- invalidated safely,
- never treated as source-of-truth.

---

# 74. Performance

A naive implementation could repeatedly scan every range visit for every part.

That is acceptable with tiny datasets but will eventually become unnecessarily expensive.

Recommended approach:

provide a service capable of querying firearm round usage over a date/time period:

```text
getRoundsForFirearmBetween(
    firearmId,
    start,
    end
)
```

Then:

```text
part life =
startingUsage
+
sum(period usage)
```

The range-visit service remains the owner of range history.

---

# 75. Initial firearm rounds edge case

Existing TriggerNote firearms can have a lifetime round value that predates recorded range visits.

Those rounds cannot automatically be assigned to historical Part Instances.

Therefore:

```text
Firearm.roundsFired
```

must never be treated as a complete chronological event history.

This is another reason every current component requires a baseline choice when tracking begins.

---

# 76. Deleting range visits

Deleting a historical range visit must recalculate:

- firearm total rounds,
- all part instances installed at that time,
- current statuses,
- collection Parts Life status.

No orphan usage should remain.

---

# 77. Deleting a replacement

Example history:

```text
Spring A
→ Spring B
→ Spring C
```

Delete replacement:

```text
A → B
```

Result should become:

```text
Spring A
→ Spring C
```

if the deleted event represented installation of B.

The service must rebuild the timeline and validate that no overlapping installation periods remain.

---

# 78. Editing replacement date

Changing:

```text
Spring B installed:
01 Jun
```

to:

```text
15 Jun
```

should:

- extend Spring A's installation period;
- shorten Spring B's period;
- recalculate both lifetimes;
- reevaluate warnings.

---

# 79. Invalid historical edit prevention

The application should reject impossible timelines.

Example:

```text
Spring B:
installed 10 Jun

Spring C:
installed 20 Jun
```

Editing Spring B installation to:

```text
25 Jun
```

would create an impossible order.

The UI should explain:

```text
This date conflicts with another recorded
replacement.

Spring C was installed on 20 Jun 2026.
```

---

# 80. Delete firearm

Deleting a firearm must remove:

- its Part Slots,
- physical Part Instances associated only with it,
- installation periods,
- part lifecycle events,
- notification state,
- scheduled/local notifications.

No orphan component records should remain.

---

# 81. Backup/export

Parts Life must be included in TriggerNote backup/export.

Conceptually:

```text
data: {
    firearms,
    ammunition,
    rangeVisits,

    partSlots,
    partInstances,
    partInstallationPeriods,
    partLifecycleEvents
}
```

Old backups containing none of these fields must continue importing correctly.

---

# 82. Import behavior

Imported component data must preserve stable relationships:

```text
Firearm
→ Part Slot
→ Part Instance
→ Installation Period
```

Import must validate:

- referenced firearm exists;
- referenced Part Slot exists;
- installation periods don't overlap within one slot;
- no more than one active part exists per slot.

---

# 83. Import notifications

Importing a firearm with:

```text
3 overdue parts
```

must not produce three immediate OS notifications.

Instead the app may show:

```text
Import complete

3 tracked components are currently due.

[ VIEW PARTS LIFE ]
```

Historical notification state should either be restored or initialized silently.

---

# 84. Future firearm-specific templates

The domain should support a later feature like:

```text
Glock 17 Gen 5

Suggested tracked components

✓ Recoil spring
✓ Extractor
✓ Striker spring
✓ Barrel
```

Potential future data:

```text
PartTemplate {
    firearmManufacturer
    firearmModel
    component
    suggestedInterval
    source
}
```

This is not part of the MVP.

---

# 85. Future cross-firearm component movement

The Installation Period model also enables another future capability:

> moving one physical component between firearms.

Example:

```text
Suppressor
Optic
Conversion barrel
Bolt assembly
```

For the current feature, I recommend restricting regular firearm parts to one firearm/slot context.

But the model should preferably use:

```text
InstallationPeriod.firearmId
```

rather than hard-coding the physical Part Instance permanently to one firearm.

This avoids a migration later if transferable components are introduced.

---

# 86. Accessories distinction

Do not merge Parts Life with the separate accessories feature.

Accessories and wear components overlap conceptually but serve different product purposes.

Example:

```text
Red dot
```

is an accessory that may move between firearms and accumulate rounds.

Example:

```text
Extractor
```

is a firearm component whose lifecycle is being tracked.

Both may use similar underlying installation-period logic, but their product models should remain separate.

A future shared internal abstraction may be possible:

```text
InstalledEntity
InstallationPeriod
Usage
```

but it should not be exposed as one confusing user-facing feature.

---

# 87. Wear observation — future feature

A future component inspection system could add:

```text
INSPECT PART

Condition

○ Good
○ Monitor
○ Replace

Notes
Photos
```

This would complement usage history.

Example:

```text
Extractor

6,250 rounds

Inspection at 6,000:
Monitor

Inspection notes:
Edge visibly rounded
```

But this should not be part of MVP.

---

# 88. Statistics

Once enough history exists, the system can calculate useful metrics.

Example:

```text
RECOIL SPRING

Current
3,820 rounds

Completed parts
4

Average retired life
4,920 rounds

Longest
5,420 rounds

Shortest
4,510 rounds
```

---

# 89. Replacement-reason statistics

More meaningful:

```text
SCHEDULED REPLACEMENTS

Average:
4,810 rounds


FAILURES

Count:
1

Failed at:
6,280 rounds
```

Avoid combining preventive replacements and failures into one misleading “average lifespan” value.

---

# 90. Per-model statistics — future

If enough data exists locally:

```text
Glock 17

Recoil springs replaced:
5

Average replacement point:
4,890 rounds
```

Eventually an anonymized ecosystem-wide database could theoretically provide broader analytics, but this would be a separate product/privacy decision and is outside this scope.

---

# 91. Search/filtering

On the collection Parts Life screen, useful filters include:

```text
[ DUE ]
[ DUE SOON ]
[ ALL ]
```

Optional later filters:

```text
Firearm
Part type
Replacement reason
```

MVP does not need complex search.

---

# 92. Empty states

### Firearm

```text
NO PARTS TRACKED

Track the round life of springs,
barrels, extractors and other components.

[ ADD PART ]
```

### Collection

```text
NO PARTS LIFE DATA

Tracked firearm components will appear
here.

Add a component from a firearm's
details screen.
```

### Part history

```text
NO PREVIOUS PARTS

This is the first tracked component
in this slot.
```

---

# 93. Terminology

Recommended user-facing terminology:

```text
Parts Life
Tracked Part
Current Part
Part History
Service Interval
Rounds Remaining
Replace Part
Remove Part
Reinstall Part
```

Avoid:

```text
wear percentage
health percentage
expected failure
remaining life
```

unless there is actual evidence supporting those statements.

---

# 94. Recommended feature naming

Preferred:

> **Parts Life**

Alternatives:

- Component Life
- Component Tracking
- Parts Tracking
- Service Parts

I recommend:

```text
PARTS LIFE
```

because it communicates both:

- current usage,
- historical lifespan.

---

# 95. MVP scope

## Tracking

- user-defined tracked Part Slots;
- suggested common component names;
- one installed component per slot;
- new/original/known/unknown initial baseline;
- optional manufacturer/model/part number/notes.

## Lifecycle

- install part;
- replace part;
- remove part;
- reinstall previous physical part;
- preserve complete physical component history;
- structured replacement reason;
- backdated lifecycle events.

## Usage

- automatic round accumulation from range visits;
- usage calculated over installation periods;
- support existing firearm rounds;
- support unknown previous usage;
- historical range-visit recalculation.

## Scheduling

- optional user-defined service interval;
- user-defined Due Soon threshold;
- OK / DUE SOON / DUE status;
- no artificial physical-wear percentage.

## UX

- Firearm Details summary;
- Firearm Parts Life screen;
- Part Details screen;
- physical part history;
- collection Parts Life overview;
- exceptional firearm-list warning indicator.

## Notifications

- Due Soon notification;
- Due notification;
- once per physical component lifecycle;
- no notification spam after historical edits;
- contextual permission request.

## Persistence

- dedicated Parts Life schemas;
- dedicated Parts Life service;
- backup/export/import;
- backwards compatibility;
- firearm deletion cascade.

---

# 96. Explicit non-goals for MVP

Do not include:

- cleaning;
- lubrication;
- complete disassembly;
- generic maintenance events;
- manufacturer-provided intervals;
- predicted component failure;
- physical wear percentages;
- AI maintenance advice;
- part inventory;
- spare-parts stock counts;
- component purchase costs;
- invoices;
- gunsmith records;
- photo inspections;
- cloud sync;
- community lifespan database.

---

# 97. Core acceptance scenario

Given:

```text
Glock 17
0 rounds

Recoil spring A
new
```

When:

```text
500 rounds are fired
```

Then:

```text
Spring A:
500 rounds
```

When:

```text
another 1,000 rounds are fired
```

Then:

```text
Spring A:
1,500 rounds
```

When:

```text
Spring A is replaced by Spring B
```

Then:

```text
Spring A:
retired
1,500 rounds

Spring B:
current
0 rounds
```

When:

```text
400 additional rounds are fired
```

Then:

```text
Spring A:
1,500 rounds

Spring B:
400 rounds
```

---

# 98. Historical edit acceptance scenario

Given:

```text
01 Jan
Spring A installed

01 Feb
200 rounds

01 Mar
Spring B installed

01 Apr
300 rounds
```

Then:

```text
Spring A = 200
Spring B = 300
```

When the 01 Feb visit is edited:

```text
200 → 250
```

Then:

```text
Spring A = 250
Spring B = 300
```

Spring B must remain unchanged.

---

# 99. Backdated replacement acceptance scenario

Given range visits:

```text
01 Jun
200 rounds

15 Jun
300 rounds

01 Jul
400 rounds
```

Current component:

```text
Spring A
```

When on 07 Sep the user records:

```text
Spring B installed on 20 Jun
```

Then:

```text
Spring A:
500 rounds

Spring B:
400 rounds
```

The date the event was entered is irrelevant.

The installation date determines round attribution.

---

# 100. Reinstallation acceptance scenario

Given:

```text
Barrel A:
2,000 rounds
```

When:

```text
Barrel A removed
Barrel B installed
```

and Barrel B gets:

```text
1,000 rounds
```

then Barrel A is reinstalled and another:

```text
500 rounds
```

are fired.

Result:

```text
Barrel A lifetime:
2,500 rounds

Current installation:
500 rounds

Barrel B lifetime:
1,000 rounds
```

---

# 101. Notification acceptance scenario

Given:

```text
Recoil spring interval:
5,000

Due Soon:
500 rounds before
```

When usage changes:

```text
4,400
→
4,600
```

Trigger:

```text
DUE SOON
```

once.

Further:

```text
4,800
4,950
```

produce no additional warning.

At:

```text
5,100
```

trigger:

```text
DUE
```

once.

---

# 102. Final architecture

```text
                     FIREARM
                        │
                        │
                  RANGE VISITS
                        │
                canonical usage
                        │
                        ▼
                   PART SLOT
                        │
             ┌──────────┴──────────┐
             │                     │
        Part Instance A       Part Instance B
             │                     │
       installation             installation
         periods                  periods
             │                     │
             ▼                     ▼
        lifetime usage        lifetime usage
             │                     │
             └──────────┬──────────┘
                        │
                        ▼
                SERVICE INTERVAL
                        │
                 OK / SOON / DUE
                        │
                        ▼
                  NOTIFICATIONS
```

---

# 103. Product recommendation

The most important architectural decision is to model **physical parts and their installation periods**, not counters.

That gives TriggerNote the ability to correctly answer:

> How many rounds are on the recoil spring currently installed?

but also:

> How long did the previous spring last?

> How many recoil springs has this firearm gone through?

> Was this barrel installed during this specific range visit?

> If I reinstall an old barrel, what is its total lifetime usage?

> If I backdate a replacement, which component should receive the rounds from subsequent range visits?

> If I edit a historical range visit, which physical components should have their lifetime recalculated?

Those are exactly the questions a real parts-life database needs to answer.

The resulting feature should therefore be considered **component lifecycle tracking**, with round count acting as automatically derived usage data.

Cleaning should remain entirely outside this domain and receive its own specification later.