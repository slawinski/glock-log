# App Store Submission — Remaining Manual Actions

**Updated:** September 2, 2026
**Status of code work:** All code-level findings from `docs/REVIEW_FINDINGS_2026-07-21.md` have been implemented (62/62 test suites, 636/636 tests passing, tsc clean).

This document lists the actions that **cannot be done from code** and must be completed by a human. Priorities: **P0** = blocks App Store submission · **P1** = strongly recommended (security/compliance) · **P2** = non-blocking improvement/debt.

---

## P0 — Blocks Submission

### 1. Host the privacy policy and add its URL (finding A3)
- The policy is drafted at `docs/PRIVACY_POLICY.md`.
- Host it publicly (GitHub Pages, Notion, or a simple web page) and copy the hosted URL into App Store Connect → App Privacy.
- **Verify the contact email** in the policy (`support@triggernote.app` placeholder) before hosting.

### 2. Complete the encryption export-compliance (ENC) filing (finding A2)
- The app now correctly declares `ITSAppUsesNonExemptEncryption = true` (AES-256 storage encryption + AES-256 encrypted exports).
- In App Store Connect, answer **Yes** to the export-compliance question and complete the annual self-classification. Declaring `true` without the filing can block the submission.

### 3. Set age rating to 17+ and position the app description (finding C2)
- App Store Connect → Age Rating: the app contains weapons-related content → **17+**.
- Description must clearly position the app as a lawful activity tracker (personal inventory/logging). Ensure description, screenshots, and keywords do **not** imply weapons purchasing, marketplace, or how-to-guide functionality.

### 4. Test on a physical iOS device (Guideline 2.1, finding A7)
- Required before submission. At minimum verify on a real iPhone:
  - Cold start, navigation through every screen, data entry + save flows.
  - **Biometric lock**: Face ID / Touch ID / passcode prompt, cancel → locked screen, RETRY, background > 30 s → re-lock, Settings toggle ON/OFF.
  - **VoiceOver** pass over Home, forms, date picker, tabs (accessibility findings A6).
  - **Data Transfer**: export with passphrase (AES-256), import the encrypted archive, import a legacy unencrypted archive, wrong passphrase handling.
  - Photo library permission prompt and image attach flows.
- A crash during App Review is an automatic rejection.

---

## P1 — Strongly Recommended (Security / Compliance)

### 5. Scrub `import_data.json` from git history (finding D11)
- `import_data.json` contains real user data (3 firearms, 4 ammo entries, 19 range visits) and is in git history.
- **Required before making the repository public.** Use `git filter-repo` (or BFG Repo-Cleaner) to purge the file from all history, then rotate any credentials if the repo was ever shared.
- Also delete the working-tree copy if it is no longer needed as an import fixture (see P2 #10).

### 6. Clean up leftover git stashes (housekeeping)
- `git stash list` contains 2 stashes from cancelled agent sessions (IBM Plex Mono font work, Menu About alert, a `LocationInput` component experiment).
- Review (`git stash show -p stash@{0}` / `stash@{1}`), keep what you want, drop the rest.

---

## P2 — Non-Blocking Improvements / Ops

### 7. Enable OTA updates via EAS (finding D16)
- `Expo.plist` currently has `EXUpdatesEnabled = false`.
- Configure EAS Update so critical fixes can ship without full App Store review — valuable for a data-sensitive app. Requires an EAS project link (projectId already in `app.json`).

### 8. Configure deep links / universal links (finding D17)
- Not required, but enables opening the app from external sources (e.g., sharing a `.zip` backup directly into the app). Requires associated domains + URL scheme handling.

### 9. Verify the entitlements file (finding D18)
- `ios/glocklog/glocklog.entitlements` is an empty dictionary. Acceptable since the app uses no push notifications / iCloud / HealthKit. Re-check if you add such capabilities later.

### 10. Remove or repurpose `import_data.json` (finding D11, part 2)
- If it's a dev fixture, keep it out of the repo (`.gitignore`) or replace with synthetic sample data.

### 11. Resolve remaining dev-tooling audit findings (finding A10, part 2)
- 28 moderate/high advisories remain, all in **dev/build-time transitive deps** (`@expo/config` via jest-expo, `ajv` via expo-dev-launcher, etc.). They do not ship in the app binary and do not block submission.
- Resolution requires an Expo SDK upgrade (53 → 56/57). Do this as a dedicated migration when convenient.

### 12. Migrate EntityType magic strings in `src/services/**` (finding C20, follow-up)
- `src/utils/entityType.ts` defines the `EntityType` enum; screens/hooks/validation use it. The ~20 literals inside the service layer (`firearm-service.ts`, `ammunition-service.ts`, `range-visit-service.ts`, `image-storage.ts`, `storage-helpers.ts`) still use bare strings — a TODO marks the spot. Mechanical, low-risk.

### 13. Evaluate chart library migration (finding D7)
- `react-native-chart-kit` (~150 KB, JS) → `victory-native` (Skia) for GPU-accelerated charts. Optional; only if stats screens show performance issues.

### 14. Evaluate `expo-image-picker` migration (finding D19)
- `react-native-image-picker` works (permission strings now configured). `expo-image-picker` would auto-generate plist entries and offers Expo-managed compatibility. Optional.

---

## Decisions Already Made (for the record)

- **C4 (SecureStore `requireAuthentication`):** Superseded by the app-level biometric gate (A8). Adding SecureStore-level authentication would double-prompt on every launch; the gate covers the threat model. Revisit only if the app-level lock is ever removed.
- **Privacy manifest data types (C5):** Declared as **not linked to identity** — accurate, since data never leaves the device and the developer has no access to it.
- **C6 (inline styles):** Remaining inline styles are native-only properties (`textAlignVertical`, Skia canvas sizing, runtime-computed dimensions) that Tailwind cannot express.
