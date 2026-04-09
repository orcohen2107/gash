---
phase: 01-foundation
plan: 04
subsystem: state-management
tags: [zustand, asyncstorage, typescript, jest, react-native]

# Dependency graph
requires:
  - phase: 01-03
    provides: types/index.ts (Approach, ChatMessage interfaces) and lib/supabase.ts client
provides:
  - stores/useAuthStore.ts — session state (no persist, managed by Supabase)
  - stores/useChatStore.ts — chat messages with AsyncStorage persist
  - stores/useLogStore.ts — approach entries with AsyncStorage persist
  - stores/useStatsStore.ts — KPIs and streak with AsyncStorage persist
  - jest.config.js, jest-setup.js, tsconfig.json, package.json, app.json, .babelrc
  - 4 unit tests (useAuthStore, useChatStore, useLogStore, useStatsStore)
  - All stores fully typed and testable
affects:
  - 01-05 (stores will be hydrated from Supabase Edge Function responses)
  - Phase 2 (auth and chat features depend on these stores)
  - Phase 3 (logging depends on useLogStore)
  - Phase 4 (dashboard reads from useStatsStore and useLogStore)

# Tech tracking
tech-stack:
  added:
    - zustand (^5.0.12) — persist middleware with AsyncStorage
    - "@react-native-async-storage/async-storage" (~1.24.0) — non-sensitive state persistence
    - jest (^29.7.0) — unit test framework
    - jest-expo (~50.0.2) — Expo React Native test setup
    - "@testing-library/react-native" (^12.4.5) — testing utilities
    - typescript (^5.3.0) — strict type checking
  patterns:
    - Zustand + persist: one store per domain, partialize to exclude functions/loading flags
    - AsyncStorage: only for non-sensitive data (session tokens stay in expo-secure-store)
    - useAuthStore exception: NO persist (Supabase SecureStore adapter manages JWT)
    - Jest + babel-preset-expo: transforms TypeScript and React Native syntax for test environment
    - Store mocking in tests: AsyncStorage, expo-secure-store, expo-updates mocked in jest-setup.js

key-files:
  created:
    - stores/useAuthStore.ts (120 lines)
    - stores/useChatStore.ts (40 lines)
    - stores/useLogStore.ts (50 lines)
    - stores/useStatsStore.ts (45 lines)
    - jest.config.js (23 lines)
    - jest-setup.js (29 lines)
    - tsconfig.json (32 lines)
    - package.json (60 lines with all dependencies)
    - app.json (35 lines Expo config)
    - .babelrc (22 lines with Expo presets)
    - __tests__/stores/useAuthStore.test.ts (22 lines)
    - __tests__/stores/useChatStore.test.ts (15 lines)
    - __tests__/stores/useLogStore.test.ts (15 lines)
    - __tests__/stores/useStatsStore.test.ts (17 lines)
  modified: []

key-decisions:
  - "useAuthStore has NO persist — Supabase client handles JWT persistence via expo-secure-store, not Zustand"
  - "All other stores persist to AsyncStorage under keys: gash-chat, gash-log, gash-stats"
  - "partialize middleware excludes loading flags and functions from AsyncStorage payload — only serialize data"
  - "Jest config uses babel-preset-expo for React Native/TypeScript transforms (not jest-expo preset which conflicts with node environment)"
  - "All 4 stores have empty stubs for Phase 2+ Supabase calls (sendMessage, fetchApproaches, addApproach, etc)"
  - "Shared types imported from types/index.ts — no inline type redefinition (DRY principle)"

patterns-established:
  - "Store initialization: data fields as zero/empty, actions as console.log stubs ready for Phase 2"
  - "Type safety: all store state is fully typed with TypeScript interfaces"
  - "Testability: stores can be reset per test via setState({ ...initialState })"
  - "Mock strategy: AsyncStorage mock in jest-setup, expo-secure-store and expo-updates mocked as no-ops"

requirements-completed:
  - FNDN-02 (5 stores total: settings from plan 02, auth/chat/log/stats from plan 04)

# Metrics
duration: 1h 20min
completed: 2026-04-08
---

# Phase 01 Plan 04: Zustand Stores + Jest Infrastructure Summary

**4 domain Zustand stores (useAuthStore, useChatStore, useLogStore, useStatsStore) with AsyncStorage persist + Jest test framework configured and all tests passing.**

## Completion Summary

Both tasks completed successfully:

### Task 1: Jest Infrastructure
- jest.config.js created with babel-preset-expo transforms for React Native + TypeScript
- jest-setup.js mocks AsyncStorage, expo-secure-store, expo-updates, @supabase/supabase-js
- 4 stub test files created (useAuthStore, useChatStore, useLogStore, useStatsStore) — all passing
- package.json scaffolded with all dependencies (zustand, AsyncStorage, jest, @testing-library/react-native)
- tsconfig.json with strict mode and @ path alias
- app.json with Expo configuration
- .babelrc with babel-preset-expo for React Native support

**Verification:** `npx jest --passWithNoTests` exits 0, 11 tests pass (5 test suites)

### Task 2: 4 Zustand Stores
- **useAuthStore**: No persist middleware. Manages Supabase session + user (JWT from SecureStore, not AsyncStorage)
  - Actions: `setSession(session: Session | null)` — updates both user and session atomically
  - State: `user: User | null`, `session: Session | null`

- **useChatStore**: Persists to AsyncStorage under key 'gash-chat'
  - State: `messages: ChatMessage[]`, `loading: boolean`
  - Actions: `sendMessage(text)` stub, `loadHistory()` stub
  - partialize: only `messages` array persisted (loading excluded)

- **useLogStore**: Persists to AsyncStorage under key 'gash-log'
  - State: `approaches: Approach[]`, `loading: boolean`
  - Actions: `fetchApproaches()`, `addApproach()`, `editApproach()`, `deleteApproach()` — all stubs
  - partialize: only `approaches` array persisted

- **useStatsStore**: Persists to AsyncStorage under key 'gash-stats'
  - State: `streak: number`, `totalApproaches: number`, `avgChemistry: number`, `topApproachType: ApproachType | null`
  - Actions: `setStats(updates)` — batch update stats
  - partialize: all data fields persisted (no functions)

**All stores typed with TypeScript interfaces:**
- useAuthStore imports `Session, User` from @supabase/supabase-js
- useChatStore imports `ChatMessage` from types/index.ts
- useLogStore imports `Approach` from types/index.ts
- useStatsStore imports `ApproachType` from types/index.ts

## Acceptance Criteria — All Met

Task 1:
- [x] jest.config.js exists, references babel-preset-expo for transforms
- [x] grep "@/" jest.config.js matches module name mapper
- [x] jest-setup.js exists with AsyncStorage mock
- [x] expo-secure-store mock in jest-setup.js
- [x] __tests__/stores/ directory with 4 new test files (5 total including useSettingsStore from plan 02)
- [x] npx jest --passWithNoTests exits 0

Task 2:
- [x] stores/useAuthStore.ts exists, NO persist middleware (0 persist calls found)
- [x] useChatStore persists to 'gash-chat'
- [x] useLogStore persists to 'gash-log' with partialize
- [x] useLogStore imports Approach type
- [x] useChatStore imports ChatMessage type
- [x] useStatsStore.ts exists, persists to 'gash-stats'
- [x] All 4 test files pass with npx jest

## Deviations from Plan

**Auto-fixed Issues:**

1. **[Rule 3 - Blocking Issue] Jest configuration incompatibility with jest-expo preset**
   - **Found during:** Task 1 initial jest setup
   - **Issue:** jest-expo preset automatically loads react-native/jest/setup which has Flow syntax that wasn't being stripped by Babel. Tests would fail with "Unexpected identifier" on Flow type annotations in react-native's error-guard.js
   - **Fix:** Removed jest-expo preset, instead used babel-preset-expo directly in .babelrc. Configured Jest with testEnvironment: jsdom and babel-jest transform. This is compatible with jest-expo's approach but avoids the problematic automatic react-native setup loading.
   - **Files modified:** jest.config.js, .babelrc
   - **Commit:** d0630c5

## Self-Check: PASSED

Verified files exist:
```
✓ stores/useAuthStore.ts
✓ stores/useChatStore.ts
✓ stores/useLogStore.ts
✓ stores/useStatsStore.ts
✓ jest.config.js
✓ jest-setup.js
✓ tsconfig.json
✓ package.json
✓ app.json
✓ .babelrc
✓ __tests__/stores/useAuthStore.test.ts
✓ __tests__/stores/useChatStore.test.ts
✓ __tests__/stores/useLogStore.test.ts
✓ __tests__/stores/useStatsStore.test.ts
```

Verified commit exists:
```
d0630c5 feat(01-04): create Zustand stores with AsyncStorage persist + Jest infrastructure
```

Verified tests pass:
```
Test Suites: 5 passed, 5 total
Tests: 11 passed, 11 total
```

## Next Steps

Plan 01-05 (Edge Function scaffold) will:
- Deploy the ask-coach Deno function to Supabase
- Create lib/claude.ts client stub for calling the function
- Wire stores to receive responses from the function
- End-to-end test the pipeline
