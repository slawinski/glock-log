# TriggerNote — Firearm Visual Loadout System
## Architecture Review & Improvement Specification

**Repository:** `https://github.com/slawinski/glock-log`  
**Feature:** Dynamic firearm placeholder / loadout artwork  
**Status:** Proposed refactor  
**Primary goal:** Make firearm illustrations automatically reflect firearm type and currently mounted accessories without storing cosmetic state in firearm records.

---

# 1. Purpose

TriggerNote should visually reflect the user's current firearm configuration in a way that feels similar to modifying equipment in a game:

- add a pistol → see a pistol;
- mount a red dot → the pistol gains a red dot;
- mount a flashlight → it gains a flashlight;
- mount both → both are visible;
- remove one → only that accessory disappears;
- move an accessory to another firearm → both firearm illustrations update automatically;
- mount a red dot and magnifier → both appear together when the firearm visual profile supports them.

The feature is intentionally cosmetic. It must therefore remain **derived presentation state** and must never become a second source of truth for firearm or accessory data.

The user should never have to understand or manually manage the artwork system.

---

# 2. Executive Decision

Refactor the current system from:

> **stored placeholder + full-image variant swapping**

to:

> **firearm type + current mounted accessories → derived layered artwork**

Recommended model:

```text
Firearm
  firearmType = rifle
        +
Mounted accessories
  red_dot
  magnifier
  flashlight
        ↓
Visual resolver
        ↓
rifle/base
rifle/red-dot layer
rifle/magnifier layer
rifle/flashlight layer
        ↓
Rendered together
```

Nothing about the generated appearance should be persisted on the firearm.

The persisted data should describe reality:

```text
Firearm = rifle

Accessory A = red_dot
mounted on Firearm

Accessory B = magnifier
mounted on Firearm

Accessory C = flashlight
mounted on Firearm
```

The UI decides how that state looks.

---

# 3. Problems in the Current Implementation

## 3.1 Placeholder artwork is stored as firearm photo data

The current implementation stores generated placeholders inside `firearm.photos`, for example:

```text
placeholder:pistol-placeholder.png
```

This conflates:

```text
User media
firearm.photos
```

with:

```text
System presentation
generated firearm artwork
```

These concerns should be separated.

### Consequences

A cosmetic accessory change can mutate the firearm record.

System artwork participates in photo ordering.

The generated illustration can become the first gallery image.

Changing an accessory can change `firearm.updatedAt`.

Accessory state and firearm visual state can become inconsistent.

---

# 4. Current Variant Selection Does Not Scale

The existing approach chooses a single complete firearm image based on accessory precedence.

Conceptually:

```text
red_dot
scope
magnifier
laser
flashlight
suppressor
```

Only one variant wins.

That makes the system a **variant selector**, not a composition engine.

Example:

```text
Pistol
+ Red dot
+ Flashlight
```

cannot naturally become:

```text
pistol + red dot + flashlight
```

without either:

1. hiding one accessory through precedence; or
2. creating a dedicated combined PNG.

The second approach creates a combinatorial asset problem.

If six binary accessories are supported:

```text
2^6 = 64
```

possible configurations exist for one firearm type.

For six firearm types:

```text
6 × 64 = 384
```

potential composite illustrations.

This is not a maintainable asset strategy.

---

# 5. Synchronization Is Unnecessary Derived State

Accessory mounting already has the actual source of truth:

```text
Accessory.mountHistory
```

The current system then writes another representation of that same state into the firearm image field.

Conceptually:

```text
SOURCE OF TRUTH

Accessory.mountHistory
        ↓

DERIVED INFORMATION ALSO STORED

firearm.photos[0] =
"placeholder:pistol-reddot-placeholder.png"
```

The second value can always be derived and therefore should not be persisted.

---

# 6. Correctness Problems Caused by Synchronization

The current architecture can create several stale-state cases.

## 6.1 Visual synchronization can fail independently

An accessory can mount successfully while the cosmetic firearm placeholder update fails.

Result:

```text
Accessory:
mounted correctly

Firearm artwork:
stale
```

Derived rendering removes this failure mode entirely.

## 6.2 Creating an accessory already mounted can miss visual sync

If an accessory is created with an initial mount, mount history can be correct while the firearm artwork remains unchanged.

## 6.3 Editing the category of a mounted accessory can leave stale artwork

Example:

```text
Accessory:
red_dot → flashlight

Domain state:
flashlight

Stored firearm placeholder:
may still show red dot
```

Again, derived rendering eliminates this class of bug.

---

# 7. Introduce Explicit `FirearmType`

The firearm should explicitly describe its physical archetype.

Recommended schema:

```ts
export const firearmTypeSchema = z.enum([
  "pistol",
  "revolver",
  "pcc",
  "rifle",
  "bolt_action_rifle",
  "shotgun",
  "other",
]);

export type FirearmType = z.infer<typeof firearmTypeSchema>;
```

Persist:

```ts
FirearmStorage {
  ...
  firearmType: FirearmType;
}
```

Use the user-facing label:

**Firearm type**

rather than **Category**.

This avoids ambiguity with accessory categories and avoids regulatory/legal interpretations of "category".

---

# 8. Recommended Initial Firearm Types

## Pistol

Generic semi-automatic pistol.

## Revolver

Generic revolver.

## PCC

Pistol-caliber carbine / compact carbine archetype.

## Rifle

Generic tactical or semi-automatic rifle.

## Bolt-action rifle

Separate from rifle because:

- silhouette differs significantly;
- typical optics differ;
- bipod placement differs;
- accessory combinations differ.

## Shotgun

Generic shotgun.

## Other

Neutral fallback for unsupported firearm types.

Do not continue using `carbine` as a separate domain type because it overlaps both PCC and rifle.

Existing `carbine` artwork can migrate to `rifle`.

---

# 9. Add Firearm UX Redesign

The user should no longer choose a placeholder image.

Instead:

```text
MODEL
CZ P-09 C

FIREARM TYPE
[Pistol]

CALIBER
9×19
```

Selecting firearm type should immediately preview the corresponding generated artwork.

The user is no longer answering:

> Which image do you want?

They are answering:

> What kind of firearm is this?

That is meaningful firearm metadata and preserves immersion.

---

# 10. Photos UX

`firearm.photos` should contain **only actual user photos**.

Generated artwork must not participate in:

- photo picker;
- photo ordering;
- gallery navigation;
- persisted photo paths.

Display rule:

```text
if selected user cover photo exists:
    show user photo
else:
    show generated firearm artwork
```

If the last user photo is removed, the generated artwork automatically returns.

---

# 11. Rendering Architecture: Layered Artwork

Instead of:

```text
pistol-red-dot-light.png
```

use:

```text
pistol/base.png
pistol/layers/red-dot.png
pistol/layers/flashlight.png
```

Every layer uses:

- identical square canvas size;
- identical firearm position;
- identical perspective;
- transparent background;
- accessory positioned correctly relative to base;
- matching line style and scale.

Example:

```text
Layer 0: rifle/base.png
Layer 1: rifle/layers/suppressor.png
Layer 2: rifle/layers/flashlight.png
Layer 3: rifle/layers/magnifier.png
Layer 4: rifle/layers/red-dot.png
```

The final image is created by stacking all supported layers.

---

# 12. Asset Scalability

With six firearm types and six binary accessories:

### Pre-combined strategy

```text
6 × 2^6 = 384
```

potential full illustrations.

### Layered strategy

```text
6 base images
+
up to 6 × 6 accessory layers
=
up to 42 assets
```

In practice, fewer will be required because not every accessory is relevant to every firearm type.

---

# 13. Asset Directory Redesign

Recommended structure:

```text
assets/
└── images/
    ├── ammunition/
    │   ├── 22.png
    │   ├── 357.png
    │   ├── 45.png
    │   ├── 556.png
    │   ├── 9mm.png
    │   └── shotgun-shell.png
    │
    ├── firearms/
    │   ├── pistol/
    │   │   ├── base.png
    │   │   └── layers/
    │   │       ├── red-dot.png
    │   │       ├── flashlight.png
    │   │       ├── laser.png
    │   │       └── suppressor.png
    │   │
    │   ├── revolver/
    │   │   ├── base.png
    │   │   └── layers/
    │   │
    │   ├── pcc/
    │   │   ├── base.png
    │   │   └── layers/
    │   │       ├── red-dot.png
    │   │       ├── magnifier.png
    │   │       ├── scope.png
    │   │       ├── flashlight.png
    │   │       ├── laser.png
    │   │       ├── suppressor.png
    │   │       └── grip.png
    │   │
    │   ├── rifle/
    │   │   ├── base.png
    │   │   └── layers/
    │   │       ├── red-dot.png
    │   │       ├── magnifier.png
    │   │       ├── scope.png
    │   │       ├── flashlight.png
    │   │       ├── laser.png
    │   │       ├── suppressor.png
    │   │       ├── bipod.png
    │   │       └── grip.png
    │   │
    │   ├── bolt-action-rifle/
    │   │   ├── base.png
    │   │   └── layers/
    │   │       ├── scope.png
    │   │       ├── suppressor.png
    │   │       └── bipod.png
    │   │
    │   ├── shotgun/
    │   │   ├── base.png
    │   │   └── layers/
    │   │       ├── red-dot.png
    │   │       └── flashlight.png
    │   │
    │   └── other/
    │       └── base.png
    │
    └── ui/
```

Stop using `placeholder` in filenames.

These assets are better described as:

- firearm artwork;
- firearm visuals;
- loadout artwork.

---

# 14. Do Not Dynamically Construct `require()` Paths

Avoid:

```ts
require(`../../assets/images/firearms/${type}/${category}.png`)
```

Use a statically declared typed manifest.

Example:

```ts
export const FIREARM_VISUAL_ASSETS = {
  rifle: {
    base: require(
      "../../assets/images/firearms/rifle/base.png"
    ),

    layers: {
      red_dot: {
        source: require(
          "../../assets/images/firearms/rifle/layers/red-dot.png"
        ),
        visualSlot: "primary_optic",
        zIndex: 40,
      },

      magnifier: {
        source: require(
          "../../assets/images/firearms/rifle/layers/magnifier.png"
        ),
        visualSlot: "optic_auxiliary",
        zIndex: 35,
      },

      flashlight: {
        source: require(
          "../../assets/images/firearms/rifle/layers/flashlight.png"
        ),
        visualSlot: "side_rail",
        zIndex: 20,
      },
    },
  },
} satisfies FirearmVisualAssetManifest;
```

Suggested feature module:

```text
src/
└── features/
    └── firearm-visuals/
        ├── firearmVisualAssets.ts
        ├── firearmVisualResolver.ts
        ├── FirearmArtwork.tsx
        ├── visualSlots.ts
        └── types.ts
```

---

# 15. Visual Slots

The renderer should model physical accessory positions rather than only using a global exclusivity list.

Recommended slots:

```ts
type FirearmVisualSlot =
  | "primary_optic"
  | "optic_auxiliary"
  | "muzzle"
  | "underbarrel"
  | "side_rail"
  | "support"
  | "other";
```

Typical mapping:

```text
red_dot      → primary_optic
scope        → primary_optic
magnifier    → optic_auxiliary
flashlight   → side_rail
laser        → side_rail or dedicated slot
suppressor   → muzzle
grip         → underbarrel
bipod        → support
```

This lets accessories compose naturally when they occupy different slots.

---

# 16. Red Dot + Magnifier Combination

This combination is an explicit requirement.

It must render as:

```text
Rifle
+ red_dot
+ magnifier
        ↓
base
+ red-dot layer
+ magnifier layer
```

`red_dot` and `magnifier` must **not** be mutually exclusive.

Example configuration:

```ts
red_dot: {
  source: ...,
  visualSlot: "primary_optic",
  zIndex: 40,
},

magnifier: {
  source: ...,
  visualSlot: "optic_auxiliary",
  zIndex: 35,
},
```

Result:

```text
Rifle
+ red dot
+ magnifier
+ flashlight
+ suppressor

→ all five visual layers may be displayed simultaneously
```

This is one of the strongest reasons to use layered artwork instead of full-image replacement.

---

# 17. Visual Conflicts

Some accessories occupy the same functional or visual position.

Examples:

```text
red dot vs scope
```

Both use:

```text
primary_optic
```

If two mounted accessories compete for the same slot, the renderer should apply a deterministic display rule.

Recommended V1 rule:

> Render the most recently mounted compatible accessory for that slot.

Example:

```text
scope mounted 1 Aug
red dot mounted 5 Aug

both use primary_optic

→ red dot visual is rendered
```

The underlying accessory mount records remain untouched.

This is a **visual conflict rule**, not a domain validation rule.

---

# 18. Domain State Must Remain Independent from Visual Support

TriggerNote must not reject a real accessory configuration merely because no artwork exists.

Example:

```text
shotgun + magnifier
```

If the user really mounted it:

```text
mount history remains valid
```

If no matching visual layer exists:

```text
generated shotgun artwork simply omits that layer
```

Optional development warning:

```text
Missing firearm artwork layer:
firearmType=shotgun
accessoryCategory=magnifier
```

Visual support must never become business logic.

---

# 19. Derived Visual State

Introduce a pure resolver.

Conceptually:

```ts
type MountedAccessoryVisual = {
  id: string;
  category: AccessoryCategory;
  mountedAt: string;
};

type FirearmVisualState = {
  firearmType: FirearmType;
  accessories: MountedAccessoryVisual[];
};
```

Then:

```ts
resolveFirearmVisualLayers(state)
```

returns:

```ts
[
  rifleBase,
  suppressorLayer,
  flashlightLayer,
  magnifierLayer,
  redDotLayer,
]
```

The resolver performs:

- no storage writes;
- no firearm mutation;
- no accessory mutation;
- no filesystem updates.

It only converts domain state into presentation state.

---

# 20. Rendering Component

Introduce:

```text
FirearmArtwork
```

Pseudo-implementation:

```tsx
<View style={styles.canvas}>
  <Image source={profile.base} style={StyleSheet.absoluteFill} />

  {layers.map(layer => (
    <Image
      key={layer.key}
      source={layer.source}
      style={StyleSheet.absoluteFill}
    />
  ))}
</View>
```

Because every asset shares the same canvas, React Native does not need to calculate:

- optic coordinates;
- rail coordinates;
- muzzle positions;
- scaling;
- rotation;
- offsets.

The artwork itself contains the alignment.

---

# 21. `FirearmImage` Responsibility

Keep `FirearmImage` as the public UI abstraction if useful.

Its logic becomes:

```text
Does firearm have a selected user cover photo?

YES
    show photo

NO
    show FirearmArtwork
```

Conceptually:

```tsx
<FirearmImage
  photoUri={coverPhoto}
  firearmType={firearm.firearmType}
  mountedAccessories={mountedAccessories}
/>
```

Generated firearm artwork should never appear in `photoUri`.

---

# 22. Suggested Visual Support by Firearm Type

## Pistol

```text
red_dot
flashlight
laser
suppressor
```

## PCC

```text
red_dot
magnifier
scope
flashlight
laser
suppressor
grip
```

## Rifle

```text
red_dot
magnifier
scope
flashlight
laser
suppressor
bipod
grip
```

## Bolt-action rifle

```text
scope
suppressor
bipod
```

## Shotgun

```text
red_dot
flashlight
```

## Revolver

Base artwork only initially.

Do not attempt to visually support every accessory category.

Categories such as:

```text
mount_adapter
other
```

can remain data-only.

---

# 23. Use Mount History Directly

Introduce a canonical selector:

```ts
getMountedAccessoriesForFirearmAt(
  accessories,
  firearmId,
  atDate
)
```

Correct interval rule:

```text
mount.firearmId === firearmId

AND

mount.mountedAt <= atDate

AND

(
  mount.unmountedAt is absent
  OR
  atDate < mount.unmountedAt
)
```

This makes visual reconstruction deterministic and supports historical loadouts.

---

# 24. Historical and Backdated Mounts

The visual system should naturally support historical mount state.

Example:

```text
25 Jul
Red dot mounted

1 Aug
Range visit

7 Sep
User enters the red dot into TriggerNote retroactively
with mountedAt = 25 Jul
```

Current visual:

```text
red dot visible
```

Historical visual on 1 Aug:

```text
red dot visible
```

Historical visual on 20 Jul:

```text
red dot absent
```

No visual snapshots or image mutations are necessary.

Mount history remains authoritative.

---

# 25. Future Mount Dates

Unless scheduled configuration changes become a deliberate feature, reject:

```text
mountedAt > now
```

and:

```text
unmountedAt > now
```

This avoids ambiguity in determining what is "currently mounted".

Past dates remain valid.

---

# 26. Home Screen Data Flow

Avoid querying accessories separately for every firearm row.

Preferred flow:

```text
load firearms once
load accessories once
        ↓
derive mounts
        ↓
Map<firearmId, MountedAccessory[]>
        ↓
render firearm rows
```

Example:

```ts
const mountedByFirearm = deriveCurrentMounts(accessories);
```

Then:

```tsx
<FirearmImage
  firearmType={firearm.firearmType}
  photoUri={coverPhoto}
  mountedAccessories={
    mountedByFirearm.get(firearm.id) ?? []
  }
/>
```

This prevents N+1-style data access as the collection grows.

---

# 27. Firearm Detail Screen

The firearm detail screen should use the generated artwork as the most expressive visualization when no user cover photo is active.

Example:

```text
┌───────────────────────────────┐
│                               │
│     [configured firearm]      │
│                               │
└───────────────────────────────┘

CZ P-09 C
9×19 mm

Mounted
● Holosun 507C
● Streamlight TLR-1
```

Mounting, unmounting or moving an accessory should update the illustration immediately.

There should be no explicit "update image" action.

---

# 28. Legacy Data Migration

Existing records may contain:

```text
placeholder:pistol-placeholder.png
placeholder:pistol-reddot-placeholder.png
...
```

Recommended migration:

```text
pistol-placeholder
pistol-reddot-placeholder
    → pistol

revolver-placeholder
    → revolver

pcc-placeholder
    → pcc

carbine-placeholder
    → rifle

shotgun-placeholder
    → shotgun
```

Important:

```text
pistol-reddot-placeholder
```

must infer only:

```text
firearmType = pistol
```

It must **not** infer that a red dot is mounted.

Accessory mount history remains authoritative.

---

# 29. Photo Migration

For every firearm:

1. inspect existing `photos`;
2. infer firearm type from known placeholder values where possible;
3. remove all firearm `placeholder:*` entries;
4. retain every real photo in existing order;
5. persist `firearmType`;
6. use `other` when type cannot be safely inferred.

Do not infer firearm type from model names.

Avoid heuristics such as:

```text
"Glock" → pistol
"AR" → rifle
```

That would become a brittle firearm-classification system.

---

# 30. Backward-Compatible Schema Rollout

For the migration release, raw storage may temporarily accept:

```ts
firearmType: firearmTypeSchema.optional()
```

Normalize on read:

```ts
const firearmType =
  stored.firearmType ??
  inferLegacyFirearmType(stored.photos) ??
  "other";
```

For newly created or edited firearms:

```text
firearmType is required
```

After migration coverage is trusted, make the persisted schema strictly required.

---

# 31. Remove Old Placeholder-Swapping Logic

After migration, remove the old variant-selection system.

Delete logic equivalent to:

```text
ACCESSORY_PLACEHOLDER_VARIANTS
CATEGORY_PRECEDENCE
VARIANT_TO_BASE
variantPlaceholderKeyFor()
basePlaceholderKeyFor()
effectivePlaceholderKey()
syncFirearmPlaceholder()
isVariantKey()
```

Accessory operations should modify accessory domain state only.

They should not write firearm artwork or photo paths.

---

# 32. Remove Firearm Placeholder Mutation APIs

Any method whose purpose is to update a firearm placeholder as a side effect of accessory mounting should be removed.

Accessory operations should no longer mutate:

```text
firearm.photos
firearm.updatedAt
```

unless firearm domain data itself is actually changed.

---

# 33. Image Manager Cleanup

Separate:

```text
real user image storage
```

from:

```text
static generated artwork
```

Suggested architecture:

```text
services/
  image-storage.ts
  image-path.ts

features/
  ammunition/
    ammunitionVisualAssets.ts

  firearm-visuals/
    firearmVisualAssets.ts
    firearmVisualResolver.ts
    visualSlots.ts
    FirearmArtwork.tsx
```

Static firearm assets should not masquerade as storage image identifiers.

---

# 34. Artwork Production Contract

All firearm artwork assets should follow a strict contract.

## Base asset

```text
1024 × 1024
transparent background
same perspective
same visual margins
same scale
same line style
```

## Accessory layer

```text
1024 × 1024
transparent background
contains only the accessory
already aligned with base
contains no firearm pixels
```

Do not tightly crop layers.

Wrong:

```text
red-dot.png
90 × 60
```

requiring runtime coordinates.

Correct:

```text
red-dot.png
1024 × 1024
```

with the red dot positioned correctly inside the transparent canvas.

The assets themselves become the layout system.

---

# 35. Naming Convention

Good:

```text
firearms/pistol/base.png
firearms/pistol/layers/red-dot.png
firearms/pistol/layers/flashlight.png
```

Avoid:

```text
pistol-placeholder.png
pistol-reddot-placeholder.png
pistol-red-dot-light-placeholder.png
pistol-red-dot-light-suppressor-final2.png
```

The manifest should be the authoritative mapping between domain categories and assets.

---

# 36. Testing Specification

## 36.1 Base

```text
pistol + []
→ pistol base
```

## 36.2 One accessory

```text
pistol + red_dot
→ pistol base + red-dot layer
```

## 36.3 Multiple accessories

```text
pistol + red_dot + flashlight
→ base + red-dot + flashlight
```

## 36.4 Red dot + magnifier

```text
rifle + red_dot + magnifier
→ base + red-dot + magnifier
```

## 36.5 Complex rifle loadout

```text
rifle
+ red_dot
+ magnifier
+ flashlight
+ suppressor
+ grip

→ all supported layers rendered
```

## 36.6 Removal

Before:

```text
red_dot + flashlight
```

After red dot unmounted:

```text
flashlight only
```

## 36.7 Unsupported visual layer

```text
shotgun + magnifier
→ shotgun base
→ no user-facing error
→ mount remains valid
```

## 36.8 Duplicate category

If two accessories of the same visual category are somehow mounted:

```text
2 × flashlight
→ one flashlight visual layer
```

unless a future visual profile explicitly supports multiple instances.

## 36.9 Slot conflict

```text
scope mounted 1 Aug
red dot mounted 5 Aug

both use primary_optic

→ red dot rendered
```

## 36.10 Different slots compose

```text
red_dot      → primary_optic
magnifier    → optic_auxiliary
flashlight   → side_rail
suppressor   → muzzle

→ all four render together
```

---

# 37. Mount-State Tests

```text
mountedAt = 1 Aug
unmountedAt = undefined
atDate = 5 Aug
→ mounted
```

```text
mountedAt = 1 Aug
unmountedAt = 10 Aug
atDate = 5 Aug
→ mounted
```

```text
mountedAt = 1 Aug
unmountedAt = 10 Aug
atDate = 12 Aug
→ not mounted
```

```text
mountedAt = 10 Aug
atDate = 5 Aug
→ not mounted
```

---

# 38. Integration Tests

## Mount

```text
mount accessory
→ accessory updated
→ firearm record not rewritten
→ visual updates
```

## Unmount

```text
unmount accessory
→ mount history updated
→ firearm record not rewritten
→ visual disappears
```

## Move

```text
Accessory:
Firearm A → Firearm B

Firearm A:
layer disappears

Firearm B:
layer appears

Neither firearm is cosmetically mutated
```

## Edit mounted accessory category

```text
red_dot → flashlight
→ generated visual updates immediately
```

## Create already-mounted accessory

```text
create accessory with mount
→ generated visual includes accessory immediately
```

## Change firearm type

```text
pistol → pcc

mounted accessories unchanged
→ visual recomputed using PCC visual profile
```

## Remove user cover photo

```text
before → user photo
after → correct generated loadout
```

---

# 39. Asset Manifest Validation

Add tests ensuring:

```text
every FirearmType has a base asset
every visual layer maps to a valid AccessoryCategory
every visual slot value is valid
every conflict-resolution rule is deterministic
```

Static imports should also ensure missing files fail during bundling rather than at runtime.

---

# 40. Performance Expectations

A typical firearm card should render:

```text
1 base layer
+ 0–3 accessory layers
```

A more complex rifle may render more.

This is still preferable to:

- mutating local files;
- synchronizing placeholders;
- generating composites;
- storing derived cosmetic state.

For list screens:

- load accessories once;
- derive current mounts once;
- memoize artwork components;
- deduplicate visual categories;
- use static manifest references.

Do not generate combined images on-device.

---

# 41. Recommended Implementation Sequence

## Phase 1 — Domain model

Add:

```text
FirearmType
firearmType
```

Update firearm create/edit forms.

Remove manual placeholder selection.

Keep backward-compatible reads.

## Phase 2 — Asset architecture

Create:

```text
assets/images/firearms/
```

Move firearm visuals into type-specific directories.

Separate ammunition assets.

Create typed asset manifest.

## Phase 3 — Visual slots

Introduce:

```text
primary_optic
optic_auxiliary
muzzle
underbarrel
side_rail
support
```

Map supported accessory categories to visual slots per firearm profile.

Explicitly support:

```text
red_dot + magnifier
```

## Phase 4 — Renderer

Create:

```text
FirearmArtwork
resolveFirearmVisualLayers()
getMountedAccessoriesForFirearmAt()
```

Update `FirearmImage`.

## Phase 5 — Remove synchronization

Delete placeholder-sync logic.

Accessory mounting should no longer mutate firearms.

## Phase 6 — Migration

Infer legacy firearm type from known placeholders.

Remove generated placeholder entries from `photos`.

Preserve real user images.

## Phase 7 — Expand assets

Initial recommendation:

```text
Pistol:
base
red dot
flashlight

Rifle:
base
red dot
magnifier
scope
flashlight
suppressor

PCC:
base
red dot
magnifier
flashlight

Shotgun:
base
red dot
flashlight

Bolt-action rifle:
base
scope
bipod

Revolver:
base

Other:
base
```

Expand based on real accessory usage rather than attempting full coverage immediately.

---

# 42. Acceptance Criteria

## Firearm creation

- user selects firearm type;
- user does not select placeholder artwork;
- correct base visual appears automatically;
- `Other` exists;
- unknown firearms do not silently default to pistol.

## Photos

- `firearm.photos` contains only real user images;
- generated artwork never enters photo storage;
- removing all photos restores generated artwork.

## Accessories

- mounting a supported accessory updates artwork immediately;
- unmounting removes it;
- moving it updates both firearms;
- red dot + flashlight can appear simultaneously;
- red dot + magnifier can appear simultaneously;
- multiple supported slots can render together;
- unsupported visual categories do not affect domain behavior.

## Data

- accessory mount history is the source of truth;
- visual configuration is never persisted;
- accessory operations do not mutate firearm records;
- cosmetic changes do not alter firearm timestamps.

## Architecture

- no global accessory precedence list;
- no combinatorial PNG variants;
- static assets grouped by firearm type;
- one typed manifest maps categories to artwork;
- visual slots describe composability;
- one pure resolver determines final layers.

## Migration

- existing real photos preserved;
- legacy placeholders infer firearm type where safe;
- red-dot placeholder does not infer an actual red-dot mount;
- unknown legacy types become `other`;
- existing imports remain readable.

---

# 43. Target Architecture

```text
                   DOMAIN

      Firearm                  Accessories
┌─────────────────────┐   ┌──────────────────────┐
│ id                  │   │ category             │
│ modelName           │   │ mountHistory         │
│ caliber             │   │ ...                  │
│ firearmType         │   └──────────┬───────────┘
│ photos[]            │              │
└──────────┬──────────┘              │
           │                         │
           └────────────┬────────────┘
                        │
                        ▼
             deriveVisualState()
                        │
                        ▼
             ┌───────────────────┐
             │ firearmType       │
             │ mounted layers    │
             └─────────┬─────────┘
                       │
                       ▼
              resolve visual slots
                       │
                       ▼
                FirearmArtwork
                       │
             ┌─────────┴─────────┐
             │                   │
           base              overlays
             │                   │
             └─────────┬─────────┘
                       ▼
                Dynamic artwork
```

There is intentionally **no arrow back into storage** from the visual system.

---

# 44. Final Recommendation

The firearm-type selector should replace manual placeholder selection.

However, automatically selecting one of the current full-image variants is not sufficient because it preserves the underlying scalability problem.

The target model should be:

```text
firearmType
       +
actual mounted accessories
       ↓
visual slots
       ↓
derived layered illustration
```

not:

```text
firearmType
       +
mounted accessories
       ↓
find complete combined PNG
       ↓
write PNG filename into firearm.photos
```

This turns the feature from a growing collection of special cases into a small, reusable visual engine.

It also fits the intended game-like modification metaphor much better:

> **The firearm is the base object and accessories are visual layers applied to it.**

The visual-slot model specifically supports realistic combinations such as:

```text
red dot + magnifier + flashlight + suppressor
```

without requiring dedicated combination assets or additional synchronization logic.
