---
description: TriggerNote project conventions, architecture, and guidelines
alwaysApply: true
---

# TriggerNote

Personal firearms, ammunition, and range-visit tracking app. Privacy-first: all data stays on-device in AES-256-encrypted storage protected by a biometric lock.

**Stack:** React Native 0.79 · Expo SDK 53 · TypeScript (strict) · NativeWind/Tailwind · MMKV (encrypted, key in expo-secure-store) · React Navigation 7 (native stack) · react-hook-form + zod · expo-local-authentication · expo-image · date-fns · jest-expo + @testing-library/react-native

## Project Structure

```
index.ts                     # entry — registerRootComponent(App)
src/
├── app/App.tsx              # root: StorageInit → BiometricLock → NavigationContainer
├── components/              # one folder per component: Component.tsx + Component.test.tsx + barrel index.ts
├── screens/                 # one folder per screen: Screen.tsx + Screen.test.tsx + barrel index.ts
├── services/                # domain services + `storage` facade (storage-new.ts) + StorageService interface
├── hooks/                   # useEntityForm, useImagePicker, useDeleteEntity
├── utils/                   # formatDate, entityType, currency
├── theme/                   # COLORS palette
├── types/                   # shared navigation types
└── validation/              # zod schemas + form-data types (inputSchemas.ts)
```

## Code Style

- TypeScript strict mode. Never use `any` — use precise types or `unknown` + narrowing.
- **Named exports only** (no default exports). Use barrel files (`index.ts`) for public APIs.
- Arrow-function components with typed props, destructured:
  ```tsx
  type Props = { label: string };
  export const MyComponent = ({ label }: Props) => { ... };
  ```
- camelCase for variables/functions, PascalCase for components, kebab-case for directories.
- No code comments unless asked.

## Styling

- NativeWind/Tailwind via `className` only.
- Inline styles are allowed **only** for native-only props Tailwind cannot express: `textAlignVertical`, Skia canvas sizing, runtime-computed dimensions (e.g., `width: size`).
- `contentContainerStyle={{ flexGrow: 1 }}` on ScrollViews is acceptable.
- Colors come from `src/theme` (`COLORS`), never raw literals spread across the codebase.

## Forms

- All forms use `useForm` + `zodResolver` with schemas from `src/validation`.
- Entity create/update flows go through the shared `useEntityForm` hook; photo picking through `useImagePicker`.
- Show live field-level errors via each input's `error` prop.
- Input-heavy screens must handle keyboard visibility (KeyboardAvoidingScrollView / existing screen patterns).

## Components

- Every interactive element needs `accessibilityRole` + `accessibilityLabel` (and `accessibilityHint` where helpful).
- Use `Pressable` — `TouchableOpacity` is banned.
- Use `expo-image` (with `cachePolicy="disk"`) — never React Native's `Image`.
- FlatLists: extract `React.memo`-wrapped item components, add `getItemLayout` for fixed-height rows.
- Keep `testID`s stable — tests depend on them.

## Storage & Data Layer

- Import `storage` from the services barrel; never construct storage adapters directly.
- All public storage methods are typed in the `StorageService` interface — extend it when adding methods.
- Storage uses per-entity keys (`@storage:firearm:{id}` + index keys); never bypass the service layer to read/write keys.
- Settings are read via `storage.getSettings()` and mutated via `setCurrency` / `setBiometricLockEnabled`.
- Entity types come from `EntityType` in `src/utils` — no hardcoded `"firearm"`/`"ammunition"`/`"range-visit"` strings.

## Security

- Cryptographic keys via `expo-crypto` (`getRandomBytes`) — never `Math.random()`.
- Production logs are sanitized (error-handler); never log raw user payloads.
- Exports are AES-256 password-protected (`zipWithPassword`); imports enforce the 100 MB size limit and zip-slip path validation.
- The biometric lock (Face ID / Touch ID / passcode) defaults to **enabled**; the gate lives in `App.tsx` and re-locks after 30 s in background.

## Testing

- Run tests with `npm test -- <pattern> --ci` — never bare `npx jest`.
- Colocate tests (`*.test.tsx`) next to the source; follow existing mock conventions (`jest/setup.ts` global mocks, per-file `jest.mock` factories).
- A change is not done until: `npm test -- --ci` fully green (62 suites / 636 tests) and `npx tsc --noEmit` is clean.
- Update tests only when behavior legitimately changes — keep their coverage intent.

## Banned

`TouchableOpacity` · default exports · `any` · inline styles (except the allowed cases above) · `Math.random()` for security-sensitive values · hardcoded entity-type strings · raw key access outside the storage services
