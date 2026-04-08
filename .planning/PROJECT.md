# Gash (גש)

## What This Is

Gash is a personal AI dating coach and approach tracker for Israeli men ages 18-35. It combines real-time Hebrew-language AI coaching via Claude API, a quick interaction logger, data-driven personal insights, and gamified weekly missions — delivered as a cross-platform mobile app (React Native / Expo). The core persona is a direct, culturally-aware Israeli "wingman" who learns each user's individual patterns over time.

## Core Value

The AI coach that learns your patterns and tells you exactly what works for *you* — not generic advice.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Chat interface with Claude API + Hebrew system prompt
- [ ] Quick approach log form (< 1 minute, 8 fields: date, location, type, opener, response, chemistry 1-10, follow-up, notes)
- [ ] Journal/history view with filters (type, date range, success) and location search
- [ ] Dashboard with 4 key metrics (total approaches, success rate, avg chemistry, top approach type) + 3 charts
- [ ] Static Tips & Missions library with weekly mission display and completion tracking
- [ ] Phone + OTP authentication (Supabase Auth + Twilio)
- [ ] iOS + Android via Expo (single codebase)
- [ ] Full RTL (right-to-left) UI in Hebrew
- [ ] AI insight strings generated from user's logged data

### Out of Scope

- Vector embeddings / AI conversation memory — v2, complexity/cost not justified for MVP
- AI-generated personalized missions — v2, requires sufficient data and ML pipeline
- Screenshot analysis (conversation screenshots) — v2, adds vision API cost and complexity
- Community forum / leaderboard — v3, needs moderation and critical mass
- Paid subscription / IAP — post-launch, validate retention first
- WhatsApp/Instagram integration — v3, OAuth complexity and platform risk
- Dark mode — v2, deliver RTL light-mode first

## Context

- Target user: Israeli men 18-35 who want to improve confidence in meeting women face-to-face
- Language: Hebrew throughout, with Israeli cultural awareness baked into AI persona
- No existing apps track real approach interactions with AI feedback; gap in market
- PRD fully specified (see original document): all 5 screens, data model, API endpoints, AI system prompt, monetization model
- Freemium model planned: 3 free chats/day, unlimited tracker; premium 49 ILS/month
- MVP estimate: 6-8 weeks

## Constraints

- **Tech Stack**: React Native (Expo) for iOS + Android — Expo Go compatible, no native SDKs
- **AI**: Claude API (Anthropic) — Hebrew support, persona flexibility, no GPT-4 for MVP
- **Database**: Supabase PostgreSQL — no Firebase, pure HTTP client via `@supabase/supabase-js`
- **Auth**: Supabase Auth phone OTP (Twilio) — Israeli phone numbers, no email/password for v1
- **Claude API**: Called via Supabase Edge Function — API key stays server-side
- **RTL**: All UI components must support right-to-left Hebrew layout
- **Performance**: AI chat responses must be < 2 seconds; optimize for Israeli mobile networks
- **Privacy**: All data encrypted in transit and at rest; user can delete all data on request

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React Native (Expo) over Flutter | Team familiarity, faster MVP, JS/TS ecosystem | — Pending |
| Supabase over Firebase | PostgreSQL > Firestore for queries; pure JS SDK works in Expo Go; no native builds required | ✓ Decided |
| Supabase Edge Functions over Node.js server | No infra to manage; keeps Claude API key server-side; deploys with Supabase CLI | ✗ Reversed in Phase 1.5 |
| Next.js server (Vercel) over Supabase Edge Functions | TypeScript throughout, better DX, full Node.js, easy Vercel deploy, all agents in one place | ✓ Decided (Phase 1.5) |
| Nx monorepo with npm workspaces | Shared libs (types/schemas/constants/api-client) between mobile and server; typed end-to-end; Nx caching | ✓ Decided (Phase 1.5) |
| Auth stays direct to Supabase from mobile | Supabase anon key is public by design; SDK handles token refresh automatically; no proxy needed for OTP | ✓ Decided (Phase 1.5) |
| Claude API over GPT-4 | Superior Hebrew support, matching persona to Anthropic's guidelines | — Pending |
| Phone OTP over email auth | Israeli users prefer SMS, no email verification friction | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-07 — stack updated: Firebase → Supabase, no EAS dev build required*
