# Triggernote: Comprehensive Multi-Faceted Code Review

**Date:** July 21, 2026
**Scope:** Full codebase (~116 source files, ~55 test files)
**Stack:** React Native 0.79, Expo SDK 53, TypeScript 5.3 (strict), NativeWind/Tailwind, MMKV, Prisma, React Navigation 7

> **Note:** This revision cross-references findings against [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) and reprioritizes issues that block or risk iOS App Store deployment.

---

## Status of Prior REVIEW_REPORTS.md (March 2026) Findings

| Prior Finding | Status |
|---|---|
| SEC-01: Hardcoded encryption key | **RESOLVED** — now uses `expo-secure-store` |
| SEC-02: Images excluded from backup | **PARTIALLY RESOLVED** — export now bundles images, Android `allowBackup` still exposed |
| SEC-03: Image backup exposure | **PARTIALLY RESOLVED** — iOS `iCloudNoBackup` attempted, Android still exposed |
| God Service (storage-new.ts) | **UNRESOLVED** — still 723-line monolith |
| react-hook-form not used | **UNRESOLVED** — all 6 form screens still use manual `useState` |
| `.sort()` mutation on props | **UNRESOLVED** — FirearmsTab.tsx still mutates props in-place |
| Stats render-time calculations | **UNRESOLVED** — no `useMemo` added |
| TouchableOpacity deprecation | **UNRESOLVED** — 23+ files still use it |
| MMKV large JSON blob storage | **UNRESOLVED** — same whole-array pattern |
| ScrollView.map vs virtualized lists | **PARTIALLY RESOLVED** — Home tabs now use FlatList, but Stats tabs still ScrollView |
| Splash screen white → black | **UNRESOLVED** |
| TerminalInput accessibility | **UNRESOLVED** |
| Missing accessibilityRole on buttons | **UNRESOLVED** |

---

## Prioritized Findings

### CRITICAL — BLOCKS iOS APP STORE DEPLOYMENT (8)

#### A1. Missing `NSPhotoLibraryUsageDescription` in Info.plist — App Store Guideline 5.1.1 (App Store / Privacy)
— Four screens (AddFirearm, EditFirearm, AddRangeVisit, EditRangeVisit) use `react-native-image-picker`'s `launchImageLibrary()` to access the photo library, but `Info.plist` has no `NSPhotoLibraryUsageDescription` key. Apple **requires** a purpose string explaining why the app needs photo library access. Without it, the app will crash when accessing photos and **will be rejected** in App Review.
- `ios/glocklog/Info.plist`, `src/screens/add-firearm/AddFirearm.tsx:48`, `src/screens/edit-firearm/EditFirearm.tsx:76`, `src/screens/add-range-visit/AddRangeVisit.tsx:115`, `src/screens/edit-range-visit/EditRangeVisit.tsx:117`
- Fix: Add to `app.json` under `expo.ios.infoPlist`:
  ```json
  "NSPhotoLibraryUsageDescription": "TriggerNote needs access to your photo library to attach images to firearms, ammunition, and range visit logs."
  ```

#### A2. `ITSAppUsesNonExemptEncryption: false` — Must Be `true` — App Store Guideline 5.4 (App Store / Encryption Compliance)
— The app uses `react-native-mmkv` with AES-256 encryption (initialized via `storage-factory.ts` + `storage-config.ts`) and `expo-secure-store` for key storage, but declares `ITSAppUsesNonExemptEncryption: false` in both `app.json` and `Info.plist`. This is factually incorrect — the app uses non-exempt encryption. Setting it to `false` is an App Store declaration violation that can trigger rejection and export compliance issues.
- `app.json:19`, `ios/glocklog/Info.plist:42-43`
- Fix: Change to `true` in both files. Also complete the annual [ENC encryption self-classification report](https://www.bis.doc.gov/index.php/policy-guidance/encryption) in App Store Connect.

#### A3. Missing Privacy Policy URL — App Store Guideline 5.1.1 (App Store / Privacy)
— The app collects and stores sensitive personal data (firearms inventory, ammunition stock, range visit logs, GPS-tagged photos) but has no privacy policy URL anywhere. App Store Connect requires a privacy policy URL for any app that collects user data, even if stored only locally. No privacy policy page or link was found in the codebase, app metadata, or configuration.
- `app.json` (missing `privacyPolicyUrl` or app store metadata), nowhere else
- Fix: Create a privacy policy page (free options: GitHub Pages, Notion, privacypolicies.com) and add it to App Store Connect metadata. The policy must disclose: what data is collected, that it's stored only on-device, that it's encrypted, and that no data is shared with third parties.

#### A4. `UIStatusBarStyle: Default` (Dark Text) on Dark CRT App — App Store Guideline 4.0 (App Store / UI Design)
— `Info.plist` has `UIStatusBarStyleDefault` (dark text for light backgrounds) but the entire app has a `#0a0a0a` black background terminal theme. On iOS, this makes the status bar text invisible/illegible. Apple's HIG and Guideline 4.0 require legible UI elements.
- `ios/glocklog/Info.plist:63-64`
- Fix: Change to `UIStatusBarStyleLightContent` and set `UIViewControllerBasedStatusBarAppearance: true`.

#### A5. `UIUserInterfaceStyle: Light` Contradicts Dark CRT Theme — App Store Guideline 2.3 / 4.0 (App Store / UI Design)
— Both `app.json` (`userInterfaceStyle: "light"`) and `Info.plist` (`UIUserInterfaceStyle: Light`) declare a light appearance, but the app is a pitch-black CRT terminal theme. This causes **every system UI element** (keyboard, alerts, share sheets, action sheets, document picker) to render in light mode, breaking immersion and potentially making light-on-light text in system dialogs illegible.
- `app.json:8`, `ios/glocklog/Info.plist:77-78`
- Fix: Set `userInterfaceStyle: "dark"` in `app.json`. Regenerate the native project (`npx expo prebuild --clean`) to sync the `Info.plist` value to `Dark`.

#### A6. No Accessibility Support on Custom Components — App Store Guideline 4.0 (App Store / Accessibility)
— TerminalInput renders a transparent native `TextInput` behind a custom CRT visual layer, making it **invisible to VoiceOver screen readers**. Custom buttons (TerminalButton, TerminalTabs, ToggleButton, DeleteButton, HeaderButton) lack `accessibilityRole="button"` and `accessibilityLabel` attributes. Apple rejects apps with inaccessible core UI.
- `src/components/terminal-input/TerminalInput.tsx:83,96-100`, `src/components/terminal-button/TerminalButton.tsx`, `src/components/header-button/HeaderButton.tsx`, and all other custom interactive components
- Fix: Add `accessibilityLabel`, `accessibilityRole="button"`, and `accessibilityHint` to all interactive components. For TerminalInput, expose the underlying TextInput via `ref` forwarding and set proper accessibility properties on it. Test with VoiceOver enabled.

#### A7. 17 Failing Tests Across 4 Suites — App Store Guideline 2.1 (App Store / App Completeness)
— Apple requires that "your app has been tested on-device for bugs and stability." 17 test failures across `TerminalDatePicker`, `Home`, `VisitsTab`, and `FirearmsTab` suites are strong indicators of potential runtime instability. A crash during App Review is an automatic rejection.
- `src/components/terminal-date-picker/TerminalDatePicker.test.tsx`, `src/screens/home/Home.test.tsx`, `src/screens/home/VisitsTab.test.tsx`, `src/screens/home/FirearmsTab.test.tsx`
- Fix: Debug and resolve all failing tests. Run the full test suite (`npm test -- --ci`) and verify 0 failures before submission.

#### A8. No App-Level Authentication — App Store Guideline 1.6 (App Store / Data Security)
— App has zero biometric/PIN lock. Anyone with physical access to the unlocked device can view the complete firearms inventory, ammunition stock, range visit logs, and export the entire database. Apple Guideline 1.6 states: "Apps should implement appropriate security measures to ensure proper handling of user information... and prevent its unauthorized use, disclosure, or access by third parties." A firearms tracking app without any access control is a significant data security concern.
- `src/app/App.tsx`, all screens
- Fix: Integrate `expo-local-authentication` to require FaceID/TouchID/device PIN before displaying any data. Optionally re-encrypt the SecureStore key item with `kSecAccessControlBiometryAny`.

---

### CRITICAL — SECURITY / DATA INTEGRITY (2)

#### A9. Insecure Encryption Key Generation via `Math.random()` (Security)
— `generateSecureKey()` in storage-config.ts uses `Math.random()` (xorshift128+ PRNG) instead of a CSPRNG, yielding only ~64 bits of effective entropy for the 128-bit MMKV encryption key. An attacker with forensic access could brute-force it.
- `src/services/storage-config.ts:10-15`
- Fix: Replace with `crypto.getRandomValues(new Uint8Array(16))`.

#### A10. Transitive `shell-quote` Command Injection (CVSS 8.1) (Security)
— `npm audit` reports critical command injection in `shell-quote` <=1.8.4 (transitive dev dependency via Metro bundler).
- Fix: Upgrade Expo SDK (53→57) or force-resolve with `overrides` in package.json.

---

### HIGH (9)

#### B1. God Service Still Unresolved — storage-new.ts is 723-Line Monolith (Architecture)
— Single `storage` object exports 20 methods across Firearm (5), Ammunition (5), Range Visit (5), Settings (3), and Data Transfer (2) domains. `saveRangeVisitWithAmmunition()` tightly couples all three entity domains in one 85-line method.
- `src/services/storage-new.ts`
- Fix: Split into `firearm-service.ts`, `ammunition-service.ts`, `range-visit-service.ts`, `settings-service.ts`, `data-transfer-service.ts`.

#### B2. react-hook-form Mandate Completely Unmet — 0 of 6 Form Screens Use It (Code Quality)
— CLAUDE.md mandates "Always use react-hook-form and zod for data inputs and validations." All 6 form screens use manual `useState` with Zod-only validation at submit time. No live field-level validation.
- `src/screens/add-firearm/AddFirearm.tsx:82-107`, `src/screens/edit-firearm/EditFirearm.tsx:92-128`, and 4 others
- Fix: Convert each form screen to `useForm` + `zodResolver`, add live validation display.

#### B3. `TouchableOpacity` Deprecated — 23+ Files, 2 Foundation Components Blocked (Performance)
— `TerminalButton` and `HeaderButton` extend `TouchableOpacityProps`, coupling the entire component tree to the deprecated API.
- `src/components/terminal-button/TerminalButton.tsx:7,11`, `src/components/header-button/HeaderButton.tsx:7,11`, plus 21 other files
- Fix: Migrate `TerminalButton` and `HeaderButton` to `Pressable` first (cascades to ~40% of usages).

#### B4. Stats Screen: Heavy O(n×m) Computation on Every Render Without `useMemo` (Performance)
— `FirearmsTab.tsx` computes `calculateFirearmStats()` (O(firearms)) and `calculateFirearmRoundsTimeline()` (O(firearms × visits)) in the render body.
- `src/screens/stats/FirearmsTab.tsx:27-114`, `src/screens/stats/AmmunitionTab.tsx:13-71`, `src/screens/stats/VisitsTab.tsx:11-53`
- Fix: Wrap all three computation functions in `useMemo` with correct dependency arrays.

#### B5. MMKV Stores Entire Collections as Single JSON Blobs — O(n) Per Write (Performance)
— Every save/update/delete reads the entire array, parses it, stringifies it, and writes it back. `saveRangeVisitWithAmmunition` does 7+ sequential read-modify-write cycles.
- `src/services/storage-new.ts:80-196, 217-322, 393-477`
- Fix: Per-entity keys (`@storage:firearm:{id}`) with index key, or batch writes via `Promise.all`.

#### B6. Android `allowBackup="true"` Exposes Encrypted Database to Google Drive (Security)
— Entire app data auto-backed up to the user's Google account. A compromised Google account exposes the full firearms database.
- `android/app/src/main/AndroidManifest.xml:14`
- Fix: Change to `android:allowBackup="false"`.

#### B7. Export Archive Is Unencrypted Plain-Text ZIP — App Store Guideline 1.6 (Security)
— Data Transfer exports create a ZIP with `data.json` (plain-text firearms, ammo, visits) + `images/` directory, shared without encryption.
- `src/screens/data-transfer/DataTransfer.tsx:25-118`, `src/services/storage-new.ts:581-721`
- Fix: Add optional AES-256 password encryption to the ZIP, or encrypt the JSON payload before archiving.

#### B8. `storage-new.ts` Test Coverage: 14.74% — Most Complex Logic Untested (Testing)
— `saveRangeVisitWithAmmunition()`, `importData()`, `clearAllData()`, and all image-management methods have zero test coverage.
- `src/services/storage-new.ts:174-719`, `src/services/__tests__/storage-integration.test.ts`
- Fix: Add comprehensive CRUD tests, transactional flow tests, import merge tests, and data wipe tests.

#### B9. Double-Fetch on Mount in AmmunitionDetails + Settings (Performance / Bug)
— Both screens have a `useEffect` + `useFocusEffect` that both call the fetch function on initial mount.
- `src/screens/ammunition-details/AmmunitionDetails.tsx:59-66`, `src/screens/settings/Settings.tsx:30-37`
- Fix: Remove the `useEffect` block and rely solely on `useFocusEffect`.

---

### MEDIUM (22)

#### C1. Splash Screen White Background → Black CRT Theme Is Jarring — App Store Guideline 4.0 (App Store / UI Design)
— `app.json` specifies `#ffffff` background and `light` UI style. On launch, users see a bright white splash then a sudden switch to a pitch-black terminal. Apple HIG requires smooth, consistent launch experiences.
- `app.json:8,11-14`
- Fix: Set `backgroundColor: "#0a0a0a"` and `userInterfaceStyle: "dark"` in `app.json`. The splash icon should also be theme-appropriate.

#### C2. Firearms Content Requires Correct Age Rating — App Store Guideline 2.3.6 (App Store / Metadata)
— App Store Guideline 1.1.3 prohibits apps that "encourage illegal or reckless use of weapons" or "facilitate the purchase of firearms or ammunition." A tracking/logging app is likely acceptable, but the age rating must reflect weapons-related content (likely 17+). The app description must clearly position the app as a lawful activity tracker, not a marketplace or instructional guide.
- App Store Connect metadata
- Fix: Set age rating to 17+ in App Store Connect. Ensure app description, screenshots, and keywords do not imply weapons purchasing or how-to-guide functionality.

#### C3. `UISupportedInterfaceOrientations` Allows PortraitUpsideDown on iPhone — App Store Guideline 4.0 (App Store / UI Design)
— `Info.plist` includes `UIInterfaceOrientationPortraitUpsideDown` for iPhone, but upside-down portrait has been unsupported on notched iPhones (X and later) for years. While not typically a hard rejection, it signals outdated configuration.
- `ios/glocklog/Info.plist:65-69`
- Fix: Remove `UIInterfaceOrientationPortraitUpsideDown` from the iPhone orientation array (keep it for iPad if needed).

#### C4. `expo-secure-store` Lacks Biometric Protection Options — App Store Guideline 1.6 (Security)
— `SecureStore.setItemAsync` called without `requireAuthentication` option. The encryption key is accessible whenever device is unlocked.
- `src/services/storage-config.ts:23,27`
- Fix: Add `{ requireAuthentication: true }` option (requires `expo-local-authentication`).

#### C5. `NSPrivacyCollectedDataTypes` Is Empty Array in PrivacyInfo.xcprivacy (App Store / Privacy)
— The privacy manifest declares no collected data types, but the app clearly collects firearms inventory, ammunition stock, range visit logs, and images. While data is stored only locally, Apple may expect disclosure in the privacy manifest for completeness. The manifest should at minimum declare the data types collected.
- `ios/glocklog/PrivacyInfo.xcprivacy:43-44`
- Fix: Add entries for at minimum: `NSPrivacyCollectedDataTypeOtherDataTypes` (for firearms/ammunition inventory data) and `NSPrivacyCollectedDataTypePhotosorVideos` (for attached images). Mark all as linked to user identity, used for app functionality only, and not shared with third parties.

#### C6. Inline Style Violations — ~30 Instances Across 13 Files (Code Quality)
— CLAUDE.md mandates Tailwind-only. `TerminalInput.tsx` uses 6+ `style={{}}` objects, `CRTOverlayShader.tsx` uses `StyleSheet.create`, 9 screens use `contentContainerStyle={{ flexGrow: 1 }}`.
- Fix: Convert TerminalInput positioning/sizing to Tailwind. `contentContainerStyle` is acceptable for ScrollView flex.

#### C7. `any` Type Usage — 8 Instances in Production Code, ~42 in Tests (Code Quality)
— `useFormChangeHandler.ts` uses `Record<string, any>` and `value: any`. `DataTransfer.tsx` declares `performImport` with `data: any`.
- `src/hooks/useFormChangeHandler.ts:4,10,19`, `src/screens/data-transfer/DataTransfer.tsx:204`
- Fix: Replace with proper generic types and `unknown` + type narrowing.

#### C8. Default Exports on 3 Files Violate Convention (Code Quality)
— CLAUDE.md mandates named exports. `App.tsx`, `FirearmImage.tsx`, `TerminalDatePicker.tsx` use `export default`.
- `src/app/App.tsx:47`, `src/components/firearm-image/FirearmImage.tsx:44`, `src/components/terminal-date-picker/TerminalDatePicker.tsx:104`
- Fix: Convert to `export const` (two already have named exports; remove the redundant default).

#### C9. 8 Duplicated Loading State Components (Component Duplication)
— Identical `<View>` + `ActivityIndicator` + "LOADING DATABASE..." repeated in 8 files.
- Fix: Create `<LoadingScreen />` component in `src/components/`.

#### C10. 4 Duplicated Image Picker Implementations (Component Duplication)
— `launchImageLibrary` duplicated across AddFirearm, EditFirearm, AddRangeVisit, EditRangeVisit.
- Fix: Extract `useImagePicker` hook.

#### C11. 6 Duplicated Form Submit + Zod Validation Patterns (Component Duplication)
— All Add/Edit screens follow identical setSaving→Zod.safeParse→Alert.alert→storage.save→goBack→catch→finally flow.
- Fix: Extract `useEntityForm(schema, saveFn, entityName)` hook.

#### C12. No `React.memo` Usage — Zero Instances in Entire Codebase (Performance)
— FlatList `renderItem` components, `Tab`, `ToggleButton`, `FirearmImage` re-render on every parent render.
- Fix: Wrap FlatList render components with `React.memo`. Use `useCallback` for inline handlers.

#### C13. No `getItemLayout` on Any FlatList (Performance)
— Home screen tabs use FlatList but without `getItemLayout` for fixed-height items.
- `src/screens/home/FirearmsTab.tsx`, `src/screens/home/AmmunitionTab.tsx`, `src/screens/home/VisitsTab.tsx`
- Fix: Add `getItemLayout` for consistent-height list items.

#### C14. `FirearmImage` Uses RN `Image` Instead of `expo-image` — No Caching (Performance)
— `ImageGallery` correctly uses `expo-image` but `FirearmImage` uses bare React Native `Image`.
- `src/components/firearm-image/FirearmImage.tsx:25,31`
- Fix: Replace with `expo-image` using `cachePolicy="disk"` and `contentFit="contain"`.

#### C15. 3 Duplicated Delete Confirmation Dialog Patterns (Component Duplication)
— FirearmDetails, AmmunitionDetails, and RangeVisitDetails have identical Alert.alert-based delete flows.
- Fix: Extract `useDeleteEntity(entity, deleteFn, label)` hook.

#### C16. `formatCurrency()` Bypassed in Ammunition Tabs — Hardcoded `$` (Bug / Code Quality)
— `home/AmmunitionTab.tsx` and `stats/AmmunitionTab.tsx` use `$${value.toFixed(2)}` instead of `formatCurrency()`.
- `src/screens/home/AmmunitionTab.tsx:43`, `src/screens/stats/AmmunitionTab.tsx:139`
- Fix: Use `formatCurrency(value, currency)` (requires passing `currency` prop through).

#### C17. `TerminalButton` Bypassed in Range Visit Screens (Code Quality)
— AddRangeVisit and EditRangeVisit use raw `TouchableOpacity` "ADD PHOTOS" buttons instead of `TerminalButton`.
- `src/screens/add-range-visit/AddRangeVisit.tsx:286-291`, `src/screens/edit-range-visit/EditRangeVisit.tsx:339-343`
- Fix: Replace with `TerminalButton`.

#### C18. Zip Slip Path Traversal Risk in Import (Security)
— `react-native-zip-archive` unzip does not validate archive paths against the extraction directory root.
- `src/screens/data-transfer/DataTransfer.tsx:121-262`
- Fix: Validate all extracted file paths against the expected extraction directory.

#### C19. No Import File Size Limits (Security)
— Data Transfer import does not check file size before extracting. A ZIP bomb could exhaust cache storage.
- `src/screens/data-transfer/DataTransfer.tsx:121-201`
- Fix: Check `FileSystem.getInfoAsync` and reject files over a safe maximum (e.g., 100MB).

#### C20. Magic Entity-Type Strings Throughout Services (Architecture)
— `"firearm"`, `"ammunition"`, `"range-visit"` used as bare strings 20+ times with no enum/union type.
- Fix: Create `EntityType` const enum.

#### C21. Misplaced UI Color Constants in Services Layer (Architecture)
— `src/services/constants/index.ts` contains only UI theme colors; belongs in a theme directory.
- Fix: Move to `src/theme/colors.ts` or `src/constants/theme.ts`.

#### C22. `StorageInit` Uses Plain `<Text>` Breaking Terminal Theme on Startup — App Store Guideline 4.0 (App Store / UI Design)
— Prior report flagged this; still unresolved. The "Initializing storage..." text uses standard `<Text>` during app load.
- `src/services/storage-init.tsx:45`
- Fix: Replace with `<TerminalText>`.

---

### LOW (19)

#### D1. Error Logging May Leak User Data in Production (Security)
— `logError()` writes full error object (potentially containing JSON payloads) to `console.error`.
- `src/services/error-handler.ts:91`
- Fix: Sanitize error payloads in production builds.

#### D2. Zod Schemas Lack Maximum Length Constraints (Security)
— Fields like `modelName`, `caliber`, `location`, `notes` have no `.max()` limits.
- `src/validation/inputSchemas.ts:3-50`
- Fix: Add `.max(100)` to `.max(5000)` constraints per field.

#### D3. `storage` Object Has No Interface — Cannot Be Substituted via DI (Architecture)
— `storage-new.ts` exports a plain object literal with no TypeScript interface. Mock coverage is incomplete (6/20 methods).
- Fix: Define a `StorageService` interface with all public methods.

#### D4. 3 Empty Abandoned Directories in `src/services/` (Architecture)
— `storage/`, `error-handling/`, `image-management/` created Oct 2025, never populated.
- Fix: Remove or populate them.

#### D5. Barrel Import Inconsistencies (Code Quality)
— `Home.tsx` and several components import directly instead of from barrel files.
- Fix: Use consistent barrel imports.

#### D6. `Dimensions.get()` in Render Instead of `useWindowDimensions` (Performance)
— Stats chart tabs call `Dimensions.get("window").width` directly in render body.
- `src/screens/stats/FirearmsTab.tsx:148`, `src/screens/stats/AmmunitionTab.tsx:100`
- Fix: Replace with `useWindowDimensions()`.

#### D7. `react-native-chart-kit` Is Heavy (~150KB) — Consider `victory-native` (Skia) (Performance)
- Fix: Evaluate migration to `victory-native` for GPU-accelerated charting.

#### D8. FormData Types Duplicated in Add/Edit Screen Pairs (Component Duplication)
— `FirearmFormData` defined identically in AddFirearm.tsx and EditFirearm.tsx. Same for `AmmunitionFormData`.
- Fix: Move to `src/validation/inputSchemas.ts` alongside Zod schemas.

#### D9. `HomeScreenNavigationProp` Type Defined 3 Times (Component Duplication)
— Identical navigation prop type duplicated across FirearmsTab, AmmunitionTab, and VisitsTab.
- Fix: Centralize in `src/types/navigation.ts`.

#### D10. Inline `renderItem` Functions in Home Tabs (Component Duplication / Performance)
— `renderFirearmItem`, `renderAmmunitionItem`, `renderVisitItem` defined inline creating new closures every render.
- Fix: Extract as standalone named components (`FirearmListItem`, etc.).

#### D11. Hardcoded `import_data.json` in Repository with Real User Data (Security)
— Contains 3 firearms, 4 ammo entries, 19 range visits. In git history.
- Fix: Scrub from git history via `git filter-branch` or `BFG Repo-Cleaner`.

#### D12. `Settings.tsx` Uses `React.useCallback` Inconsistently (Code Quality)
— Imports `useEffect` destructured but uses `React.useCallback` instead of destructured `useCallback`.
- Fix: Use consistent pattern.

#### D13. No `src/services/index.ts` Barrel File (Architecture)
— Every other major directory has a barrel file. Services lack one.
- Fix: Create `src/services/index.ts`.

#### D14. Mutable `.sort()` on Props in FirearmsTab (Bug)
— Prior report noted this; still unresolved. `FirearmsTab.tsx` calls `.sort()` directly on `firearms` array prop.
- `src/screens/home/FirearmsTab.tsx`
- Fix: Create a shallow copy: `[...firearms].sort(...)`.

#### D15. `CRTOverlayShader.tsx` Has No Tests (Testing)
— The Skia shader overlay renders on every screen but is untested.
- Fix: Add basic render + null `runtimeEffect` fallback test.

#### D16. `expo-updates` Disabled — Missing OTA Update Capability (App Store / Ops)
— The `EXUpdatesEnabled` key in `Expo.plist` is `false`. While not a blocker, enabling OTA updates via EAS allows fixing critical bugs without App Store resubmission. This is valuable for a data-sensitive app.
- `ios/glocklog/Supporting/Expo.plist:8`
- Fix: Enable `expo-updates` and configure EAS Update for production.

#### D17. No Deep Link / Universal Link Configuration (App Store / Ops)
— App has no deep linking or universal link setup. While not strictly required, this makes it impossible to open the app from external sources (e.g., sharing a backup file directly into the app).
- Fix: Configure associated domains and URL schemes for `data.json` or `.zip` import handling.

#### D18. Entitlements File Is Empty (App Store / Configuration)
— `glocklog.entitlements` is an empty dictionary. Most apps require at minimum the `aps-environment` entitlement for push notifications. If no push notifications are used, this is acceptable, but verify if any capabilities need to be declared.
- `ios/glocklog/glocklog.entitlements`
- Fix: Add any required entitlements (e.g., if adding `expo-local-authentication` or push notifications in the future).

#### D19. `react-native-image-picker` Legacy — Consider Migrating to `expo-image-picker` (App Store / Dependencies)
— `react-native-image-picker` is a third-party native module, while `expo-image-picker` is the Expo-managed equivalent with better compatibility guarantees, automatic permission handling, and built-in Info.plist generation.
- `package.json:45`
- Fix: Evaluate migrating to `expo-image-picker` which auto-generates `NSPhotoLibraryUsageDescription` from `app.json` plugin configuration.

---

## Quick-Reference: App Store Submission Checklist

Before submitting to App Store review, verify:

- [ ] `NSPhotoLibraryUsageDescription` present in `Info.plist`
- [ ] `ITSAppUsesNonExemptEncryption: true` in both `app.json` and `Info.plist`
- [ ] Privacy policy URL added to App Store Connect
- [ ] `UIUserInterfaceStyle: Dark` and `UIStatusBarStyleLightContent` set
- [ ] All interactive components have `accessibilityRole` and `accessibilityLabel`
- [ ] TerminalInput works with VoiceOver
- [ ] 0 failing test suites
- [ ] Biometric/PIN lock implemented
- [ ] Splash screen background matches app theme (`#0a0a0a`)
- [ ] Age rating set to 17+ in App Store Connect
- [ ] App description clearly positions as a lawful activity tracker
- [ ] Privacy manifest (`PrivacyInfo.xcprivacy`) declares collected data types
- [ ] Encrypted export option for Data Transfer
- [ ] Encryption export compliance (ENC filing) completed in App Store Connect
- [ ] App tested on physical iOS device (not just simulator)

---

## Summary Statistics

| Severity | Count |
|---|---|
| Critical — App Store Blocker | 8 |
| Critical — Security / Data | 2 |
| High | 9 |
| Medium | 22 |
| Low | 19 |
| **Total** | **60** |

| Category | Count |
|---|---|
| App Store / Compliance | 14 |
| Security | 13 |
| Architecture | 9 |
| Code Quality | 11 |
| Performance | 9 |
| Testing | 3 |
| UX / A11Y | 4 |
| Component Duplication | 5 |
| App Store / Operations | 3 |
