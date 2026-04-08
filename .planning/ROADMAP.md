# Roadmap: Gash (גש)

## Overview

Seven phases take Gash from an empty Expo project to an App Store–ready Hebrew AI dating coach. Phase 1 establishes the foundation. **Phase 1.5 migrates to an Nx monorepo** with a Next.js server on Vercel — all Claude API calls and Supabase data operations move server-side; the mobile app uses a typed `@gash/api-client` to talk to the server. Phase 2 adds phone auth and the core AI chat loop. Phases 3–5 deliver the tracker, journal, dashboard, and tips. Phase 6 hardens and ships.

**Architecture (from Phase 1.5 onward):**
- `apps/mobile/` — Expo app (Expo Go compatible). Auth direct to Supabase. All data/AI via Next.js server.
- `apps/server/` — Next.js on Vercel. Holds all 8 AI agents, Supabase service role client, Claude API key.
- `libs/types/`, `libs/schemas/`, `libs/constants/`, `libs/api-client/` — shared code.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Supabase project + schema, RTL boot config, Expo Router shell, Zustand stores, Edge Function scaffold (Expo Go compatible)
- [ ] **Phase 1.5: Nx Monorepo Migration (INSERTED)** - Nx workspace, apps/mobile + apps/server (Next.js/Vercel), libs (types/schemas/constants/api-client), all AI agents moved server-side, Edge Functions deleted
- [ ] **Phase 2: Auth & AI Coach** - Phone OTP auth (Supabase+Twilio), Claude API via Next.js server, custom FlatList chat UI, Supabase message persistence via server
- [ ] **Phase 3: Approach Tracker & Journal** - Bottom sheet log form, Firestore CRUD, journal list with filters and search
- [ ] **Phase 4: Dashboard & Analytics** - Metrics computation, gifted-charts visualizations, AI insight strings, real-time updates
- [ ] **Phase 5: Tips, Missions & Gamification** - Static tips library, weekly mission display and completion, streak counter
- [ ] **Phase 6: Polish & Launch Prep** - RTL audit, performance hardening, error handling, EAS production build, App Store metadata

## Phase Details

### Phase 1: Foundation
**Goal**: The app runs in Expo Go with RTL enforced, all 5 tabs navigable in Hebrew, Zustand stores initialized, Supabase schema migrated, and a working Edge Function scaffold that returns a hardcoded response.
**Depends on**: Nothing (first phase)
**Requirements**: FNDN-01, FNDN-02, FNDN-03, FNDN-04
**Success Criteria** (what must be TRUE):
  1. App runs in Expo Go on iOS and Android (no EAS dev build required)
  2. All UI renders right-to-left — Hebrew text, tab labels, and layout flow from right to left on both platforms
  3. All 5 tabs (Coach, Log, Journal, Dashboard, Tips) are reachable via bottom tab navigation with Hebrew labels
  4. Calling the `ask-coach` Supabase Edge Function from the app returns a hardcoded response without error (pipeline verified end-to-end)
  5. Zustand stores (`useAuthStore`, `useChatStore`, `useLogStore`, `useStatsStore`, `useSettingsStore`) are initialized with AsyncStorage persistence and importable from any screen
  6. Supabase schema is migrated: `users`, `approaches`, `chat_messages`, `user_insights` tables with RLS policies
**Plans**: 5 plans

Plans:
- [x] 01-01-PLAN.md — Supabase project setup: schema migrations (4 tables + RLS + indexes), .env wired
- [x] 01-02-PLAN.md — RTL boot config: useSettingsStore with rtlInitialized flag, I18nManager.forceRTL in root layout
- [x] 01-03-PLAN.md — Expo Router v4 navigation shell: 5-tab layout Hebrew labels RTL order, placeholder screens, lib/supabase.ts, types/index.ts
- [x] 01-04-PLAN.md — Zustand stores scaffold: 4 remaining stores (auth/chat/log/stats) with persist, Jest infrastructure
- [ ] 01-05-PLAN.md — Edge Function scaffold: ask-coach Deno function deployed, lib/claude.ts client stub, end-to-end verified

### Phase 1.5: Nx Monorepo Migration (INSERTED)
**Goal**: Convert the root Expo project into an Nx monorepo. `apps/mobile` (Expo), `apps/server` (Next.js on Vercel), `libs/types`, `libs/schemas`, `libs/constants`, `libs/api-client`. All AI agents and Supabase data calls move to the server. Edge Functions deleted.
**Depends on**: Phase 1
**Requirements**: ARCH-01
**Success Criteria** (what must be TRUE):
  1. `npx nx run mobile:start` launches Expo Go — identical to before
  2. `npx nx run server:dev` starts Next.js locally on port 3001
  3. Mobile sends chat message → Next.js → Claude → Hebrew reply displayed
  4. All Zustand stores use `@gash/api-client` for data (no direct Supabase data calls from mobile)
  5. `supabase/functions/` deleted
  6. Next.js server deployed to Vercel, mobile `.env` points to production URL
**Plans**: 5 plans

Plans:
- [ ] 01.5-01 — Nx workspace init + apps/mobile migration
- [ ] 01.5-02 — libs scaffold: types, schemas, constants, api-client skeleton
- [ ] 01.5-03 — apps/server: Next.js + all 8 AI agents + 7 API routes
- [ ] 01.5-04 — libs/api-client implementation + mobile stores wiring
- [ ] 01.5-05 — Edge Functions cleanup + Vercel deploy

**Implementation plan:** `docs/superpowers/plans/2026-04-08-nx-monorepo-migration.md`
**Design spec:** `docs/superpowers/specs/2026-04-08-nx-monorepo-migration-design.md`

---

### Phase 2: Auth & AI Coach
**Goal**: Users can sign in with an Israeli phone number, send Hebrew messages to the Gash AI persona, and have their conversation history persist across sessions.
**Depends on**: Phase 1.5
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06
**Success Criteria** (what must be TRUE):
  1. User can enter an Israeli phone number, receive an OTP via SMS, verify it, and land on the main app
  2. User session survives closing and reopening the app (no re-login required)
  3. User can sign out from any screen and be returned to the auth screen
  4. User sends a Hebrew message and receives a Hebrew reply from the Gash persona within 2 seconds on a standard Israeli mobile connection
  5. Conversation history loads from Supabase when the chat screen opens, showing previous messages
  6. User can long-press any AI message to copy it to clipboard
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 02-01: Supabase Auth phone OTP flow — sign-in screen with Israeli phone input (`+972` prefix), OTP verification screen, `supabase.auth.signInWithOtp({ phone })` + `verifyOtp`, Twilio configured in Supabase Dashboard, test number configured
- [ ] 02-02: Auth store + session persistence — `useAuthStore` wired to `supabase.auth.onAuthStateChange`, JWT token persisted in `expo-secure-store`, protected route logic in root layout, sign-out action
- [ ] 02-03: `ask-coach` Edge Function — full Claude integration: Hebrew system prompt, `claude-haiku-4-5-20251001` API call, sliding window context (last 15 messages from `chat_messages` table), JWT auth verification, `CLAUDE_API_KEY` from Supabase secrets
- [ ] 02-04: Chat UI — custom RTL `FlatList` with Hebrew message bubbles, typewriter animation for AI responses (simulates streaming), typing indicator (`...`), copy-to-clipboard on long press
- [ ] 02-05: Supabase message persistence — `useChatStore` reads/writes `chat_messages` table via `@supabase/supabase-js`, messages loaded on screen mount ordered by `created_at`, new messages inserted (no optimistic UI for MVP)

### Phase 3: Approach Tracker & Journal
**Goal**: Users can log a new approach in under 60 seconds via a bottom sheet form, view their full history with filters and search, and edit or delete any entry.
**Depends on**: Phase 2
**Requirements**: TRCK-01, TRCK-02, TRCK-03, TRCK-04, TRCK-05, TRCK-06, TRCK-07, JRNL-01, JRNL-02, JRNL-03, JRNL-04, JRNL-05, JRNL-06
**Success Criteria** (what must be TRUE):
  1. Tapping the FAB button opens a bottom sheet log form with all 8 fields visible and usable
  2. A complete approach entry can be submitted in under 60 seconds using dropdowns and presets
  3. A brief Hebrew AI feedback message appears after saving (e.g., "גישה ישירה — יפה!")
  4. The journal screen shows all logged entries sorted by date, each displaying chemistry score, approach type, and follow-up result
  5. User can filter the journal by approach type, date range, and search by location name
  6. User can tap any entry to view full details, and can edit or delete it from the detail screen
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 03-01: `@gorhom/bottom-sheet` v5 log form — RTL form layout, all 8 fields (date picker, location text, approach type dropdown, opener preset, response preset, `@react-native-community/slider` v5 for chemistry 1–10, follow-up type dropdown, notes text area), `react-hook-form` + `zod` validation
- [ ] 03-02: Supabase approach CRUD — insert/update/delete on `approaches` table, `useLogStore` with local optimistic updates, brief AI feedback string generated via `ask-coach` Edge Function call after save
- [ ] 03-03: Journal list screen — RTL `FlatList` showing all entries (newest first), list item layout with chemistry score prominent, approach type, and follow-up result, Supabase query with `order('date', { ascending: false })`
- [ ] 03-04: Journal filters + search — filter pills for approach type, date range modal, location search input, Supabase `.eq()` / `.gte()` / `.ilike()` query chaining, entry detail screen with full fields

### Phase 4: Dashboard & Analytics
**Goal**: Users can see a real-time dashboard of their personal coaching metrics — 4 KPIs, 2 charts, and an AI-generated insight string derived from their logged data.
**Depends on**: Phase 3
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05
**Success Criteria** (what must be TRUE):
  1. Dashboard displays all 4 key metrics: total approaches, success rate (%), average chemistry score, and top approach type
  2. A line graph shows chemistry score trend over the last 30 entries with RTL Y-axis on the right side
  3. A bar chart shows success rate broken down by the 4 approach types
  4. An AI insight string (e.g., "גישות ישירות עובדות הכי טוב בשבילך") appears below the charts, generated from the user's data
  5. All metrics and charts update without a manual refresh when a new approach is logged
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 04-01: Metrics computation — `useStatsStore` derives 4 KPIs from `useLogStore` data reactively, or via Supabase aggregate query (`count`, `avg`) on `approaches` table
- [ ] 04-02: `react-native-gifted-charts` visualizations — line chart (chemistry trend, 30 entries, `yAxisSide='right'`), bar chart (success rate by type, 4 bars), both RTL-tested on physical device
- [ ] 04-03: `buildUserContext()` — function in Edge Function that queries last 30 approaches, computes `bestType/worstType/avgChemistry/recentPattern`, injected into every `coach` system prompt from this phase onward (see `.planning/skills/user-profile-builder.md`)
- [ ] 04-04: AI insight strings — `ask-coach` with `type: 'insights'` called on dashboard open, returns JSON with 2-3 Hebrew insight strings + weeklyMission, written to `user_insights` table (see `.planning/agents-prompts.md`)
- [ ] 04-05: Real-time updates — Supabase Realtime `channel` subscription on `approaches` table wired to `useLogStore`, stats recomputed on insert/update, dashboard re-renders without navigation

### Phase 5: Tips, Missions & Gamification
**Goal**: Users can browse a Hebrew tips library, see their current weekly mission, mark it complete, and track their daily approach streak.
**Depends on**: Phase 4
**Requirements**: TIPS-01, TIPS-02, TIPS-03, TIPS-04, TIPS-05, TIPS-06
**Success Criteria** (what must be TRUE):
  1. Tips screen shows a categorized library of Hebrew tips (approach, conversation, confidence) browsable without an internet connection
  2. User can search tips by Hebrew keyword and see filtered results instantly
  3. Current weekly mission is displayed prominently on the tips/missions screen
  4. User can tap to mark the current mission complete, and the completion is visually confirmed (Lottie animation)
  5. Streak counter shows the correct count of consecutive days with at least one logged approach
  6. Streak count is visible in the tab bar or a persistent header element on every screen
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 05-01: Static tips library — Hebrew tips data file (JSON/TS) organized by category, `FlatList` with category filter tabs, keyword search with instant local filtering (no server call)
- [ ] 05-02: Weekly mission display — mission data structure (title, description, target count, week identifier), current mission shown in prominent card, mission rotation logic (new mission each ISO week)
- [ ] 05-03: Mission completion + streak — mark-complete action writes to `user_insights` table via Supabase, Lottie celebration animation on completion, streak computed from approach log dates (consecutive days with entries), streak persisted in `useStatsStore`
- [ ] 05-04: Streak visibility — streak badge integrated into tab bar label or persistent header component, visible on all 5 tabs without additional navigation

### Phase 6: Polish & Launch Prep
**Goal**: The app passes an RTL layout audit, handles all error states gracefully, and is submitted to the App Store and Google Play via EAS Submit with full Hebrew store metadata.
**Depends on**: Phase 5
**Requirements**: (all 36 v1 requirements complete — this phase delivers shipability)
**Success Criteria** (what must be TRUE):
  1. Every screen passes an RTL audit — no left-aligned text, no mirrored icons, no broken layouts on both iOS and Android physical devices
  2. All network errors (AI timeout, Firestore offline, auth failure) show a Hebrew error message and a recovery action; no unhandled crashes
  3. Cold-start time on a mid-range Android device is under 3 seconds from tap to interactive
  4. EAS production build succeeds for both platforms with managed credentials (no local keystore required)
  5. App Store Connect and Google Play Console listings have Hebrew title, description, screenshots, and privacy policy URL
**Plans**: TBD

Plans:
- [ ] 06-01: RTL audit pass — systematic screen-by-screen review on physical iOS and Android devices, fix all text alignment, icon direction, and layout mirroring issues
- [ ] 06-02: Error handling + loading states — Hebrew error messages for all failure modes (network timeout, auth error, Firestore offline, AI rate limit), loading skeletons on data-heavy screens, retry actions
- [ ] 06-03: Performance pass — Hermes engine verified enabled, `FlatList` `getItemLayout` on chat and journal, Firestore query limits, cold-start profiling on Android
- [ ] 06-04: EAS production build + submit — `eas.json` production profile, `eas build --platform all --profile production`, `eas submit` configured for both stores, Hebrew App Store metadata, privacy policy URL, age rating (17+)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/5 | In Progress|  |
| 2. Auth & AI Coach | 0/5 | Not started | - |
| 3. Approach Tracker & Journal | 0/4 | Not started | - |
| 4. Dashboard & Analytics | 0/4 | Not started | - |
| 5. Tips, Missions & Gamification | 0/4 | Not started | - |
| 6. Polish & Launch Prep | 0/4 | Not started | - |
