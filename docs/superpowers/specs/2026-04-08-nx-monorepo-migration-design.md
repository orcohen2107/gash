# Design: Nx Monorepo Migration — Gash (גש)

**Date:** 2026-04-08  
**Status:** Approved  
**Author:** Design session with user

---

## Problem

The current architecture calls Claude API through Supabase Edge Functions (Deno). This creates friction:
- Deno is a different runtime/language from the rest of the TypeScript codebase
- Edge Functions are hard to debug and test locally
- All AI agent logic is isolated from the shared codebase
- No type-safety between mobile client and server
- No shared validation — Zod schemas duplicated or absent on the server side

## Goal

Migrate to an Nx monorepo with a Next.js server on Vercel as the single API layer. The mobile app calls the Next.js server for all data and AI operations. Supabase remains for database, auth, and realtime — but Edge Functions are removed.

---

## Architecture

### Monorepo Structure

```
gash/                          ← Nx workspace root (single package.json)
├── apps/
│   ├── mobile/                ← Expo app (current code, moved here)
│   │   ├── app/               ← Expo Router pages
│   │   ├── components/
│   │   ├── stores/
│   │   ├── lib/supabase.ts    ← Auth only — no data calls
│   │   ├── app.json
│   │   └── tsconfig.json
│   └── server/                ← Next.js (deployed to Vercel)
│       ├── app/
│       │   └── api/
│       │       ├── coach/route.ts
│       │       ├── coach/onboarding/route.ts
│       │       ├── coach/reply/route.ts
│       │       ├── coach/opener/route.ts
│       │       ├── approaches/route.ts
│       │       └── insights/route.ts
│       ├── lib/
│       │   ├── auth.ts          ← JWT verification via Supabase service role
│       │   ├── supabase.ts      ← Supabase admin client (service role key)
│       │   ├── claude.ts        ← Anthropic SDK wrapper
│       │   └── agents/
│       │       ├── router.ts    ← Intent detection → agent selection
│       │       ├── coach.ts
│       │       ├── onboarding.ts
│       │       ├── reply-coach.ts
│       │       ├── situation-opener.ts
│       │       ├── approach-feedback.ts
│       │       ├── debrief.ts
│       │       ├── boost.ts
│       │       └── insights.ts
│       └── tsconfig.json
├── libs/
│   ├── types/                 ← TypeScript interfaces (Approach, ChatMessage, etc.)
│   ├── schemas/               ← Zod schemas + validation (shared mobile ↔ server)
│   ├── constants/             ← Hebrew strings, tips data, missions, enums
│   └── api-client/            ← Typed HTTP client for mobile → server calls
├── nx.json
└── package.json
```

---

## Data Flow

### Auth (direct to Supabase — unchanged)

```
Mobile → supabase.auth.signInWithOtp({ phone }) → Supabase → Twilio → SMS
Mobile → supabase.auth.verifyOtp({ phone, token }) → JWT
JWT stored in expo-secure-store
```

Supabase anon key remains in the mobile app (it is designed to be public).  
Token refresh is handled automatically by the Supabase mobile SDK.

### All Data + AI (through Next.js server)

```
Mobile (api-client) ──JWT──▶ Next.js API Route ──▶ Supabase DB (service role)
                                                 └──▶ Claude API (Anthropic SDK)
```

Every API route starts with:
```ts
const { data: { user } } = await supabase.auth.getUser(bearerToken)
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

### Supabase Role Split

| Operation | Client (mobile) | Server (Next.js) |
|-----------|----------------|-----------------|
| Phone OTP auth | ✅ anon key | — |
| Token refresh | ✅ auto (SDK) | — |
| Realtime subscriptions | ✅ anon key + JWT | — |
| Database reads/writes | ❌ | ✅ service role |
| RLS enforcement | — | ✅ (via user JWT passed to Supabase) |

---

## API Routes (Next.js server)

| Route | Method | Agent | Description |
|-------|--------|-------|-------------|
| `/api/coach` | POST | `coach` / `boost` / `debrief` | Main chat message |
| `/api/coach/onboarding` | POST | `onboarding` | First-time 4-step flow |
| `/api/coach/reply` | POST | `reply-coach` (sonnet) | Text message analysis |
| `/api/coach/opener` | POST | `situation-opener` | Location-based openers |
| `/api/approaches` | GET | — | Approach history + filters |
| `/api/approaches` | POST | `approach-feedback` | Save approach + AI feedback |
| `/api/approaches/:id` | PUT | — | Edit approach |
| `/api/approaches/:id` | DELETE | — | Delete approach |
| `/api/insights` | GET | `insights` | Dashboard AI insights |

---

## libs Detail

### `libs/types`
All TypeScript interfaces currently in `types/index.ts`:
- `Approach`, `ChatMessage`, `UserInsights`, `WeeklyMission`
- Request/response types for each API route
- Imported as `@gash/types` in both mobile and server

### `libs/schemas`
Zod schemas for all data structures:
- `ApproachSchema` — used in mobile form (react-hook-form) AND server validation
- `ChatMessageSchema`, `UserInsightsSchema`
- Request body schemas for each API route
- Imported as `@gash/schemas`

### `libs/constants`
- `TIPS` — Hebrew tips data (currently `constants/tips.ts`)
- `MISSIONS` — weekly missions rotation (currently `constants/missions.ts`)
- `APPROACH_TYPES`, `FOLLOW_UP_TYPES` — enum values (keep in sync with DB enums)
- Hebrew UI strings
- Imported as `@gash/constants`

### `libs/api-client`
Typed HTTP wrapper — mobile uses this instead of raw fetch:
```ts
import { gashClient } from '@gash/api-client'

// All calls are typed end-to-end
const reply = await gashClient.coach.send({ message: 'מה להגיד לה?' })
const approaches = await gashClient.approaches.list({ type: 'direct' })
await gashClient.approaches.create({ ... })
```

Client reads JWT from Supabase session and attaches it automatically.

---

## AI Agents (server/lib/agents/)

The agent routing pattern from `.planning/skills/agent-routing-pattern.md` moves to TypeScript:

```ts
// router.ts — intent detection before Claude
async function routeMessage(message: string, context: UserContext): Promise<AgentType> {
  if (detectBoostIntent(message)) return 'boost'
  if (detectDebriefIntent(message, context)) return 'debrief'
  return 'coach'
}
```

All prompts from `.planning/agents-prompts.md` become TypeScript functions:
```ts
// agents/coach.ts
export function buildCoachSystemPrompt(profile: UserProfile): string { ... }
```

JSON agents use prefill pattern from `.planning/skills/json-agent-pattern.md`.

---

## What Supabase Still Does

| Feature | Status |
|---------|--------|
| PostgreSQL database | ✅ Unchanged |
| Phone OTP Auth (Twilio) | ✅ Unchanged |
| Row Level Security (RLS) | ✅ Unchanged |
| Realtime subscriptions | ✅ Unchanged (Phase 4) |
| Edge Functions (`ask-coach`) | ❌ Deleted — replaced by Next.js |

---

## Migration Plan (GSD Phases)

### Phase X: Nx Monorepo Migration

**X-01: Nx workspace init + apps/mobile**
- Initialize Nx workspace at repo root
- Move existing Expo code to `apps/mobile/`
- Verify Expo Go still works after move
- Update all import paths

**X-02: libs scaffold**
- `libs/types` — migrate from `types/index.ts`
- `libs/schemas` — create Zod schemas
- `libs/constants` — migrate tips.ts, missions.ts, enums
- Configure Nx path aliases (`@gash/types`, `@gash/schemas`, etc.)

**X-03: apps/server — Next.js + agents**
- Create Next.js app at `apps/server/`
- Port all agent prompts from `agents-prompts.md` to TypeScript
- Implement agent router (intent detection)
- Implement all API routes
- Wire Supabase service role client + Anthropic SDK
- Local test: all routes return correct responses

**X-04: libs/api-client + mobile wiring**
- Build typed `@gash/api-client`
- Update all Zustand stores to use api-client instead of direct Supabase calls
- Auth store remains on Supabase direct
- End-to-end test: mobile → server → Claude → response

**X-05: Cleanup + Vercel deploy**
- Delete `supabase/functions/` (Edge Functions)
- Deploy Next.js server to Vercel
- Set env vars: `SUPABASE_SERVICE_ROLE_KEY`, `CLAUDE_API_KEY`, `SUPABASE_URL`
- Update mobile `.env`: add `EXPO_PUBLIC_SERVER_URL` pointing to Vercel
- Smoke test full flow on production

---

## Environment Variables

### Mobile (`apps/mobile/.env`)
```
EXPO_PUBLIC_SUPABASE_URL=...       # for auth only
EXPO_PUBLIC_SUPABASE_ANON_KEY=...  # for auth only
EXPO_PUBLIC_SERVER_URL=https://gash.vercel.app  # all data/AI calls
```

### Server (`apps/server/.env`)
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...   # never exposed to client
CLAUDE_API_KEY=...              # never exposed to client
```

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Nx over plain workspaces | Task caching, project graph, first-class monorepo support |
| Next.js over Express/Hono | Vercel deploy, file-based routing, TypeScript native, familiar |
| Auth direct to Supabase | SDK handles token refresh; anon key is public by design |
| Service role in server only | Keeps privileged key off client; server validates JWT per request |
| Delete Edge Functions | Deno friction eliminated; single TypeScript codebase |
| Structured libs (B) over flat | Clear boundaries, type-safe API client, schemas shared end-to-end |

---

## Success Criteria

1. `npx nx run mobile:start` launches Expo Go — identical to today
2. `npx nx run server:dev` starts Next.js locally
3. Mobile chat sends message → Next.js → Claude → Hebrew response displayed
4. All Zustand stores read/write data through api-client (no direct Supabase data calls)
5. `supabase/functions/` directory deleted
6. Server deployed to Vercel, mobile pointing to production URL
7. Existing Phase 2–6 plans updated to reflect new server architecture
