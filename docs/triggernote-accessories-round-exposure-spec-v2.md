# TriggerNote — Accessories & Round-Exposure Tracking Specification

**Version:** 2.0  
**Status:** Product / UX / business-logic specification  
**Updated:** 2026-09-07  
**Scope:** Firearm accessories, mounting history, range-visit round exposure, historical backfill/reconciliation, import/export, and maintenance integration

---

## 1. Purpose

TriggerNote should introduce a first-class **Accessories / Gear** subsystem for firearm-mounted equipment such as:

- red dots,
- rifle scopes,
- magnifiers,
- flashlights,
- lasers,
- suppressors,
- iron sights,
- bipods,
- grips,
- stocks / braces,
- slings,
- mounts / adapters,
- other firearm-mounted equipment.

The feature must allow an accessory to:

1. exist independently from a firearm,
2. be mounted to a firearm,
3. be moved between firearms,
4. preserve its complete mounting history,
5. accumulate round exposure while mounted,
6. attribute that exposure to the correct firearm and range visit,
7. backfill historical usage when a mount is entered retroactively,
8. preserve manually corrected historical usage,
9. participate later in TriggerNote's generic maintenance/reminder system.

The system must remain reliable when users:

- add accessories long after they started using them,
- backdate a mount,
- edit old range visits,
- move accessories between firearms,
- remove an accessory part-way through a visit,
- correct historical mount dates,
- archive firearms or accessories,
- import old backups created before accessories existed.

---

# 2. Core product model

The feature is based on three separate concepts.

## 2.1 Accessory

The persistent physical asset.

Example:

```text
Holosun 507Comp
Serial: 123456
Category: Red dot
```

The accessory exists regardless of whether it is currently mounted.

---

## 2.2 Mount history

A chronological record describing which firearm the accessory was mounted on and when.

Example:

```text
Glock 17
12 Jan 2026 → 18 Mar 2026

CZ Shadow 2
18 Mar 2026 → current
```

Mount history describes the user's claimed equipment configuration over time.

It is used to:

- determine the current firearm,
- detect candidate historical range visits,
- propose accessory usage when creating a new visit,
- validate historical consistency.

Mount history **does not by itself count rounds**.

---

## 2.3 Range-visit accessory usage

A historical usage record saved inside a range visit.

Example:

```text
Range visit — 01 Sep 2026

Glock 17
300 rounds

Accessory usage:
Holosun 507Comp
300 rounds
```

This is the authoritative record saying:

> The accessory was actually exposed to this number of rounds during this visit.

Accessory round totals are derived from these records.

---

# 3. Fundamental architecture rule

The system must follow this separation:

> **Mount history determines what TriggerNote should expect or propose. Saved range-visit accessory usage determines what actually counts toward accessory round exposure.**

This distinction is critical.

It solves:

- historical backfilling,
- partial-visit accessory usage,
- corrected mount dates,
- accessories moved between guns,
- historical data edits,
- avoiding silent retroactive data changes.

---

# 4. Critical edge case: retroactively adding a mounted accessory

This is part of the core feature, not a future enhancement.

## Scenario

The user already has:

```text
01 Sep 2026
Range visit

Gun A
300 rounds
```

Later:

```text
07 Sep 2026
Add accessory

Holosun 507Comp
Mounted on: Gun A
Mounted since: 20 Aug 2026
```

The accessory's entered mount date precedes the existing 01 Sep range visit.

## Required behavior

TriggerNote must detect that the existing visit falls inside the accessory's historical mount interval.

It must then offer to add the visit to the accessory's historical usage.

Example:

```text
HISTORICAL USAGE FOUND

This accessory was marked as mounted on Gun A
during 3 existing range visits.

24 Aug 2026      150 rounds
01 Sep 2026      300 rounds
05 Sep 2026      200 rounds

Potential exposure: 650 rounds

[ SKIP ]
[ REVIEW ]
[ ADD 650 ROUNDS ]
```

If the user confirms:

- TriggerNote adds accessory-usage records to those historical range visits,
- the accessory immediately gains the corresponding exposure,
- usage-by-firearm and recent activity become correct,
- the historical visits visibly show that the accessory was used.

For the original example:

```text
Gun A range visit: 300 rounds
```

becomes:

```text
Gun A range visit: 300 rounds

Gear:
Holosun 507Comp — 300 rounds
```

and the accessory's tracked exposure increases by 300 rounds.

---

# 5. Why historical usage must require confirmation

TriggerNote must **detect and propose** historical usage, but must never silently insert it.

A historical mount date proves only that the accessory was expected to be attached during that period.

It does not prove that it was used for every round.

For example:

```text
Gun A
300 rounds

Holosun mounted:
first 100 rounds

Holosun removed:
remaining 200 rounds
```

The mount date alone cannot express this.

Therefore:

> **Historical mount data creates candidate usage. User confirmation creates actual usage.**

This preserves automation without pretending the app knows more than the user entered.

---

# 6. Information architecture

The Home navigation should become:

```text
GUNS
GEAR
VISITS
AMMO
```

Use **GEAR** in compact navigation.

Use **ACCESSORIES** in normal screen headings and explanatory copy.

Examples:

```text
ACCESSORIES
NEW ACCESSORY
ACCESSORY DETAILS
MANAGE ACCESSORIES
```

---

# 7. Gear list

The GEAR tab displays the accessory inventory.

Example:

```text
┌───────────────────────────────────────┐
│ RED DOT                               │
│ Holosun 507Comp                       │
│ Glock 17                    4,280 RDS │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ SCOPE                                 │
│ Vortex Strike Eagle 1-6x              │
│ AR-15                       1,940 RDS │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ FLASHLIGHT                            │
│ Streamlight TLR-1 HL                  │
│ NOT MOUNTED                 7,120 RDS │
└───────────────────────────────────────┘
```

Each item should show:

1. category,
2. manufacturer + model,
3. current firearm or `NOT MOUNTED`,
4. lifetime round exposure.

Do not put secondary metadata such as purchase price, serial number, notes, or maintenance data into the list item.

---

# 8. Filters

Initial filters:

```text
ALL
MOUNTED
UNMOUNTED
```

Do not introduce category tabs in the first release.

A later filter sheet may support:

- category,
- manufacturer,
- status,
- firearm.

---

# 9. Empty states

Default:

```text
NO ACCESSORIES YET

Track optics, lights and other firearm-mounted gear,
including round exposure across multiple firearms.

[ ADD ACCESSORY ]
```

Mounted filter:

```text
NO MOUNTED ACCESSORIES

Your accessories are currently unmounted.
```

---

# 10. Accessory categories

Use a controlled enum.

```ts
type AccessoryCategory =
  | "red_dot"
  | "scope"
  | "magnifier"
  | "iron_sights"
  | "flashlight"
  | "laser"
  | "suppressor"
  | "bipod"
  | "grip"
  | "stock_brace"
  | "sling"
  | "mount_adapter"
  | "other";
```

Do not create category-specific entities in v1.

Avoid fields such as:

- lumens,
- candela,
- reticle type,
- MOA/MRAD,
- magnification,
- objective diameter,
- battery runtime.

Those can later become optional category-specific metadata.

---

# 11. Accessory storage model

Recommended model:

```ts
type AccessoryStorage = {
  id: string;

  category: AccessoryCategory;

  manufacturer?: string;
  modelName: string;
  serialNumber?: string;

  datePurchased?: string;
  amountPaid?: number;

  /**
   * Round exposure accumulated before TriggerNote
   * started tracking historical range-visit usage.
   */
  initialRounds: number;

  photos?: string[];
  notes?: string;

  status: "active" | "archived";

  mountHistory: AccessoryMountSession[];

  createdAt: string;
  updatedAt: string;
};
```

Required fields:

```text
Category
Model
```

Manufacturer remains optional.

---

# 12. Initial rounds

Add:

```text
ROUNDS BEFORE TRIGGERNOTE
```

Default:

```text
0
```

Example:

```text
Accessory previously had approximately 8,000 rounds.
TriggerNote-tracked visits add 1,500 rounds.

TOTAL EXPOSURE
9,500

Tracked by TriggerNote
1,500

Before TriggerNote
8,000
```

Do not attempt to automatically map `initialRounds` to historical firearms.

It represents unknown/unstructured prior exposure.

---

# 13. Accessory round totals

Do **not** persist a mutable `accessory.roundsFired` counter.

Calculate:

```text
totalExposure
=
initialRounds
+
sum(rangeVisit.accessoryUsage.rounds for accessory)
```

Advantages:

- deleting a visit updates totals automatically,
- editing visit rounds updates totals automatically,
- historical backfill immediately affects totals,
- no counter synchronization bugs,
- import/restore does not need counter repair.

A personal TriggerNote dataset is small enough for derived totals.

Caching may be added later if required.

---

# 14. Mount-session model

Recommended structure:

```ts
type AccessoryMountSession = {
  id: string;

  firearmId: string;
  firearmNameSnapshot: string;

  /**
   * ISO 8601 timestamp.
   */
  mountedAt: string;

  /**
   * Undefined for the current active mount.
   *
   * Treat intervals as [mountedAt, unmountedAt).
   */
  unmountedAt?: string;

  reasonEnded?:
    | "unmounted"
    | "moved"
    | "accessory_archived"
    | "firearm_deleted";

  createdAt: string;
  updatedAt: string;
};
```

---

# 15. Mount-history invariants

## 15.1 One active mount

An accessory may have at most one mount session where:

```ts
unmountedAt === undefined
```

---

## 15.2 No overlapping mount sessions

Historical mount sessions for the same accessory must not overlap.

An accessory cannot be modeled as mounted on two firearms simultaneously.

---

## 15.3 Half-open intervals

Use:

```text
[mountedAt, unmountedAt)
```

Meaning:

- `mountedAt` is inclusive,
- `unmountedAt` is exclusive.

This prevents double-counting at exact move boundaries.

---

# 16. Date precision and same-day ambiguity

Historical range visits may not contain sufficiently precise timestamps to determine whether a mount/unmount happened before or after shooting on the same day.

Example:

```text
01 Sep — Range visit
01 Sep — Accessory mounted
```

If ordering is unknown, TriggerNote must treat the visit as **ambiguous**.

It may appear in reconciliation as:

```text
01 Sep 2026
300 rounds
SAME-DAY TIMING UNCLEAR
```

It must not be silently included or excluded.

The user decides during review.

If both mount history and visit contain precise timestamps, exact timestamp comparison may be used.

---

# 17. Add Accessory form

Recommended sections:

## BASIC INFORMATION

```text
Category *
Manufacturer
Model *
Serial number
```

## PURCHASE

```text
Purchase date
Amount paid
```

## USAGE

```text
Rounds before TriggerNote
```

Helper:

```text
Rounds accumulated before this accessory was tracked
through TriggerNote range visits.
```

## CURRENT SETUP

```text
Mounted on

[ Not mounted ▼ ]

Mounted since

[ Today ▼ ]
```

The mount date is shown only when a firearm is selected.

## PHOTOS

Reuse TriggerNote's existing image infrastructure.

## NOTES

Free-form notes.

## ACTION

Sticky:

```text
[ SAVE ACCESSORY ]
```

---

# 18. Saving an accessory with a historical mount

If:

```text
Mounted since < current date/time
```

TriggerNote must save the accessory and mount session, then run **historical usage reconciliation**.

The user should not need to manually discover old visits.

Flow:

```text
SAVE ACCESSORY
      ↓
Create accessory
      ↓
Create mount session
      ↓
Search historical visits
      ↓
Any candidates?
   /         \
 no           yes
 |             |
Done     Backfill prompt
```

---

# 19. Candidate historical-visit detection

A range-visit firearm usage is a backfill candidate when all of the following are true:

1. the range visit references the same firearm,
2. the visit occurred inside the mount interval,
3. firearm rounds for that visit are greater than zero,
4. the visit does not already contain usage for this accessory/firearm pair,
5. the accessory was not archived at that time according to available history,
6. the date is not definitively outside the mount period.

Conceptually:

```ts
candidate =
  visit.firearmId === mount.firearmId
  && visitDateWithinMountInterval(visit, mount)
  && firearmRounds > 0
  && !hasAccessoryUsage(visit, accessory.id, mount.firearmId);
```

Same-day ambiguous visits are placed in a separate review state rather than automatically treated as definite candidates.

---

# 20. Historical usage summary prompt

If one or more candidates are found:

```text
HISTORICAL USAGE FOUND

This accessory appears to have been mounted during
3 existing range visits with Glock 17.

24 Aug 2026      150 rounds
01 Sep 2026      300 rounds
05 Sep 2026      200 rounds

Potential exposure
650 rounds

[ SKIP ]
[ REVIEW ]
[ ADD 650 ROUNDS ]
```

`ADD 650 ROUNDS` means:

> Add full-visit accessory usage to all unambiguous candidate visits.

It does **not** increment an accessory counter directly.

---

# 21. Review historical usage

The review screen allows per-visit control.

Example:

```text
REVIEW HISTORICAL USAGE

Glock 17

[x] 24 Aug 2026
    Firearm rounds: 150
    Accessory rounds: FULL VISIT · 150

[x] 01 Sep 2026
    Firearm rounds: 300
    Accessory rounds: FULL VISIT · 300

[x] 05 Sep 2026
    Firearm rounds: 200
    Accessory rounds: FULL VISIT · 200

Potential exposure: 650 rounds

[ CANCEL ]
[ ADD SELECTED ]
```

Each visit row should support:

```text
FULL VISIT
CUSTOM
EXCLUDE
```

---

# 22. Partial historical usage

Example:

```text
01 Sep
Gun A — 300 rounds

Accessory used for only 100 rounds
```

User selects:

```text
CUSTOM
100 rounds
```

Stored as:

```ts
{
  accessoryId,
  firearmId,
  rounds: 100,
  mode: "manual",
  attribution: "historical_backfill"
}
```

Validation:

```text
1 <= accessory rounds <= firearm rounds
```

---

# 23. Backfill result

After confirmation:

```text
HISTORICAL USAGE ADDED

3 visits updated
650 rounds added to Holosun 507Comp

[ VIEW ACCESSORY ]
```

Accessory totals and statistics are derived from the newly updated visits.

---

# 24. Skipping historical backfill

`SKIP` must be a valid decision.

TriggerNote must:

- preserve the historical mount session,
- add no usage to range visits,
- show zero tracked exposure from those visits.

The app should not repeatedly interrupt the user on every screen.

However, Accessory Details may show a non-blocking reconciliation notice:

```text
HISTORICAL USAGE NOT REVIEWED

3 visits fall inside this accessory's mount history.

[ REVIEW ]
```

This can disappear once the relevant discrepancy has been reviewed.

---

# 25. Reconciliation state

TriggerNote should not need a permanent boolean like:

```ts
historicalBackfillComplete: true
```

because mount history and visits can change later.

Instead, reconciliation state should be **derived** by comparing:

```text
mount history
vs
saved accessory usage
```

The comparison may produce:

```ts
type AccessoryReconciliation = {
  missingUsage: CandidateUsage[];
  ambiguousUsage: CandidateUsage[];
  outsideMountUsage: ExistingUsageConflict[];
};
```

This allows the app to remain correct after future edits.

---

# 26. Reconciliation categories

## 26.1 Missing usage

A visit lies inside a mount interval, but no accessory usage exists.

Example:

```text
Mount:
01 Aug → current

Visit:
15 Aug — Glock — 200 rounds

Accessory usage:
none
```

Result:

```text
MISSING USAGE
```

Recommended action:

```text
Add full visit
Add custom amount
Ignore
```

---

## 26.2 Ambiguous usage

A visit may fall inside the interval, but exact ordering cannot be determined.

Example:

```text
Mount date:
01 Sep

Visit date:
01 Sep
```

Result:

```text
TIMING UNCLEAR
```

Recommended action:

```text
Add
Add custom amount
Ignore
```

---

## 26.3 Usage outside mount history

A visit contains accessory usage, but edited mount history says the accessory was not mounted then.

Example:

```text
Saved visit:
01 Sep
Holosun — 300 rounds

User changes mount start:
20 Aug → 05 Sep
```

The 01 Sep usage now conflicts with mount history.

Result:

```text
USAGE OUTSIDE MOUNT HISTORY
```

TriggerNote must **never silently remove it**.

Offer:

```text
KEEP RECORDED USAGE
REMOVE FROM VISIT
EDIT MOUNT HISTORY
```

The default/non-destructive action is:

```text
KEEP RECORDED USAGE
```

This protects manually entered reality from an accidentally edited mount date.

---

# 27. Editing mount history

Any of the following must trigger reconciliation:

- changing `mountedAt`,
- changing `unmountedAt`,
- moving an accessory to another firearm,
- inserting a historical mount session,
- deleting/correcting a historical mount session.

After save:

```text
MOUNT HISTORY UPDATED

TriggerNote found changes affecting historical visits.

Missing usage: 2 visits
Conflicts: 1 visit

[ REVIEW ]
[ LATER ]
```

Do not mutate historical visit usage until the user confirms.

---

# 28. Moving an accessory

If currently mounted:

```text
CURRENT SETUP

Glock 17
Mounted since 07 Sep 2026

[ MOVE ]
[ UNMOUNT ]
```

Move flow:

```text
MOVE ACCESSORY

From:
Glock 17

To:
CZ Shadow 2

Effective:
07 Sep 2026 15:10

[ CANCEL ]
[ MOVE ACCESSORY ]
```

The operation:

1. closes the active mount session,
2. sets `reasonEnded = "moved"`,
3. creates a new mount session.

After a **backdated** move, run reconciliation for both:

- the closed source interval,
- the new destination interval.

This may reveal:

- visits that should gain usage on the destination firearm,
- existing usage that no longer matches the source interval.

---

# 29. Unmounting

Flow:

```text
UNMOUNT ACCESSORY?

Holosun 507Comp
from Glock 17

Effective:
07 Sep 2026 15:15

Round history will be preserved.

[ CANCEL ]
[ UNMOUNT ]
```

Unmounting only closes the active mount session.

It does not alter saved range-visit usage.

A backdated unmount runs reconciliation.

---

# 30. Mounting from Firearm Details

Firearm Details:

```text
ACCESSORIES

Holosun 507Comp
RED DOT

Streamlight TLR-1 HL
FLASHLIGHT

[ MANAGE ACCESSORIES ]
```

Manage screen:

```text
GLOCK 17 ACCESSORIES

Mounted

✓ Holosun 507Comp
✓ Streamlight TLR-1 HL

Available

+ Vortex Defender
+ SureFire X300

[ ADD NEW ACCESSORY ]
```

Mounting an unmounted accessory should request an effective date.

Moving an accessory currently mounted elsewhere should show:

```text
MOVE ACCESSORY?

Vortex Defender is currently mounted on CZ Shadow 2.

Move it to Glock 17?

Effective date:
07 Sep 2026

[ CANCEL ]
[ MOVE ]
```

A historical effective date triggers reconciliation.

---

# 31. Range-visit accessory-usage model

Extend range-visit storage with:

```ts
type AccessoryUsage = {
  accessoryId: string;
  firearmId: string;

  accessoryNameSnapshot: string;
  categorySnapshot: AccessoryCategory;

  rounds: number;

  /**
   * full_visit:
   * rounds follow the firearm's visit round count.
   *
   * manual:
   * user explicitly entered a partial/custom count.
   */
  mode: "full_visit" | "manual";

  /**
   * Useful for audit/debugging and future UX.
   */
  attribution:
    | "visit_entry"
    | "historical_backfill"
    | "manual_edit";
};
```

Then:

```ts
type RangeVisitStorage = {
  // existing fields...

  accessoryUsage?: AccessoryUsage[];
};
```

The field remains optional for backward compatibility.

---

# 32. Why usage is stored in the visit

Example:

```text
1 Sep:
Holosun mounted on Glock

2 Sep:
Range visit — Glock — 300 rounds

3 Sep:
Holosun moved to CZ
```

If usage were derived only from **current** mount state, the 2 Sep rounds would become incorrect after the move.

The historical visit therefore stores the actual snapshot.

---

# 33. New range-visit behavior

When a firearm is added to a new range visit, TriggerNote checks the accessory mount state at the visit time/date.

Example:

```text
Glock 17
250 rounds

Mounted gear:
✓ Holosun 507Comp
✓ Streamlight TLR-1 HL
```

By default:

```text
Holosun 507Comp   +250
TLR-1 HL          +250
```

The user should not need to configure normal full-visit usage manually.

---

# 34. Range visit created for a historical date

This is the inverse of the main edge case.

Suppose today the accessory's mount history already says:

```text
Holosun
Glock 17
01 Aug → 01 Oct
```

The user now creates a historical visit:

```text
15 Aug
Glock 17
200 rounds
```

TriggerNote must preselect the Holosun for that historical visit because the visit lies inside the mount interval.

The behavior is identical regardless of whether:

- the visit existed first and mount history was added later, or
- the mount history existed first and the visit was added later.

The same temporal rules apply.

---

# 35. Range Visit form UX

Keep normal logging compact.

Example:

```text
Glock 17
250 rounds

Mounted gear: 2
Holosun 507Comp, TLR-1 HL

[ CHANGE ]
```

`CHANGE` opens:

```text
GEAR USED WITH GLOCK 17

✓ Holosun 507Comp       FULL VISIT
✓ Streamlight TLR-1 HL  FULL VISIT

+ Add accessory
```

---

# 36. Manual partial usage during a visit

Advanced action:

```text
EDIT GEAR USAGE
```

Example:

```text
Holosun 507Comp

○ Full visit — 300 rounds
● Custom — 120 rounds
```

Stored:

```ts
mode: "manual"
rounds: 120
```

This should be available both:

- during normal visit entry,
- during historical-backfill review.

---

# 37. Accessory used on two firearms in one visit

Example:

```text
Glock 17
100 rounds

CZ Shadow 2
200 rounds

Same optic moved during the range visit.
```

The usage model must allow:

```ts
[
  {
    accessoryId: "optic1",
    firearmId: "glock",
    rounds: 100
  },
  {
    accessoryId: "optic1",
    firearmId: "cz",
    rounds: 200
  }
]
```

Total exposure:

```text
300 rounds
```

Do not use an object keyed only by `accessoryId`.

---

# 38. Range Visit Details

Below each firearm:

```text
GLOCK 17
250 rounds

GEAR
Holosun 507Comp       250 rounds
Streamlight TLR-1 HL  250 rounds
```

Partial:

```text
Holosun 507Comp       120 rounds
```

Historical-backfill usage looks identical to normal usage.

The user does not need to care how the record was created.

---

# 39. Editing firearm rounds in a visit

Original:

```text
Glock
200 rounds

Holosun
FULL VISIT
200 rounds
```

User changes:

```text
Glock
250 rounds
```

If:

```ts
mode === "full_visit"
```

update accessory usage automatically:

```text
200 → 250
```

If:

```ts
mode === "manual"
```

keep the custom number.

Example:

```text
Holosun
manual: 120
```

remains:

```text
120
```

unless it becomes invalid because firearm rounds were reduced below 120.

---

# 40. Manual-usage invalidation

Example:

```text
Firearm:
200 rounds

Accessory manual:
150 rounds
```

User edits firearm:

```text
200 → 100
```

The accessory's 150 is now invalid.

Do not silently clamp it.

Show:

```text
GEAR USAGE NEEDS ATTENTION

Holosun 507Comp
150 accessory rounds
100 firearm rounds

Accessory exposure cannot exceed firearm rounds.

[ EDIT ]
```

The visit cannot save until resolved.

---

# 41. Deleting a range visit

Because accessory totals are derived:

```text
delete visit
→ delete accessory usage with visit
→ accessory total decreases automatically
```

No accessory counter mutation is required.

---

# 42. Editing historical accessory usage directly

Range Visit Edit should allow changing:

```text
Holosun
FULL VISIT → CUSTOM

300 → 120
```

Changing to manual marks:

```ts
attribution: "manual_edit"
```

A subsequent mount-history reconciliation must preserve this record unless the user explicitly removes it.

---

# 43. Reconciliation must not overwrite manual history

This is a hard rule.

If a user explicitly says:

```text
Accessory used:
120 rounds
```

TriggerNote must not later change it to:

```text
300
```

merely because the mount interval suggests full-visit usage.

Likewise, moving or changing the mount history does not erase manual usage.

It may flag a conflict.

---

# 44. Accessory Details

Recommended structure:

```text
HOLOSUN 507COMP
RED DOT

        9,480
   ROUNDS EXPOSURE
```

## CURRENT SETUP

```text
Mounted on       Glock 17
Mounted since    18 Mar 2026

[ MOVE ]
[ UNMOUNT ]
```

or:

```text
Not mounted

[ MOUNT ON FIREARM ]
```

## RECONCILIATION NOTICE

Only when needed:

```text
HISTORICAL USAGE NEEDS REVIEW

2 possible missing visits
1 mount-history conflict

[ REVIEW ]
```

## OVERVIEW

```text
Manufacturer     Holosun
Model            507Comp
Category         Red dot
Serial number    ...
Purchased        ...
Amount paid      ...
Added            ...
```

## USAGE

```text
Total exposure           9,480
Tracked by TriggerNote   7,480
Previous rounds          2,000
```

## USAGE BY FIREARM

```text
Glock 17                4,600 rounds
CZ Shadow 2             2,880 rounds
```

## RECENT ACTIVITY

```text
02 Sep 2026
Glock 17
250 rounds

27 Aug 2026
Glock 17
180 rounds
```

## MOUNT HISTORY

```text
Glock 17
18 Mar 2026 → current

CZ Shadow 2
04 Jan 2026 → 18 Mar 2026

Glock 17
21 Nov 2025 → 04 Jan 2026
```

## NOTES

## ACTIONS

```text
[ EDIT ACCESSORY ]
```

## DANGER ZONE

```text
[ ARCHIVE ACCESSORY ]
```

---

# 45. Usage by firearm

Aggregate saved visit usage by:

```text
accessoryId + firearmId
```

Example:

```text
Glock 17       5,250
CZ Shadow 2    3,400
SIG P320         800
```

`initialRounds` is shown separately because it has no reliable firearm attribution.

---

# 46. Recent activity

Derived from range visits:

```ts
rangeVisits
  .flatMap(visit => visit.accessoryUsage ?? [])
  .filter(usage => usage.accessoryId === accessory.id)
  .sort(byVisitDateDescending);
```

Tapping activity opens the corresponding Range Visit Details.

---

# 47. Editing accessory metadata

Changing:

```text
Holosun 507C
```

to:

```text
Holosun 507Comp
```

must not alter:

- range-visit usage,
- mount history,
- round totals.

Historical records retain snapshots for resilience.

Normal UI may display the current accessory name when the entity still exists.

---

# 48. Snapshot fields

Range visits:

```ts
accessoryNameSnapshot
categorySnapshot
```

Mount history:

```ts
firearmNameSnapshot
```

This preserves understandable history if related entities are later archived or unavailable.

---

# 49. Accessory photos

Accessories should support the same image/gallery approach as firearms.

Image infrastructure must recognize:

```text
entityType: "accessory"
```

Export/restore and orphan-image cleanup must include accessory photos.

---

# 50. Archiving accessories

Use:

```ts
status: "active" | "archived"
```

Archive covers:

- sold,
- retired,
- broken,
- lost,
- no longer owned.

Archiving:

1. closes any active mount session,
2. preserves all historical usage,
3. preserves mount history,
4. preserves photos and notes,
5. removes the accessory from default active lists,
6. prevents automatic inclusion in new visits.

---

# 51. Permanent deletion

Prefer archive for any accessory with history.

Permanent deletion is allowed only when there is no meaningful historical data.

At minimum:

```text
no range-visit accessory usage
AND
no historical mount sessions worth preserving
```

Otherwise:

```text
CANNOT DELETE ACCESSORY

This accessory has usage history.
Archive it instead to preserve your records.

[ ARCHIVE ]
```

---

# 52. Firearm deletion

If deleting a firearm with currently mounted accessories:

```text
DELETE FIREARM?

2 accessories are currently mounted:

Holosun 507Comp
Streamlight TLR-1 HL

They will be marked as unmounted.
Their usage history will be preserved.

[ CANCEL ]
[ DELETE FIREARM ]
```

Close sessions with:

```ts
reasonEnded: "firearm_deleted"
```

Historical range-visit usage remains intact.

---

# 53. Meaning of "round exposure"

For this subsystem:

> One accessory round means one firearm round during which the accessory was recorded as being mounted/used.

Examples:

## Red dot

```text
250 firearm rounds
→ 250 optic rounds
```

## Scope

```text
250 firearm rounds
→ 250 scope rounds
```

## Flashlight

```text
250 firearm rounds
→ 250 flashlight rounds
```

The light does not need to have been switched on.

The metric is firearm-mounted recoil/use exposure, not runtime.

## Suppressor

Only rounds explicitly attributed to the suppressor count.

Partial suppressed/unsuppressed visits therefore use manual counts.

---

# 54. Magazines are intentionally excluded

Magazine usage cannot normally be inferred from firearm round count.

Example:

```text
300 firearm rounds
8 magazines
```

There is no reliable way to know the count per magazine.

Magazine tracking would need its own dedicated entry model and is out of scope.

---

# 55. Validation — accessory

Recommended limits:

```text
modelName:
  required
  non-empty
  <= 100 chars

manufacturer:
  optional
  <= 100 chars

serialNumber:
  optional
  <= 100 chars

initialRounds:
  integer
  >= 0

amountPaid:
  >= 0

notes:
  <= 5000 chars
```

---

# 56. Validation — accessory usage

Every record must satisfy:

```text
rounds >= 1
rounds is an integer
firearmId belongs to a firearm in the same visit
rounds <= firearm rounds for that firearm
```

For:

```ts
mode === "full_visit"
```

require:

```text
accessory rounds === firearm rounds
```

For:

```ts
mode === "manual"
```

require:

```text
accessory rounds <= firearm rounds
```

Prevent duplicate:

```text
same accessoryId
+
same firearmId
+
same visit
```

A single accessory may still appear against multiple firearms in one visit.

---

# 57. Validation — mount history

Rules:

1. accessory has at most one active session,
2. sessions do not overlap,
3. `unmountedAt > mountedAt`,
4. archived accessories cannot create new mounts,
5. referenced firearm must exist at time of creating a current mount,
6. historical firearm deletion does not invalidate preserved snapshots,
7. mounting on the already-current firearm is a no-op unless changing the effective start date intentionally.

---

# 58. Historical-backfill service

Create a dedicated domain helper/service rather than embedding reconciliation logic across screens.

Suggested API:

```ts
accessoryUsageService.findReconciliation({
  accessory,
  rangeVisits,
});
```

returns:

```ts
type AccessoryReconciliation = {
  missingUsage: CandidateUsage[];
  ambiguousUsage: CandidateUsage[];
  outsideMountUsage: ExistingUsageConflict[];
};
```

And:

```ts
accessoryUsageService.applyBackfill({
  accessoryId,
  decisions,
});
```

---

# 59. Candidate model

Suggested:

```ts
type CandidateUsage = {
  visitId: string;
  visitDate: string;

  firearmId: string;
  firearmNameSnapshot: string;

  firearmRounds: number;

  mountSessionId: string;

  confidence:
    | "inside_interval"
    | "same_day_ambiguous";
};
```

---

# 60. Backfill decision model

Suggested:

```ts
type BackfillDecision =
  | {
      visitId: string;
      firearmId: string;
      action: "add_full_visit";
    }
  | {
      visitId: string;
      firearmId: string;
      action: "add_manual";
      rounds: number;
    }
  | {
      visitId: string;
      firearmId: string;
      action: "ignore";
    };
```

---

# 61. Conflict decision model

For recorded usage outside edited mount history:

```ts
type UsageConflictDecision =
  | {
      visitId: string;
      accessoryId: string;
      firearmId: string;
      action: "keep";
    }
  | {
      visitId: string;
      accessoryId: string;
      firearmId: string;
      action: "remove";
    };
```

Editing mount history is a separate navigation action.

---

# 62. Applying backfill safely

A historical backfill may update multiple range visits.

The operation should behave atomically from the user's perspective.

Implementation requirements:

1. validate all decisions before writing,
2. load original copies of every affected visit,
3. construct all updated visits in memory,
4. write updates,
5. if any write fails, restore previously written visits from the originals,
6. show failure rather than reporting partial success.

Never leave:

```text
3 requested visits
1 updated
2 failed
```

without reconciliation.

---

# 63. Idempotency

Applying the same backfill twice must not duplicate usage.

Before inserting:

```text
if usage exists for
visitId + accessoryId + firearmId
→ do not add another record
```

If the record already exists, treat it as already reconciled.

---

# 64. Range-visit source of truth after backfill

After backfill, the system must not need to remember:

```text
"650 rounds were backfilled"
```

as a separate counter.

The resulting range visits are sufficient.

Example:

```text
24 Aug — 150
01 Sep — 300
05 Sep — 200
```

Accessory total is naturally:

```text
650
```

Deleting 01 Sep automatically changes it to:

```text
350
```

---

# 65. Current mount state vs historical visits

Changing the current mount must never rewrite old usage.

Example:

```text
Today:
Holosun moves Glock → CZ
```

Old Glock visits keep their Holosun usage.

New CZ visits propose the Holosun.

---

# 66. Mount-date correction example

Initial history:

```text
Holosun
Glock
01 Aug → current
```

Recorded visits:

```text
10 Aug — Glock — 200 — Holosun 200
20 Aug — Glock — 300 — Holosun 300
```

User corrects mount start to:

```text
15 Aug
```

Reconciliation:

```text
1 CONFLICT

10 Aug
Glock
Holosun — 200 rounds

This usage is now outside the recorded mount period.

[ KEEP RECORDED USAGE ]
[ REMOVE USAGE ]
[ EDIT MOUNT HISTORY ]
```

Nothing is removed automatically.

---

# 67. Historical mount added across multiple visits

Example:

```text
Mount:
Gun A
01 Jan → 01 Apr
```

Existing visits:

```text
05 Jan — 100 rounds
10 Feb — 200 rounds
15 Mar — 150 rounds
20 Apr — 300 rounds
```

Candidates:

```text
05 Jan — 100
10 Feb — 200
15 Mar — 150
```

Not candidate:

```text
20 Apr — outside interval
```

Potential exposure:

```text
450 rounds
```

---

# 68. Historical move example

Existing visits:

```text
01 Sep — Gun A — 100
04 Sep — Gun A — 150
05 Sep — Gun B — 200
08 Sep — Gun B — 100
```

Later user records:

```text
Accessory on Gun A:
01 Aug → 05 Sep 12:00

Accessory on Gun B:
05 Sep 12:00 → current
```

Expected reconciliation:

```text
01 Sep Gun A — candidate
04 Sep Gun A — candidate
05 Sep Gun B — candidate/ambiguous depending on visit time
08 Sep Gun B — candidate
```

No Gun A usage should be proposed after the move boundary.

---

# 69. Historical visit with multiple ammunition entries

Accessory exposure is based on total rounds fired by the relevant firearm in the visit, not on ammunition row count.

Example:

```text
Glock 17

9 mm FMJ      150
9 mm JHP       50

Firearm total 200
```

Full-visit accessory exposure:

```text
200
```

Do not create one accessory record per ammo type.

---

# 70. Multiple accessories

If Gun A has:

```text
Holosun 507Comp
TLR-1 HL
```

and historical visit:

```text
Gun A
300 rounds
```

a backfill for both accessories may produce:

```text
Holosun — 300
TLR-1 — 300
```

This is correct.

Accessory exposure is independent per accessory.

---

# 71. Import/export

Extend transfer data:

```ts
type ImportData = {
  firearms: FirearmStorage[];
  ammunition: AmmunitionStorage[];
  rangeVisits: RangeVisitStorage[];
  accessories?: AccessoryStorage[];
};
```

Recommended backup format version:

```text
1.2.0
```

Old backups without `accessories` or `accessoryUsage` remain valid.

Interpret:

```ts
accessories ?? []
visit.accessoryUsage ?? []
```

---

# 72. Import behavior

Import should preserve:

- accessory entities,
- mount history,
- accessory usage stored in range visits,
- accessory photos,
- manual/full-visit mode,
- attribution metadata.

Do not recalculate or regenerate historical backfill during import.

Imported range visits already represent the authoritative usage history.

After import, the app may calculate reconciliation notices if mount history and imported visit usage disagree.

It must not mutate imported data automatically.

---

# 73. Restore behavior

Restore:

1. clear current accessory entities,
2. restore accessories,
3. restore range visits,
4. restore images,
5. rebuild indexes,
6. calculate derived totals on read.

No stored accessory counter rebuild is required.

---

# 74. Merge behavior

If an imported accessory ID already exists, follow TriggerNote's normal entity merge policy.

Range-visit usage remains tied to visit records.

Do not increment counters during merge.

Idempotent import must not double-count accessory exposure.

---

# 75. Storage architecture

Follow TriggerNote's existing per-entity storage pattern.

Add:

```ts
STORAGE_KEYS.ACCESSORIES
ENTITY_KEYS.ACCESSORY
ENTITY_KEYS.ACCESSORIES_INDEX
```

Conceptually:

```text
@storage:accessory:{id}
@storage:accessories-index
```

Add:

```ts
accessoryKey(id)
```

---

# 76. Accessory service API

Recommended:

```ts
accessoryService.getAccessories()

accessoryService.getAccessory(id)

accessoryService.saveAccessory(data)

accessoryService.archiveAccessory(id)

accessoryService.restoreAccessory(id)

accessoryService.deleteAccessory(id)

accessoryService.mountAccessory(
  accessoryId,
  firearmId,
  mountedAt
)

accessoryService.unmountAccessory(
  accessoryId,
  unmountedAt
)

accessoryService.moveAccessory(
  accessoryId,
  newFirearmId,
  movedAt
)

accessoryService.getAccessoriesMountedOnFirearm(
  firearmId,
  atDate?
)

accessoryService.getCurrentMount(
  accessory
)

accessoryService.getUsageStats(
  accessoryId,
  rangeVisits
)
```

Historical lookup should support:

```ts
getAccessoriesMountedOnFirearm(firearmId, visitDate)
```

because historical visit entry depends on configuration at that time, not configuration today.

---

# 77. Reconciliation API

Recommended:

```ts
accessoryUsageService.findReconciliation(
  accessoryId
)

accessoryUsageService.applyBackfill(
  accessoryId,
  decisions
)

accessoryUsageService.resolveConflicts(
  accessoryId,
  decisions
)
```

Do not duplicate interval/backfill logic in UI components.

---

# 78. Navigation additions

Add:

```ts
AddAccessory: undefined;

AccessoryDetails: {
  id: string;
};

EditAccessory: {
  id: string;
};

ManageFirearmAccessories: {
  firearmId: string;
};

AccessoryReconciliation: {
  accessoryId: string;
};
```

---

# 79. Proposed source structure

```text
src/

screens/
  add-accessory/
  edit-accessory/
  accessory-details/
  manage-firearm-accessories/
  accessory-reconciliation/

screens/home/
  AccessoriesTab.tsx
  AccessoryListItem.tsx

services/
  accessory-service.ts
  accessory-usage-service.ts

validation/
  inputSchemas.ts
  storageSchemas.ts
```

Possible reusable components:

```text
AccessoryPicker
AccessoryCategoryPicker
AccessoryUsageEditor
AccessoryMountHistory
MountedAccessoriesList
HistoricalUsageReview
UsageConflictReview
```

---

# 80. Home loading

Load accessories alongside existing home data.

Conceptually:

```ts
Promise.all([
  storage.getFirearms(),
  storage.getRangeVisits(),
  storage.getAmmunition(),
  storage.getAccessories(),
  storage.getCurrency(),
]);
```

Usage totals are derived from loaded range visits.

---

# 81. Maintenance integration

Accessory round exposure should feed the same generic maintenance architecture planned for:

- firearm cleaning,
- firearm parts,
- part replacement,
- service intervals.

Future maintenance engine:

```ts
getRoundCount({
  entityType: "accessory",
  entityId,
});
```

Examples:

```text
Suppressor
Cleaning interval: 1,000 rounds

Current:
870 since cleaning

130 remaining
```

or:

```text
Optic
Inspect mount every 5,000 rounds
```

---

# 82. No universal accessory service intervals

TriggerNote must not invent generic manufacturer-independent limits.

Do not ship rules such as:

```text
Replace red dot after 20,000 rounds.
```

Accessory maintenance thresholds should come from:

- user configuration,
- future known manufacturer guidance,
- future equipment profiles.

---

# 83. Calendar-based maintenance

The maintenance architecture should later support time-based tasks:

```text
Replace optic battery every 12 months
Inspect mount annually
Verify zero every 6 months
```

Do not try to convert these to round intervals.

---

# 84. Shared round-consumption model

Long-term architecture:

```text
Range Visit
     ↓
Round usage
     ↓
 ┌─────────────────┐
 │ Firearm         │
 │ Installed parts │
 │ Accessories     │
 └─────────────────┘
```

Example:

```text
Glock visit
250 rounds
```

may produce:

```text
Glock lifetime        +250
Recoil spring life    +250
Extractor life        +250
Holosun exposure      +250
TLR-1 exposure        +250
```

Range visits remain the event describing what happened.

---

# 85. Notifications

Accessory notifications should use the generic maintenance engine.

Example:

```text
Vortex Razor
Inspect mount every 2,000 rounds
```

Possible thresholds:

```text
80%
90%
100%
```

Do not create an accessories-only notification system.

---

# 86. Search and sorting

Search may later cover:

- manufacturer,
- model,
- serial number,
- category,
- notes,
- currently mounted firearm.

Potential sorting:

- name,
- most rounds,
- least rounds,
- category,
- mounted first.

Neither is required for the first implementation.

---

# 87. Error states

Examples:

```text
Failed to load accessories.
Failed to save accessory.
Failed to mount accessory.
Failed to update accessory setup.
Failed to reconcile historical usage.
Accessory not found.
Firearm not found.
```

Backfill failure:

```text
HISTORICAL USAGE NOT UPDATED

TriggerNote couldn't safely update all selected visits.
No partial changes were kept.

[ TRY AGAIN ]
```

---

# 88. Unsaved changes

Accessory Add/Edit forms follow TriggerNote's standard unsaved-change behavior.

Mount/move/unmount actions save immediately after confirmation.

Historical usage review is an explicit action and may be canceled without changing visits.

---

# 89. Existing-user migration

After updating TriggerNote:

```text
GEAR
```

simply starts empty.

Existing visits have:

```ts
accessoryUsage === undefined
```

Existing firearms and ammunition remain untouched.

There is no automatic database migration guessing historical accessory ownership.

---

# 90. Onboarding an existing accessory

Example:

```text
ADD ACCESSORY

Holosun 507Comp

Rounds before TriggerNote:
5,000

Mounted on:
Glock 17

Mounted since:
01 Jun 2026
```

Existing visits since 01 Jun are detected.

Suppose:

```text
10 Jun — 200
20 Jun — 300
```

TriggerNote offers:

```text
Potential tracked exposure:
500
```

If confirmed:

```text
Previous rounds:
5,000

Tracked:
500

Total:
5,500
```

This is intentional.

`initialRounds` and historical backfill are additive because they represent different things.

The user must avoid entering the same rounds twice.

Helper copy should make this clear:

```text
"Rounds before TriggerNote" should include only rounds
that will not be reconstructed from existing TriggerNote visits.
```

---

# 91. Preventing accidental double counting during onboarding

If the user enters non-zero `initialRounds` **and** chooses a historical mount that discovers old TriggerNote visits, the backfill prompt should display:

```text
CHECK PREVIOUS ROUND COUNT

You entered:
5,000 rounds before TriggerNote

TriggerNote also found:
500 rounds in existing range visits

Those 500 rounds will be added on top of the previous-round value.

Make sure they aren't already included in the 5,000.

[ BACK ]
[ CONTINUE ]
```

This is an important UX safeguard.

---

# 92. Future configuration/preset support

The model should leave room for:

```text
Glock Competition Setup

Holosun 507Comp
TLR-1 HL
Magwell
```

or:

```text
AR Competition Setup

Vortex Razor
Scalarworks mount
SureFire light
```

Not part of this release.

---

# 93. Scope exclusions

Explicitly out of scope:

- magazine-specific round tracking,
- battery inventory,
- flashlight/laser runtime hours,
- optic zero data,
- zero-shift measurement,
- ballistic profiles,
- automatic manufacturer specification lookup,
- accessory compatibility recommendations,
- accessory-to-accessory mount graphs,
- setup presets,
- cloud synchronization,
- a separate accessory maintenance engine.

Historical visit backfill **is in scope**.

---

# 94. Testing — CRUD

Test:

```text
create accessory
edit accessory
archive accessory
restore accessory
delete unused accessory
prevent deletion of historically used accessory
```

---

# 95. Testing — mount history

Test:

```text
mount unmounted accessory
unmount accessory
move accessory
move to same firearm
prevent two active mounts
prevent overlapping historical sessions
mount to borrowed firearm
archive mounted accessory
delete firearm with mounted accessory
historical mount date
historical unmount date
historical move
same-day ambiguous mount
```

---

# 96. Testing — normal range visits

Test:

```text
mounted accessory automatically included
unmounted accessory not included

200 firearm rounds
→ 200 accessory rounds

edit visit 200 → 250
→ full-visit accessory becomes 250

manual accessory 120
→ remains 120

delete visit
→ calculated accessory lifetime decreases

multiple accessories
→ each receives firearm exposure

accessory moved between firearms
→ historical visit data remains unchanged
```

---

# 97. Testing — historical backfill

## Case A — main edge case

Given:

```text
01 Sep
Gun A
300 rounds
```

When:

```text
07 Sep
Accessory added

Gun A
Mounted since 20 Aug
```

Then:

```text
01 Sep visit is detected
300 rounds proposed
```

When user confirms:

```text
visit gains accessoryUsage = 300
accessory tracked exposure = 300
```

---

## Case B — multiple visits

Given:

```text
24 Aug — Gun A — 150
01 Sep — Gun A — 300
05 Sep — Gun A — 200
```

When:

```text
mounted since 20 Aug
```

Then:

```text
3 visits detected
650 rounds proposed
```

---

## Case C — outside interval

Given:

```text
10 Aug — Gun A — 200
01 Sep — Gun A — 300
```

When:

```text
mounted since 20 Aug
```

Then:

```text
10 Aug excluded
01 Sep detected
```

---

## Case D — partial backfill

Given:

```text
01 Sep — Gun A — 300
```

When user reviews and selects:

```text
CUSTOM — 100
```

Then:

```text
accessory usage = 100
mode = manual
```

---

## Case E — skip

Given candidate historical visits, when user selects:

```text
SKIP
```

Then:

```text
mount history saved
visits unchanged
round total unchanged
```

---

## Case F — idempotent retry

Given a historical visit already contains:

```text
accessoryId X
firearmId A
```

When reconciliation runs again:

```text
do not insert duplicate usage
```

---

## Case G — same-day ambiguity

Given:

```text
01 Sep — visit
01 Sep — mount start
```

with no precise times:

```text
visit shown as ambiguous
not auto-selected by ADD ALL
requires review
```

---

# 98. Testing — mount-history conflicts

## Case A — mount start moved later

Given:

```text
01 Sep visit contains 300 Holosun rounds
mount start = 20 Aug
```

When user changes mount start to:

```text
05 Sep
```

Then:

```text
01 Sep usage is flagged
usage is not removed
```

---

## Case B — backdated unmount

Given:

```text
10 Sep visit contains 200 accessory rounds
current unmount = 15 Sep
```

When user changes unmount to:

```text
05 Sep
```

Then:

```text
10 Sep usage is flagged
not removed automatically
```

---

## Case C — manual historical usage

Given:

```text
01 Sep
manual accessory usage = 120
```

When mount dates later conflict:

```text
120 remains stored
conflict shown
```

---

# 99. Testing — visit editing

Test:

```text
full visit follows firearm round changes

manual usage does not follow firearm round changes

manual usage > new firearm total blocks save

adding accessory manually to old visit updates totals

removing accessory from visit updates totals
```

---

# 100. Testing — import/export

Test:

```text
new backup with accessories
old backup without accessories
accessory mount history
accessory usage
manual/full-visit modes
historical attribution metadata
accessory photos
merge
restore
idempotent import
```

---

# 101. Critical invariants

These are architecture rules.

## Invariant 1

An accessory has at most one active mount.

## Invariant 2

Historical mount sessions do not overlap.

## Invariant 3

Mount history determines expected/candidate usage.

## Invariant 4

Saved range-visit accessory usage determines counted historical exposure.

## Invariant 5

Historical mounts may propose backfill but never silently create usage.

## Invariant 6

Mount-history edits may flag conflicts but never silently remove recorded usage.

## Invariant 7

Accessory totals are derived:

```text
initialRounds + saved visit exposure
```

## Invariant 8

Changing the current mount never rewrites historical visits.

## Invariant 9

Manual accessory usage is preserved until explicitly changed.

## Invariant 10

Accessory usage cannot exceed firearm rounds for the same visit/firearm.

## Invariant 11

Backfill is idempotent.

## Invariant 12

History-bearing accessories are archived rather than hard-deleted.

## Invariant 13

Old TriggerNote backups remain importable.

---

# 102. Implementation sequence

## Slice 1 — Domain and persistence

Implement:

```text
AccessoryStorage
AccessoryMountSession
storage keys
Zod schemas
AccessoryService
CRUD
archive
mount history
```

---

## Slice 2 — Gear inventory UX

Implement:

```text
GEAR tab
AccessoryListItem
Add Accessory
Accessory Details
Edit Accessory
photos
empty states
```

---

## Slice 3 — Mounting

Implement:

```text
mount
unmount
move
effective date/time
mount history
Firearm Details integration
Manage Accessories
```

---

## Slice 4 — Range-visit usage model

Implement:

```text
AccessoryUsage
automatic mounted-gear snapshot
full-visit mode
manual mode
Range Visit Details
Range Visit Edit
derived totals
```

---

## Slice 5 — Historical reconciliation

Implement:

```text
find candidate past visits
same-day ambiguity
historical backfill prompt
review screen
custom exposure
idempotent application
mount-history conflict detection
conflict review
```

Historical reconciliation is required for feature completion.

It is not optional polish.

---

## Slice 6 — Analytics

Implement:

```text
total exposure
TriggerNote-tracked exposure
previous rounds
usage by firearm
recent activity
reconciliation notice
```

---

## Slice 7 — Import/export

Implement:

```text
backup v1.2.0
accessories
mount history
accessoryUsage
accessory photos
backward compatibility
merge/restore tests
```

---

## Slice 8 — Maintenance integration

Once the maintenance engine exists:

```text
accessory round counters exposed to maintenance
round-based accessory service rules
calendar-based accessory service rules
notifications
```

---

# 103. Full acceptance scenario

The feature should pass the following end-to-end scenario.

## Step 1 — Existing historical visit

User already has:

```text
01 Sep 2026
Range visit

Glock 17
300 rounds
```

No accessories are recorded.

---

## Step 2 — Add accessory later

On 07 Sep:

```text
ADD ACCESSORY

Holosun 507Comp
Red dot

Rounds before TriggerNote:
1,000

Mounted on:
Glock 17

Mounted since:
20 Aug 2026
```

---

## Step 3 — Detect historical usage

After save:

```text
HISTORICAL USAGE FOUND

01 Sep 2026
Glock 17
300 rounds

Potential exposure:
300 rounds

[ SKIP ]
[ REVIEW ]
[ ADD 300 ROUNDS ]
```

---

## Step 4 — Confirm

User selects:

```text
ADD 300 ROUNDS
```

The 01 Sep visit now contains:

```text
Glock 17
300 rounds

GEAR
Holosun 507Comp
300 rounds
```

Accessory details:

```text
TOTAL EXPOSURE
1,300

Tracked by TriggerNote
300

Previous rounds
1,000
```

---

## Step 5 — New visit

User records:

```text
10 Sep
Glock 17
200 rounds
```

Because the Holosun is currently mounted, it is preselected:

```text
Holosun
FULL VISIT
200 rounds
```

Accessory total becomes:

```text
1,500
```

---

## Step 6 — Move accessory

User moves:

```text
Glock 17 → CZ Shadow 2
```

Mount history:

```text
Glock 17
20 Aug → 15 Sep

CZ Shadow 2
15 Sep → current
```

No old Glock usage changes.

---

## Step 7 — New CZ visit

```text
20 Sep
CZ Shadow 2
500 rounds
```

Holosun:

```text
500 rounds
```

Total:

```text
2,000
```

Usage by firearm:

```text
Glock 17       500
CZ Shadow 2    500
Previous     1,000
```

---

## Step 8 — Correct historical visit

User edits:

```text
01 Sep Glock
300 → 250
```

Because Holosun usage is `full_visit`:

```text
300 → 250
```

Total automatically becomes:

```text
1,950
```

---

## Step 9 — Correct mount history incorrectly

User changes historical Glock mount start:

```text
20 Aug → 05 Sep
```

The saved 01 Sep Holosun usage now falls outside mount history.

TriggerNote shows:

```text
HISTORICAL USAGE NEEDS REVIEW

01 Sep
Glock 17
Holosun — 250 rounds

This usage is outside the current mount history.

[ KEEP RECORDED USAGE ]
[ REMOVE USAGE ]
[ EDIT MOUNT HISTORY ]
```

No data is silently removed.

---

## Step 10 — Archive

User eventually archives the Holosun.

All of the following remain:

```text
lifetime exposure
previous-round value
range-visit usage
usage by firearm
mount history
photos
notes
purchase data
```

This is the expected finished behavior.

---

# 104. Final architecture

```text
                    ┌─────────────────┐
                    │    ACCESSORY    │
                    │  Holosun 507   │
                    └────────┬────────┘
                             │
                      mount history
                             │
          ┌──────────────────┼──────────────────┐
          ↓                  ↓                  ↓
      Glock 17          CZ Shadow 2           AR-15
          │                  │
          └──────────┬───────┘
                     │
               RANGE VISITS
                     │
                     ↓
              accessoryUsage[]
                     │
                     ↓
               ROUND EXPOSURE
                     │
          ┌──────────┼────────────┐
          ↓          ↓            ↓
       lifetime   by firearm   maintenance
```

The core rule remains:

> **Mount history answers "where should this accessory have been?"**
>
> **Range-visit accessory usage answers "where and for how many rounds was it actually used?"**

Historical mounts therefore trigger **reconciliation**, not silent recalculation.

That gives TriggerNote the convenience of automatic historical detection without sacrificing the auditability and correctness of explicit range-visit records.
