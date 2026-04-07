# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-07)

**Core value:** The AI coach that learns your patterns and tells you exactly what works for you — not generic advice.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 6 (Foundation)
Plan: 0 of 5 in current phase
Status: Ready to plan
Last activity: 2026-04-07 — Roadmap created, STATE.md initialized

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Stack: Firebase → Supabase (PostgreSQL + Auth + Edge Functions) — Expo Go compatible, no EAS dev build required
- Stack: No separate Node.js server — Supabase Edge Functions handle Claude API calls (keeps API key server-side)
- Auth: Supabase Auth phone OTP via Twilio — configured in Supabase Dashboard, not in code
- Auth: Phone OTP in Phase 2 alongside chat — both share Supabase client setup from Phase 1
- Model ID locked to `claude-haiku-4-5-20251001` — no `claude-3-5-*` references permitted anywhere in codebase
- No streaming from Edge Function to React Native — use full response + client-side typewriter animation

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 1: Supabase project must be created and `.env` vars set before plan 01-01 can complete. Create Supabase project at supabase.com before starting Phase 1.
- Phase 2: Twilio must be configured in Supabase Dashboard (Auth → Phone) before phone OTP works. Supabase free tier does not include SMS — requires Twilio account with Israeli number support.

## Session Continuity

Last session: 2026-04-07
Stopped at: Stack updated — Firebase → Supabase. All planning docs updated. Ready for Phase 1.
Resume file: None
