# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Gash (גש)** — Hebrew AI dating coach + approach tracker. React Native (Expo) mobile app for Israeli men ages 18-35. The app has 5 screens: AI Coach (chat), Quick Log, Journal, Dashboard, Tips & Missions.

**Always respond to the user in Hebrew.** All UI copy, error messages, placeholders, and button labels are in Hebrew.

---

## Stack

- **Mobile**: React Native (Expo) — Expo Go compatible, no EAS dev build needed during development
- **Database + Auth**: Supabase (PostgreSQL + Phone OTP via Twilio + Edge Functions)
- **AI**: Claude API — model `claude-haiku-4-5-20251001` only, called via Supabase Edge Function
- **State**: Zustand + AsyncStorage persist (one store per domain)
- **Navigation**: Expo Router v3 (file-based routing)
- **Forms**: react-hook-form + zod
- **Language**: TypeScript strict throughout

---

## Folder Structure

```
app/                        ← Expo Router pages
  _layout.tsx               ← Root layout: RTL boot, auth guard, Supabase session
  (tabs)/
    _layout.tsx             ← Tab bar definition (5 tabs, Hebrew labels, RTL order)
    coach.tsx               ← AI Chat screen
    log.tsx                 ← Quick log entry (opens bottom sheet)
    journal.tsx             ← Approach history list + filters
    dashboard.tsx           ← Analytics + charts
    tips.tsx                ← Tips library + weekly mission
  auth/
    index.tsx               ← Phone number input screen
    verify.tsx              ← OTP verification screen

components/
  chat/                     ← ChatBubble, TypingIndicator, ChatInput
  log/                      ← LogBottomSheet, ChemistrySlider, ApproachTypeDropdown
  journal/                  ← JournalListItem, FilterBar, SearchInput
  dashboard/                ← KPICard, ChemistryLineChart, SuccessBarChart, InsightCard
  tips/                     ← TipCard, MissionCard, StreakBadge
  ui/                       ← Shared: Button, Input, Screen, Typography

stores/
  useAuthStore.ts           ← user, session, signIn, signOut
  useChatStore.ts           ← messages[], sendMessage, loadHistory
  useLogStore.ts            ← approaches[], addApproach, editApproach, deleteApproach
  useStatsStore.ts          ← computed KPIs, streak, weeklyMission
  useSettingsStore.ts       ← rtlInitialized flag, preferences

lib/
  supabase.ts               ← createClient() with expo-secure-store session adapter
  claude.ts                 ← callCoach(messages) — calls ask-coach Edge Function

supabase/
  functions/
    ask-coach/
      index.ts              ← Deno Edge Function: validates JWT, calls Claude API
  migrations/               ← SQL: users, approaches, chat_messages, user_insights + RLS

constants/
  tips.ts                   ← Static Hebrew tips data (JSON)
  missions.ts               ← Weekly missions rotation

types/
  index.ts                  ← Approach, ChatMessage, UserInsights, WeeklyMission
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
2. Store calls `lib/claude.ts` → POST to `supabase/functions/ask-coach` with JWT header
3. Edge Function: verifies JWT, fetches last 15 messages from `chat_messages`, calls Claude API
4. Claude responds in Hebrew → Edge Function returns response → store saves to `chat_messages` table
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

## Claude API (Edge Function side)

- Model: `claude-haiku-4-5-20251001` — never use `claude-3-5-*` (legacy, retired)
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

- Do not add Firebase packages (`@react-native-firebase/*`, `firebase`)
- Do not call Claude API directly from client code — always go through `ask-coach` Edge Function
- Do not use directional style props (`paddingLeft`, `marginRight`, `left: 0`)
- Do not write UI copy in English — everything is Hebrew
- Do not use `StyleSheet.create` with hardcoded `textAlign: 'left'` — use `'right'` or `'auto'`

---

## AI Agents (Edge Function routing)

Edge Function אחת: `ask-coach`. ניתוב לפי שדה `type` בבקשה.

| type | מופעל מתי | מחזיר |
|------|-----------|--------|
| `coach` | כל הודעה בצ'אט | טקסט חופשי |
| `profile` | אחרי שמירת גישה | JSON — פידבק קצר |
| `insights` | פתיחת דשבורד / כל 24 שעות | JSON — insight strings |
| `screenshot` | העלאת תמונה (v2) | טקסט — ניתוח שיחה |

לפני כל קריאת `coach` — בנה `userProfile` מהגישות ושלח אותו בתוך ה-system prompt:
```ts
const userProfile = await buildUserContext(userId)
// { totalApproaches, bestType, worstType, avgChemistry, recentPattern }
// → נדחף ל-system prompt של coach
```

פרומפטים מלאים: `.planning/agents-prompts.md`
סקילסים לפיתוח: `.planning/skills/`

---

## GSD Workflow

Planning docs in `.planning/`. Current phase: **Phase 1 — Foundation** (not started).
Run `/gsd:plan-phase 1` to start.
