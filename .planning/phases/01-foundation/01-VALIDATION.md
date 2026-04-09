---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest + @testing-library/react-native (Wave 0 installs) |
| **Config file** | `jest.config.js` — Wave 0 creates |
| **Quick run command** | `npx jest --passWithNoTests` |
| **Full suite command** | `npx jest --passWithNoTests --coverage` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --passWithNoTests`
- **After every plan wave:** Run `npx jest --passWithNoTests --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01-01 | 1 | FNDN-01 | manual | `npx supabase db diff` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01-01 | 1 | FNDN-01 | manual | check Supabase dashboard | — | ⬜ pending |
| 1-02-01 | 01-02 | 2 | FNDN-02 | manual | physical device RTL check | — | ⬜ pending |
| 1-03-01 | 01-03 | 2 | FNDN-03 | unit | `npx jest stores/` | ❌ W0 | ⬜ pending |
| 1-04-01 | 01-04 | 2 | FNDN-03 | unit | `npx jest stores/` | ❌ W0 | ⬜ pending |
| 1-05-01 | 01-05 | 3 | FNDN-04 | manual | invoke Edge Function from app | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `jest.config.js` — Jest config for React Native + TypeScript
- [ ] `jest-setup.ts` — global mocks (AsyncStorage, SecureStore, expo-updates)
- [ ] `__tests__/stores/` — stub test files for all 5 Zustand stores
- [ ] `package.json` devDependencies: `jest`, `@testing-library/react-native`, `@types/jest`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RTL layout on device | FNDN-02 | I18nManager.isRTL unreliable in Expo Go sim | Open app on physical iOS/Android device. Verify tab bar is right-to-left, text flows right-to-left |
| Supabase schema migrated | FNDN-01 | Requires live Supabase connection | Check Supabase Dashboard → Table Editor — all 4 tables exist with correct columns |
| RLS policies enforce user isolation | FNDN-01 | Requires 2 test accounts | Sign in as user A, insert row. Sign in as user B, verify they cannot query user A's rows |
| Edge Function returns hardcoded response | FNDN-04 | Requires deployed Edge Function + app call | Call `supabase.functions.invoke('ask-coach')` from app, verify Hebrew response received |
| App loads in Expo Go | FNDN-02 | Must scan QR on device | Run `npx expo start`, scan QR, verify app loads without native module errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
