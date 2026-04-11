# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project

**Gash (גש)** — Hebrew AI dating coach + approach tracker. React Native (Expo) mobile app for Israeli men ages 18-35. The app has 5 screens: AI Coach (chat), Quick Log, Journal, Dashboard, Tips & Missions.

**Always respond to the user in Hebrew.** All UI copy, error messages, placeholders, and button labels are in Hebrew.

---

## Stack

- **Monorepo**: Nx + npm workspaces — `apps/mobile`, `apps/server`, `libs/*`
- **Mobile**: React Native (Expo) at `apps/mobile/` — Expo Go compatible, no EAS dev build needed
- **Server**: Next.js at `apps/server/` — deployed to Vercel. Holds all AI agents + Supabase data calls
- **Database + Auth**: Supabase (PostgreSQL + Phone OTP via Twilio). Auth direct from mobile. Data via server.
- **AI**: Codex API — model `Codex-haiku-4-5-20251001` only, called from `apps/server/` only (never from mobile)
- **Shared libs**: `@gash/types`, `@gash/schemas` (Zod), `@gash/constants`, `@gash/api-client`
- **State**: Zustand + AsyncStorage persist. Stores call `@gash/api-client` — never Supabase directly for data
- **Navigation**: Expo Router v4 (file-based routing)
- **Forms**: react-hook-form + zod (schemas from `@gash/schemas`)
- **Language**: TypeScript strict throughout

---

## Folder Structure (Nx Monorepo)

```
apps/
  mobile/                     ← Expo app (Expo Go compatible, npm workspace)
    app/                      ← Expo Router v4 pages (file-based routing)
      _layout.tsx             ← Root layout: RTL boot, auth guard, Supabase session
      (tabs)/
        _layout.tsx           ← Tab bar definition (5 tabs, Hebrew labels, RTL order)
        coach.tsx             ← AI Chat screen
        log.tsx               ← Quick log entry (opens bottom sheet)
        journal.tsx           ← Approach history list + filters
        dashboard.tsx         ← Analytics + charts
        tips.tsx              ← Tips library + weekly mission
      auth/
        index.tsx             ← Phone number input screen
        verify.tsx            ← OTP verification screen
    components/               ← Shared React components (by feature)
      chat/                   ← ChatBubble, TypingIndicator, ChatInput
      log/                    ← LogBottomSheet, DropdownField, DatePicker
      journal/                ← JournalListItem, FilterBar, SearchInput
      dashboard/              ← KPICard, ChemistryLineChart, SuccessBarChart, InsightCard
      tips/                   ← TipCard, MissionCard, StreakBadge
      ui/                     ← Shared: Button, Input, Screen, Typography
    stores/                   ← Zustand stores with AsyncStorage persist
      useAuthStore.ts         ← user, session, signIn, signOut
      useChatStore.ts         ← messages[], sendMessage, loadHistory
      useLogStore.ts          ← approaches[], addApproach, editApproach, deleteApproach
      useStatsStore.ts        ← computed KPIs, streak, weeklyMission
      useSettingsStore.ts     ← rtlInitialized flag, preferences
    lib/
      supabase.ts             ← createClient() with expo-secure-store session adapter
      server.ts               ← SERVER_URL + getAuthHeaders() for api-client

  server/                     ← Next.js App Router (Vercel deployment)
    app/api/
      coach/route.ts          ← POST /api/coach (coach/boost/debrief routing)
      coach/onboarding/       ← POST /api/coach/onboarding
      coach/reply/            ← POST /api/coach/reply (sonnet)
      coach/opener/           ← POST /api/coach/opener
      approaches/route.ts     ← GET/POST /api/approaches
      approaches/[id]/        ← PUT/DELETE /api/approaches/:id
      insights/route.ts       ← GET /api/insights
    lib/
      auth.ts                 ← verifyAuth(request) → User | null
      supabase.ts             ← supabaseAdmin (service role) + createUserClient
      Codex.ts               ← callClaude / callClaudeJSON (Anthropic SDK)
      agents/                 ← router.ts + 8 agent files

libs/                         ← Shared npm workspaces (imported as @gash/*)
  types/src/index.ts          ← @gash/types — all TS interfaces + API types
  schemas/src/index.ts        ← @gash/schemas — Zod schemas (mobile forms ↔ server validation)
  constants/src/index.ts      ← @gash/constants — Hebrew labels, tips, missions, enums
  api-client/src/index.ts     ← @gash/api-client — typed HTTP client (mobile → server only)
```

---

## App Flow

### Authentication
1. App opens → root `_layout.tsx` checks Supabase session
2. No session → redirect to `auth/index` (phone input)
3. User enters Israeli number (`+972...`) → `supabase.auth.signInWithOtp({ phone })`
4. SMS arrives → `auth/verify` → `supabase.auth.verifyOtp({ phone, token })`
5. On success → JWT saved in `expo-secure-store` → redirect to `(tabs)/coach`
6. On subsequent opens → Supabase auto-refreshes the JWT, session persists

### AI Chat (core feature)
1. User types in `coach.tsx` → `useChatStore.sendMessage(text)`
2. Store calls `lib/Codex.ts` → POST to `supabase/functions/ask-coach` with JWT header
3. Edge Function: verifies JWT, fetches last 15 messages from `chat_messages`, calls Codex API
4. Codex responds in Hebrew → Edge Function returns response → store saves to `chat_messages` table
5. UI shows response with typewriter animation (no real streaming — simulated client-side)

### Approach Logging
1. FAB on `log.tsx` → opens `@gorhom/bottom-sheet`
2. 8-field form: date, location, approach type, opener, response, chemistry (slider 1-10), follow-up, notes
3. Submit → insert to `approaches` table → brief Hebrew AI feedback from Edge Function
4. `useLogStore` updates optimistically → journal and dashboard reflect new entry

---

## Supabase Patterns

### Client init (`lib/supabase.ts`)
```ts
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { storage: ExpoSecureStoreAdapter, autoRefreshToken: true, persistSession: true } }
)
```

### Auth session listener (root `_layout.tsx`)
```ts
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.getState().setSession(session)
  if (!session) router.replace('/auth')
})
```

### RLS — every table query is user-scoped automatically
All tables have `auth.uid() = user_id` RLS policies. Never filter by user_id manually — Supabase handles it.

### Edge Function call pattern
```ts
const { data, error } = await supabase.functions.invoke('ask-coach', {
  body: { messages: recentMessages, userContext: { approachCount, topType } }
})
```
The JWT is forwarded automatically by `supabase.functions.invoke`.

---

## RTL Rules

- `I18nManager.forceRTL(true)` + `Updates.reloadAsync()` called once on first boot (guarded by `useSettingsStore.rtlInitialized`)
- Use `paddingStart`/`paddingEnd`, `marginStart`/`marginEnd` — never `Left`/`Right` in styles
- Directional icons (arrows, chevrons) need `transform: [{ scaleX: -1 }]`
- Tab order in `(tabs)/_layout.tsx` is reversed so rightmost tab appears first visually
- Test RTL on physical device — Expo Go simulator may behave differently

---

## Codex API (Edge Function side)

- Model: `Codex-haiku-4-5-20251001` — never use `Codex-3-5-*` (legacy, retired)
- System prompt: written **in Hebrew** (not English with "respond in Hebrew")
- Context window: pass last 15 messages from `chat_messages` as the `messages` array
- No streaming — return full `content[0].text` in response body
- API key in Supabase secret `CLAUDE_API_KEY` — access via `Deno.env.get('CLAUDE_API_KEY')`

---

## Database Schema (summary)

```sql
users          (id uuid, phone, name, created_at)
approaches     (id, user_id, date, location, approach_type, opener, response, chemistry_score, follow_up, notes)
chat_messages  (id, user_id, role, content, created_at)
user_insights  (user_id, weekly_mission, missions_completed, streak, last_analysis_at)
```
`approach_type`: `'direct' | 'situational' | 'humor' | 'online'`
`follow_up`: `'meeting' | 'text' | 'instagram' | 'nothing'`

---

## Critical — Do Not

- **Do not call Codex API from mobile** — always through `apps/server/` Next.js routes
- **Do not call Supabase data APIs from mobile** — use `@gash/api-client` only. Auth (Supabase SDK) is the only exception
- **Do not expose secrets in mobile** — never use `SUPABASE_SERVICE_ROLE_KEY` or `CLAUDE_API_KEY` in `apps/mobile/` → server only
- **Do not use directional style props** — avoid `paddingLeft`, `marginRight`, `left: 0`. Use `paddingStart`, `marginEnd`, etc. for RTL compliance
- **Do not write UI copy in English** — all text is Hebrew (labels, errors, placeholders, buttons)
- **Do not hardcode `textAlign: 'left'`** — use `'right'` or `'auto'` (RTL context)
- **Do not store secrets locally** — keep API keys in `.env` or Supabase secrets, never commit them
- **Do not import from sibling apps** — use npm workspaces (`@gash/types`, `@gash/schemas`, etc.)

---

## AI Agents (Next.js server routing)

All agents live in `apps/server/lib/agents/`. Router at `apps/server/lib/agents/router.ts` detects intent before calling Codex.

| type | מופעל מתי | מודל | מחזיר |
|------|-----------|------|--------|
| `onboarding` | פעם אחת — אחרי הרשמה | haiku | multi-turn (4 שלבים) → JSON פרופיל |
| `coach` | כל הודעה בצ'אט | haiku | טקסט + היסטוריית 15 הודעות |
| `boost` | backend זיהה "עומד לפנות" | haiku | 2 משפטים: ביטחון + פתיחה מוכנה |
| `reply-coach` | הודעה בודדת / thread שלם | **sonnet** | JSON — ניתוח + 3 תגובות |
| `situation-opener` | בחירת מיקום לפנייה | haiku | JSON — 3 פתיחות + followUp |
| `approach-feedback` | אחרי כל שמירת גישה | haiku | JSON — פידבק + טיפ |
| `debrief` | אחרי גישה כושלת (chemistry ≤ 4) | haiku | multi-turn (2 שלבים): שאלה → אבחנה |
| `insights` | דשבורד / כל 24 שעות | haiku | JSON — תובנות + משימה שבועית |

**routing:** backend מזהה intent מטקסט לפני Codex. ראה `skills/agent-routing-pattern.md`.
**JSON agents** משתמשים ב-prefill (`{ role: 'assistant', content: '{' }`). ראה `skills/json-agent-pattern.md`.
**היסטוריית צ'אט:** נשלפת מ-`chat_messages` ב-backend, לא בclient. Codex לא זוכר בין קריאות.

לפני כל קריאת `coach` — בנה `userProfile` מהגישות ושלח אותו בתוך ה-system prompt:
```ts
const userProfile = await buildUserContext(userId)
// { totalApproaches, bestType, worstType, avgChemistry, recentPattern }
// → נדחף ל-system prompt של coach
```

פרומפטים מלאים: `.planning/agents-prompts.md`
סקילסים לפיתוח: `.planning/skills/`

---

## Project Phases

Planning docs in `.planning/phases/`.

| Phase | Status | Focus |
|-------|--------|-------|
| Phase 1: Foundation | ✅ Complete | Nx monorepo setup, shared libs, auth, chat scaffold |
| Phase 1.5: Nx Migration | ✅ Complete | Full monorepo migration, all 8 agents, typed api-client |
| Phase 2: Chat & Coach | ✅ Complete | AI coach integration, message history, RTL compliance |
| Phase 3: Log Journal | ✅ Complete | Approach logging (form), CRUD, journal list, filters |
| Phase 4: Dashboard | ✅ Complete | Analytics, charts, insights, weekly missions |
| Phase 5: Tips & Missions | ✅ Complete | Tips library, mission tracking, streak system |
| Phase 6: Polish & Launch | ✅ Complete | Error boundaries, offline mode, push notifications, analytics, caching |

**Status:** MVP Ready for TestFlight/EAS Build (see `.planning/DEPLOYMENT_CHECKLIST.md`)
