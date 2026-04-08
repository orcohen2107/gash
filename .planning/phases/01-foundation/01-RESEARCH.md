# Phase 1: Foundation - Research

**Researched:** 2026-04-08
**Domain:** React Native (Expo Go), Expo Router, Supabase, Zustand, RTL/Hebrew
**Confidence:** HIGH

## Summary

Phase 1 establishes every infrastructure layer the Gash app depends on: Expo project scaffold, RTL boot config, 5-tab navigation shell, Zustand stores, Supabase schema + RLS, and a working Edge Function pipeline. No feature code is written — this phase exists purely to prove the stack is wired correctly end-to-end.

The stack is fully defined and locked in CLAUDE.md. The research task is to pin exact package versions, document the correct Expo SDK version (the roadmap says "v3" but current Expo Go requires SDK 52 + expo-router v4), identify the Docker-free workflow for Supabase Edge Functions, and surface RTL gotchas that will cause rework if missed.

Critical finding: `supabase functions serve` requires Docker, which is not installed on this machine. However, `supabase functions deploy` works without Docker via API-based fallback (Supabase CLI v2.87+). The Phase 1 Edge Function plan must use deploy-to-hosted, not local serve.

**Primary recommendation:** Bootstrap with `npx create-expo-app@latest --template tabs` targeting Expo SDK 52, use `npx supabase` for all CLI commands (available without install), and deploy Edge Functions directly to the hosted Supabase project.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FNDN-01 | App uses forced RTL (Hebrew right-to-left) throughout all screens | I18nManager.forceRTL(true) + one-time guard pattern documented in skill file; known Expo Go simulator RTL limitation documented |
| FNDN-02 | App runs in Expo Go on iOS and Android (no EAS dev build required) | Expo Go supports SDK 52; expo-router v4.0.22 is SDK 52 compatible; all required packages are Expo Go compatible |
| FNDN-03 | Tab navigation with 5 tabs: Coach, Log, Journal, Dashboard, Tips | expo-router v4 Tabs + Tabs.Screen API documented; Hebrew labels and RTL tab order pattern documented in skill file |
| FNDN-04 | All text, labels, and UI copy is in Hebrew | Enforced by CLAUDE.md constraint; Hebrew strings in tab options and placeholder screens |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

### Mandatory Rules
- Expo Go compatible — no native modules, no EAS dev build during development
- No Firebase packages anywhere
- Never call Claude API from client — always via `ask-coach` Edge Function
- Model locked: `claude-haiku-4-5-20251001` only (never `claude-3-5-*`)
- No directional style props: `paddingLeft`, `marginRight`, `left: 0` — use `Start`/`End` variants
- No English UI copy — all strings in Hebrew
- No `textAlign: 'left'` — use `'right'` or `'auto'`
- TypeScript strict mode throughout
- One Zustand store per domain
- Auth tokens only in `expo-secure-store`, never AsyncStorage

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo | ~52.0.49 | React Native framework + Expo Go runtime | SDK 52 is current Expo Go stable; avoids EAS build requirement |
| expo-router | ~4.0.22 | File-based routing + tab navigation | SDK 52 maps to expo-router v4 (CLAUDE.md says "v3" but that targets SDK 50 — v4 is correct) |
| @supabase/supabase-js | ^2.102.1 | Supabase client (HTTP-only, no native modules) | Project decision; Expo Go compatible |
| expo-secure-store | ~14.2.4 | Supabase session storage (replaces AsyncStorage for auth) | Required by Supabase client pattern in CLAUDE.md |
| @react-native-async-storage/async-storage | ~1.24.0 | Zustand persist storage | Non-sensitive state only |
| zustand | ^5.0.12 | Client state management with persist middleware | Project decision; one store per domain |
| expo-updates | ~0.27.5 | `Updates.reloadAsync()` for RTL boot sequence | Only way to force RTL on first launch in Expo Go |
| typescript | ^5.3.0 | Strict mode type safety | CLAUDE.md requirement |
| react-native-safe-area-context | ~4.14.1 | Safe area insets for tab bar | Peer dep of expo-router v4 |
| react-native-screens | ~3.37.0 | Native screen containers | Peer dep of expo-router v4 |
| react-native-reanimated | ~3.x | Animations peer dep | Required by expo-router v4 |
| react-hook-form | ^7.72.1 | Forms (Phase 3+, but install now) | Project decision |
| zod | ^4.3.6 | Schema validation | Project decision |

### Supporting (Phase 1 only — needed for scaffold)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-status-bar | ~2.0.1 | Status bar style | Root layout |
| expo-constants | ~17.0.8 | App config access | Edge Function URL from env |

### Version Clarification (IMPORTANT)
The ROADMAP.md says "Expo Router v3" but this was written when SDK 50 was current. As of April 2026:
- Expo Go supports SDK 52 (confirmed via expo.dev/go)
- expo-router v4.0.22 = SDK 52 (confirmed by npm `sdk-52` dist-tag)
- expo-router v3 = SDK 50 (outdated)
- **Use expo-router v4, not v3**

### Installation
```bash
npx create-expo-app@latest gash --template tabs
# Then update to correct versions:
npx expo install expo-router@~4.0.22 @supabase/supabase-js expo-secure-store \
  @react-native-async-storage/async-storage zustand expo-updates \
  react-native-safe-area-context react-native-screens react-native-reanimated \
  expo-status-bar expo-constants react-hook-form zod
```

Or bootstrap with `npx create-expo-app@latest --template blank-typescript` and add router manually.

---

## Architecture Patterns

### Recommended Project Structure
```
gash/
├── app/
│   ├── _layout.tsx          # Root layout: RTL boot guard + Supabase auth listener
│   ├── (tabs)/
│   │   ├── _layout.tsx      # 5-tab Tabs layout, Hebrew labels, RTL order
│   │   ├── coach.tsx        # Placeholder: מאמן AI
│   │   ├── log.tsx          # Placeholder: תיעוד
│   │   ├── journal.tsx      # Placeholder: יומן
│   │   ├── dashboard.tsx    # Placeholder: לוח בקרה
│   │   └── tips.tsx         # Placeholder: טיפים
│   └── auth/
│       ├── index.tsx        # Phone input (Phase 2)
│       └── verify.tsx       # OTP verify (Phase 2)
├── components/ui/           # Shared primitives (scaffold empty)
├── stores/
│   ├── useAuthStore.ts
│   ├── useChatStore.ts
│   ├── useLogStore.ts
│   ├── useStatsStore.ts
│   └── useSettingsStore.ts
├── lib/
│   ├── supabase.ts          # createClient() with SecureStore adapter
│   └── claude.ts            # callCoach() stub (Phase 2 implementation)
├── types/
│   └── index.ts             # Approach, ChatMessage, UserInsights, WeeklyMission
├── supabase/
│   ├── config.toml          # supabase init output
│   ├── functions/
│   │   └── ask-coach/
│   │       └── index.ts     # Hardcoded response scaffold
│   └── migrations/
│       └── 20260408000000_init.sql
├── constants/
│   ├── tips.ts              # Stub (Phase 5)
│   └── missions.ts          # Stub (Phase 5)
├── app.json
├── tsconfig.json
└── .env                     # EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### Pattern 1: RTL Boot Sequence (One-Time Guard)
**What:** Force RTL on first app launch only. Reload is required for I18nManager changes to take effect.
**When to use:** Root `_layout.tsx` on app startup.
**Source:** `.planning/skills/rtl-hebrew-expo.md` + verified Expo issue #32976

```typescript
// app/_layout.tsx
import { I18nManager } from 'react-native'
import * as Updates from 'expo-updates'
import { useSettingsStore } from '@/stores/useSettingsStore'

// Must be called before any component renders
export default function RootLayout() {
  const { rtlInitialized, setRtlInitialized } = useSettingsStore()

  useEffect(() => {
    if (!rtlInitialized) {
      I18nManager.allowRTL(true)
      I18nManager.forceRTL(true)
      setRtlInitialized(true)
      // Updates.reloadAsync() only works in production/standalone builds
      // In Expo Go: will require manual reload; in standalone: reloads automatically
      Updates.reloadAsync().catch(() => {
        // Fails silently in dev mode — RTL will apply on next cold start
      })
    }
  }, [])
  // ...
}
```

**Critical RTL Gotcha:** `Updates.reloadAsync()` does NOT work in Expo Go development mode. RTL takes effect on first cold start of a standalone build. For development testing, use a physical device with the Expo Go app and cold start the app (don't hot reload). This is a known and accepted limitation.

### Pattern 2: Expo Router v4 Tab Layout with Hebrew Labels
**What:** 5-tab layout with Hebrew labels, RTL visual order.
**Source:** `.planning/skills/rtl-hebrew-expo.md` + expo-router v4 docs

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

// Tab array order in file = visual order (RTL: first = rightmost)
// RTL visual order (right to left): מאמן | תיעוד | יומן | לוח | טיפים
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6C63FF',
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      {/* First = rightmost tab in RTL */}
      <Tabs.Screen
        name="coach"
        options={{
          title: 'מאמן AI',
          tabBarLabel: 'מאמן',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'תיעוד',
          tabBarLabel: 'תיעוד',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'יומן',
          tabBarLabel: 'יומן',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'לוח בקרה',
          tabBarLabel: 'לוח',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tips"
        options={{
          title: 'טיפים',
          tabBarLabel: 'טיפים',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bulb-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
```

### Pattern 3: Supabase Client Init with SecureStore
**What:** Creates Supabase client with expo-secure-store adapter for session persistence.
**Source:** CLAUDE.md + `.planning/skills/supabase-rls-pattern.md`

```typescript
// lib/supabase.ts
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
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Required for React Native
    },
  }
)
```

### Pattern 4: Zustand Store with AsyncStorage Persist
**What:** Store scaffold with persist middleware. Auth store is the exception — no persist needed.
**Source:** `.planning/skills/zustand-store-pattern.md`

```typescript
// stores/useSettingsStore.ts (critical for RTL guard)
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface SettingsStore {
  rtlInitialized: boolean
  setRtlInitialized: (value: boolean) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      rtlInitialized: false,
      setRtlInitialized: (value) => set({ rtlInitialized: value }),
    }),
    {
      name: 'gash-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

Key rules from skill file:
- `partialize` — only persist data, not loading/functions
- Auth tokens only in `expo-secure-store`, never AsyncStorage
- `useAuthStore` has NO persist middleware (session managed by Supabase)

### Pattern 5: Supabase Edge Function Scaffold (Hardcoded Response)
**What:** Minimal Edge Function that validates JWT and returns a hardcoded Hebrew response.
**Source:** `.planning/skills/claude-edge-function.md`

```typescript
// supabase/functions/ask-coach/index.ts
import { createClient } from 'npm:@supabase/supabase-js'

Deno.serve(async (req: Request) => {
  // 1. Validate JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // 2. Hardcoded response (Phase 1 scaffold only)
  return new Response(
    JSON.stringify({ text: 'שלום! אני גש, המאמן שלך. מה שלומך היום?' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

**Note:** Phase 1 does NOT call the Claude API. The full routing/Claude integration is Phase 2.

### Anti-Patterns to Avoid
- **Using `paddingLeft`/`paddingRight` in styles:** Breaks RTL layout. Use `paddingStart`/`paddingEnd`.
- **Calling `Updates.reloadAsync()` without error handling:** Throws in Expo Go dev mode. Always wrap in try/catch.
- **Persisting auth session in AsyncStorage:** Security risk. Supabase JWT must go through `expo-secure-store`.
- **Filtering by `user_id` manually in Supabase queries:** RLS handles this automatically. Adding `.eq('user_id', user.id)` is redundant and creates a false dependency.
- **Using `expo-router v3`:** Targets SDK 50, incompatible with current Expo Go SDK 52. Use v4.
- **`textAlign: 'left'`:** Always use `'right'` or `'auto'` for Hebrew text.
- **`I18nManager.isRTL` as a guard:** Known to return false in Expo Go even when RTL is forced. Use the `rtlInitialized` flag from `useSettingsStore` instead.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session persistence | Custom AsyncStorage auth cache | `expo-secure-store` via Supabase client adapter | Token security, auto-refresh, cross-platform |
| State persistence | Manual serialize/deserialize to AsyncStorage | Zustand `persist` middleware + `createJSONStorage` | Handles hydration, rehydration, partialize |
| Tab navigation | Custom tab bar component | expo-router `Tabs` + `Tabs.Screen` | Native performance, deep linking, type-safe routes |
| JWT verification in Edge Function | Custom JOSE/JWT parsing | `supabase.auth.getUser()` with forwarded Authorization header | One line, handles expiry, RLS propagation |
| Type-safe Supabase queries | Generic fetch wrapper | `@supabase/supabase-js` v2 with generated types (optional) | Handles realtime, RLS, retry |

**Key insight:** Every custom solution in this domain introduces a class of bugs that the standard libraries have already solved. The stack is small, battle-tested, and intentionally constrained — resist adding layers.

---

## Database Schema

### Full SQL Migration
```sql
-- supabase/migrations/20260408000000_init.sql

-- 1. Users table
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  name text,
  created_at timestamptz default now()
);

alter table users enable row level security;
create policy "users: owner access"
  on users
  using (auth.uid() = id);

create policy "users: owner insert"
  on users
  for insert
  with check (auth.uid() = id);

-- 2. Approaches table
create type approach_type as enum ('direct', 'situational', 'humor', 'online');
create type follow_up_type as enum ('meeting', 'text', 'instagram', 'nothing');

create table if not exists approaches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  location text,
  approach_type approach_type not null,
  opener text,
  response text,
  chemistry_score integer check (chemistry_score between 1 and 10),
  follow_up follow_up_type,
  notes text,
  created_at timestamptz default now()
);

alter table approaches enable row level security;
create policy "approaches: owner access"
  on approaches
  using (auth.uid() = user_id);

create policy "approaches: owner insert"
  on approaches
  for insert
  with check (auth.uid() = user_id);

create policy "approaches: owner update"
  on approaches
  for update
  using (auth.uid() = user_id);

create policy "approaches: owner delete"
  on approaches
  for delete
  using (auth.uid() = user_id);

-- 3. Chat messages table
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

alter table chat_messages enable row level security;
create policy "chat_messages: owner access"
  on chat_messages
  using (auth.uid() = user_id);

create policy "chat_messages: owner insert"
  on chat_messages
  for insert
  with check (auth.uid() = user_id);

-- 4. User insights table
create table if not exists user_insights (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weekly_mission jsonb,
  missions_completed integer default 0,
  streak integer default 0,
  last_analysis_at timestamptz,
  onboarding_data jsonb,
  updated_at timestamptz default now()
);

alter table user_insights enable row level security;
create policy "user_insights: owner access"
  on user_insights
  using (auth.uid() = user_id);

create policy "user_insights: owner insert"
  on user_insights
  for insert
  with check (auth.uid() = user_id);

create policy "user_insights: owner update"
  on user_insights
  for update
  using (auth.uid() = user_id);
```

**RLS Rule:** Every table enforces `auth.uid() = user_id`. Never add manual user_id filters in app queries — Supabase handles this automatically.

---

## TypeScript Types

```typescript
// types/index.ts

export type ApproachType = 'direct' | 'situational' | 'humor' | 'online'
export type FollowUpType = 'meeting' | 'text' | 'instagram' | 'nothing'

export interface Approach {
  id: string
  user_id: string
  date: string            // ISO date string: '2026-04-08'
  location: string | null
  approach_type: ApproachType
  opener: string | null
  response: string | null
  chemistry_score: number | null  // 1-10
  follow_up: FollowUpType | null
  notes: string | null
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface UserInsights {
  user_id: string
  weekly_mission: WeeklyMission | null
  missions_completed: number
  streak: number
  last_analysis_at: string | null
  onboarding_data: OnboardingData | null
  updated_at: string
}

export interface WeeklyMission {
  id: string
  title: string          // Hebrew
  description: string    // Hebrew
  target_count: number
  week_identifier: string  // ISO week: '2026-W15'
}

export interface OnboardingData {
  initialStyle: ApproachType
  mainChallenge: string
  preferredLocations: string[]
}
```

---

## Supabase Workflow (No Docker)

### Setup Sequence
```bash
# 1. Initialize Supabase in project root
npx supabase init

# 2. Link to your hosted Supabase project (get project-ref from dashboard URL)
npx supabase link --project-ref <your-project-ref>

# 3. Create migration file
mkdir -p supabase/migrations
# Write SQL to supabase/migrations/20260408000000_init.sql

# 4. Push migrations to hosted project (NO Docker required)
npx supabase db push

# 5. Set Edge Function secrets (CLAUDE_API_KEY for Phase 2)
npx supabase secrets set CLAUDE_API_KEY=<your-key>

# 6. Deploy Edge Function (NO Docker required via API fallback)
npx supabase functions deploy ask-coach --no-verify-jwt false

# 7. Test via curl (with anon key)
curl -i --location --request POST \
  'https://<project-ref>.supabase.co/functions/v1/ask-coach' \
  --header 'Authorization: Bearer <anon-key-or-jwt>' \
  --header 'Content-Type: application/json' \
  --data '{"type": "coach", "body": {"text": "שלום"}}'
```

### Supabase Dashboard Alternative
If CLI has issues, migrations can be applied directly via Supabase Dashboard:
1. Go to project → SQL Editor
2. Paste migration SQL
3. Run — no CLI required

### Edge Function Secrets
```bash
# Phase 1: Only needed for JWT verification (uses SUPABASE_URL + SUPABASE_ANON_KEY)
# Phase 2: Add Claude API key
npx supabase secrets set CLAUDE_API_KEY=sk-ant-...

# Verify secrets are set
npx supabase secrets list
```

### .env File (client-side)
```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

`EXPO_PUBLIC_` prefix is required for Expo to expose env vars to the client bundle.

---

## Common Pitfalls

### Pitfall 1: expo-router Version Mismatch
**What goes wrong:** Installing expo-router v3 with Expo SDK 52 causes navigation crashes and metro bundler errors.
**Why it happens:** The roadmap was written for SDK 50. Package versions have moved.
**How to avoid:** Always use the SDK-tagged version: expo-router v4.0.22 for SDK 52.
**Warning signs:** Metro error "Unable to resolve module" on navigation imports; Tabs component missing.

### Pitfall 2: RTL Not Working in Expo Go Simulator
**What goes wrong:** `I18nManager.forceRTL(true)` appears to have no effect in Expo Go on Android; `I18nManager.isRTL` returns false.
**Why it happens:** Known Expo Go limitation (issues #32976, #35394). RTL requires a cold start of a production/standalone build.
**How to avoid:** Test RTL on a physical device with Expo Go. Use `useSettingsStore.rtlInitialized` as the guard flag, not `I18nManager.isRTL`. Accept that the simulator will show LTR in dev — verify RTL works on device.
**Warning signs:** Hebrew text renders left-to-right even after `forceRTL(true)`.

### Pitfall 3: `Updates.reloadAsync()` Throws in Dev Mode
**What goes wrong:** The RTL boot sequence crashes in development because `Updates.reloadAsync()` is not available.
**Why it happens:** `expo-updates` reload only works in production/standalone mode.
**How to avoid:** Wrap `Updates.reloadAsync()` in try/catch. Log the error but don't crash.
**Warning signs:** Red screen: "Cannot use reloadAsync in development mode" or similar.

### Pitfall 4: Supabase JWT Not Forwarded to Edge Function
**What goes wrong:** Edge Function receives unauthorized even when user is logged in.
**Why it happens:** Manually using `fetch()` instead of `supabase.functions.invoke()` and forgetting to add the Authorization header.
**How to avoid:** Always use `supabase.functions.invoke('ask-coach', { body: {...} })`. The SDK forwards the JWT automatically.
**Warning signs:** 401 response from Edge Function; `supabase.auth.getUser()` returns error.

### Pitfall 5: Edge Function Local Dev Requires Docker
**What goes wrong:** `npx supabase functions serve` fails because Docker is not installed.
**Why it happens:** Local Edge Function execution requires Docker.
**How to avoid:** Use `npx supabase functions deploy` for Phase 1 testing. Docker is not installed on this machine — deploy-then-test is the only workflow available.
**Warning signs:** "Docker is not running" error from supabase CLI.

### Pitfall 6: Zustand Persist Hydration Race
**What goes wrong:** Component reads from store before AsyncStorage hydration completes, sees default (empty) values.
**Why it happens:** AsyncStorage reads are async; store is not hydrated synchronously.
**How to avoid:** Use `useSettingsStore.persist.hasHydrated()` or `onFinishHydration` callback before reading critical persisted values (especially `rtlInitialized`).
**Warning signs:** RTL guard runs every launch; `rtlInitialized` is always `false` despite being set.

### Pitfall 7: `detectSessionInUrl: false` Missing
**What goes wrong:** Supabase client tries to parse URL fragments for OAuth tokens, causing errors in React Native.
**Why it happens:** Supabase JS client defaults to web OAuth flow which reads URL hash.
**How to avoid:** Always set `detectSessionInUrl: false` in the Supabase `auth` config for React Native.
**Warning signs:** Startup warning from Supabase about URL parsing.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm installs, npx | ✓ | v18.20.6 | — |
| npx | All CLI commands | ✓ | bundled with npm | — |
| expo CLI | `expo start` | ✓ | 6.3.12 (global) | `npx expo start` |
| Supabase CLI | Migrations, deploy | ✓ (via npx) | 2.87.2 | `npx supabase` |
| Docker | `supabase functions serve` | ✗ | — | Deploy to hosted (API fallback) |
| Deno | Standalone Edge Function run | ✗ | — | Not needed — supabase CLI bundles runtime |
| Homebrew supabase | Permanent CLI install | ✓ (available, not installed) | 2.84.2 | Use `npx supabase` |
| Expo Go app | Physical device testing | Must be installed by dev | SDK 52–55 | — |
| Supabase project | DB + Auth + Functions | Must be created by dev | — | Create at supabase.com |

**Missing dependencies with no fallback:**
- Supabase hosted project: must be created at supabase.com before plan 01-01 can complete (documented in STATE.md blockers)
- Expo Go app: must be installed on physical device for RTL testing

**Missing dependencies with fallback:**
- Docker: Phase 1 uses `supabase functions deploy` (API-based, no Docker required since CLI v2.30+)

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `config.json` — this section is required.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured yet (greenfield project) |
| Config file | none — Wave 0 must create |
| Quick run command | `npx jest --testPathPattern=stores` |
| Full suite command | `npx jest` |

**Note:** Expo projects typically use Jest with `jest-expo` preset. No test infrastructure exists yet.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FNDN-01 | RTL flag persists after first launch | unit | `npx jest --testPathPattern=useSettingsStore` | ❌ Wave 0 |
| FNDN-02 | App boots in Expo Go (Expo SDK 52) | manual smoke | Scan QR code in Expo Go | manual only |
| FNDN-03 | 5 tabs navigable with Hebrew labels | manual smoke | Navigate to each tab in Expo Go | manual only |
| FNDN-04 | All UI strings are Hebrew | manual visual | Inspect each placeholder screen | manual only |
| FNDN-04 | Zustand stores initialize without error | unit | `npx jest --testPathPattern=stores` | ❌ Wave 0 |
| (infra) | Edge Function returns 200 with Hebrew text | integration | `curl` script against hosted URL | ❌ Wave 0 |
| (infra) | Supabase tables exist with RLS | manual check | Supabase Dashboard → Table Editor | manual only |

### Sampling Rate
- **Per task commit:** manual smoke in Expo Go (scan QR, verify tab navigation and Hebrew labels)
- **Per wave merge:** Jest store unit tests + curl Edge Function test
- **Phase gate:** All 6 success criteria verified manually before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `jest.config.js` — `jest-expo` preset config
- [ ] `jest.setup.js` — mock for `@react-native-async-storage/async-storage`
- [ ] `__tests__/stores/useSettingsStore.test.ts` — covers FNDN-01 (RTL persistence)
- [ ] `__tests__/stores/useAuthStore.test.ts` — covers store initialization
- [ ] `scripts/test-edge-function.sh` — curl script for end-to-end Edge Function verify

**Framework install:**
```bash
npx expo install jest-expo jest @types/jest
```

---

## Code Examples

### Supabase Auth Listener in Root Layout
```typescript
// app/_layout.tsx (auth section)
// Source: CLAUDE.md Supabase Patterns section
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      useAuthStore.getState().setSession(session)
      if (!session) router.replace('/auth')
    }
  )
  return () => subscription.unsubscribe()
}, [])
```

### Auth Store (No Persist)
```typescript
// stores/useAuthStore.ts
// Source: .planning/skills/zustand-store-pattern.md
import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'

interface AuthStore {
  user: User | null
  session: Session | null
  setSession: (session: Session | null) => void
}

// NO persist — session managed by Supabase + expo-secure-store
export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  session: null,
  setSession: (session) => set({
    session,
    user: session?.user ?? null,
  }),
}))
```

### Chat Store Scaffold
```typescript
// stores/useChatStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ChatMessage } from '@/types'

interface ChatStore {
  messages: ChatMessage[]
  loading: boolean
  addMessage: (message: ChatMessage) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      loading: false,
      addMessage: (message) => set((s) => ({
        messages: [...s.messages, message]
      })),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'gash-chat',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ messages: state.messages }),
    }
  )
)
```

### Edge Function Call from App
```typescript
// lib/claude.ts (stub for Phase 1, full implementation in Phase 2)
// Source: CLAUDE.md Edge Function call pattern
import { supabase } from './supabase'

export async function callCoach(messages: { role: string; content: string }[]) {
  const { data, error } = await supabase.functions.invoke('ask-coach', {
    body: { type: 'coach', messages }
  })
  if (error) throw error
  return data as { text: string }
}
```

### app.json for Expo SDK 52
```json
{
  "expo": {
    "name": "Gash",
    "slug": "gash",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "gash",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.yourteam.gash"
    },
    "android": {
      "package": "com.yourteam.gash",
      "adaptiveIcon": {
        "backgroundColor": "#6C63FF"
      }
    },
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| expo-router v3 + SDK 50 | expo-router v4 + SDK 52 | SDK 52 release (late 2024) | Roadmap must use v4, not v3 |
| `@react-navigation/bottom-tabs` v6 | v7 (via expo-router v4 deps) | expo-router v4 | API is compatible; no code changes needed |
| `supabase functions serve` requires Docker | `supabase functions deploy` works without Docker | CLI v2.30+ (2024) | Phase 1 can test against hosted without Docker |
| Zustand v4 `createJSONStorage` | Zustand v5 same API | zustand v5 (2024) | Skill file patterns remain valid |
| `firebase/app` + Firestore | `@supabase/supabase-js` | Project decision (April 2026) | All data patterns use Supabase query builder |

**Deprecated/outdated:**
- `expo-router v3`: Targets SDK 50. Use v4 for SDK 52.
- `@react-navigation/bottom-tabs v6`: Replaced by v7 as peer dep of expo-router v4. No breaking API changes for basic tab config.
- Local `supabase functions serve`: Blocked by Docker requirement on this machine. Use deploy workflow.

---

## Open Questions

1. **Zustand hydration timing with RTL guard**
   - What we know: `useSettingsStore.rtlInitialized` is persisted in AsyncStorage; AsyncStorage reads are async
   - What's unclear: Does the RTL guard component re-render after hydration completes, or does it read `false` before hydration and trigger an unwanted reload?
   - Recommendation: Add `onFinishHydration` callback or use `useSettingsStore.persist.hasHydrated()` check before reading `rtlInitialized`; plan task should explicitly handle this

2. **Expo Go SDK 52 vs SDK 55 targeting**
   - What we know: Expo Go supports SDK 52 through 55. npm `latest` tag for `expo` is 55.0.12. npm `sdk-52` tag is 52.0.49.
   - What's unclear: Should the project target SDK 52 (most stable, widest device support) or SDK 55 (newest features)?
   - Recommendation: Target SDK 52 for Phase 1 — more battle-tested, all required packages have stable SDK 52 versions. Upgrade to SDK 55 in Phase 6 if needed.

3. **Supabase project pre-creation blocker**
   - What we know: STATE.md documents this as a known blocker: "Supabase project must be created and .env vars set before plan 01-01 can complete"
   - What's unclear: Has the developer already created the Supabase project?
   - Recommendation: Plan 01-01 must include explicit human step: "Create Supabase project at supabase.com, copy URL and anon key to .env"

---

## Sources

### Primary (HIGH confidence)
- Project skills files (`.planning/skills/`) — RTL patterns, Zustand patterns, RLS patterns, Edge Function template
- CLAUDE.md — stack decisions, patterns, critical constraints
- `expo.dev/go` (fetched live) — confirms Expo Go supports SDK 52–55
- Supabase functions quickstart docs (fetched live) — confirms deploy without Docker works via API fallback
- `npm view` commands (run live) — all package versions verified against npm registry

### Secondary (MEDIUM confidence)
- WebFetch: expo-router v4 Tabs docs — tabBarLabel API confirmed
- WebFetch: Expo issue #32976 — I18nManager.isRTL returns false in Expo Go; PR #37088 merged but behavior still platform-dependent
- WebFetch: Expo issue #35394 — RTL iOS requires cold start; confirmed still an issue in SDK 52–54
- WebSearch: zustand v5 persist + AsyncStorage patterns — API unchanged, createJSONStorage pattern valid

### Tertiary (LOW confidence)
- WebSearch: Supabase functions serve Docker requirement — confirmed by multiple sources but official docs wording is "falls back to API-based deploy"

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified live against npm registry and expo.dev/go
- Architecture: HIGH — patterns come directly from project skill files and CLAUDE.md
- SQL schema: HIGH — derived directly from CLAUDE.md schema summary + RLS skill file
- RTL pitfalls: HIGH — verified against live Expo GitHub issues; known limitations documented
- Edge Function workflow: MEDIUM — Docker absence verified; deploy-without-Docker confirmed by docs fetch but not tested on this machine

**Research date:** 2026-04-08
**Valid until:** 2026-07-08 (Expo SDK versions change quarterly; re-verify if Expo SDK 53+ adoption increases)
