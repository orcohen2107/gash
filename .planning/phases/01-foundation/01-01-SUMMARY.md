---
phase: 01-foundation
plan: 01
subsystem: database
tags: [supabase, postgresql, rls, migrations, expo, react-native]

# Dependency graph
requires: []
provides:
  - Supabase hosted project with 4 tables: users, approaches, chat_messages, user_insights
  - RLS policies on all 4 tables (auth.uid() = user_id)
  - Enums: approach_type, follow_up_type
  - DB indexes for journal and chat history queries
  - .env wired with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
  - .env.example template for collaborators
  - .gitignore excluding credentials and build artifacts
affects:
  - 01-02 (Expo project scaffold — needs .env for Supabase client init)
  - 01-03 (lib/supabase.ts — reads from .env)
  - Phase 2 auth (writes to users table)
  - Phase 3 tracker (writes to approaches table)
  - Phase 4 journal + dashboard (reads approaches, user_insights)
  - Phase 5 Edge Function (reads/writes chat_messages, approaches, user_insights)

# Tech tracking
tech-stack:
  added:
    - supabase CLI (npx supabase@2.87.2)
  patterns:
    - All tables scoped by auth.uid() via RLS — no manual user_id filtering in app code
    - Supabase migration files in supabase/migrations/ with timestamp prefix
    - EXPO_PUBLIC_ prefix for client-accessible env vars in Expo

key-files:
  created:
    - supabase/migrations/20260408000000_init.sql
    - supabase/config.toml
    - .env.example
    - .gitignore
  modified:
    - .env (credentials added by user in Task 1)

key-decisions:
  - "Migration SQL committed to repo — schema is version-controlled and repeatable"
  - "RLS replaces manual user_id WHERE clauses — all queries automatically scoped"
  - ".env excluded from git via .gitignore — credentials never committed"
  - "approach_type and follow_up_type as PostgreSQL enums — enforces valid values at DB level"
  - "onboarding_data added to user_insights as jsonb — accommodates multi-turn onboarding agent output"

patterns-established:
  - "RLS pattern: every table has auth.uid() = user_id policy — no app-level user filtering needed"
  - "Migration naming: YYYYMMDDHHMMSS_description.sql timestamp prefix for ordering"
  - "Env pattern: EXPO_PUBLIC_ prefix for Supabase client vars, non-prefixed for server-side only"

requirements-completed:
  - FNDN-01
  - FNDN-02

# Metrics
duration: 2min
completed: 2026-04-08
---

# Phase 01 Plan 01: Supabase Schema Setup Summary

**PostgreSQL schema with 4 tables (users, approaches, chat_messages, user_insights), RLS enabled on all tables with auth.uid() policies, and .env wired to live Supabase project bqwdfhvhyiqfxmxzhoph**

## Performance

- **Duration:** ~2 min (continuation from human-action checkpoint)
- **Started:** 2026-04-08T01:10:40Z
- **Completed:** 2026-04-08T01:12:39Z
- **Tasks:** 2 total (Task 1 was human-action checkpoint, Task 2 was auto)
- **Files modified:** 4 created

## Accomplishments

- Full database schema in `supabase/migrations/20260408000000_init.sql` — 4 tables, 2 enums, 4 RLS enables, 12 policies, 2 indexes
- .env correctly wired to hosted Supabase project (bqwdfhvhyiqfxmxzhoph.supabase.co)
- .env.example and .gitignore created — credentials safe from accidental commit
- Supabase CLI initialized (`supabase/config.toml`) and migration SQL ready to push

## Task Commits

1. **Task 1: Create Supabase project** — human-action checkpoint (no commit — user action)
2. **Task 2: Create .env and schema migration** — `273aa44` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `supabase/migrations/20260408000000_init.sql` — Full schema: 4 tables + 2 enums + RLS policies + indexes
- `supabase/config.toml` — Supabase CLI project config (created by `npx supabase init`)
- `.env.example` — Credential template with empty values for collaborators
- `.gitignore` — Excludes .env, node_modules, Expo artifacts, Supabase temp files

## Decisions Made

- RLS policies replace manual `WHERE user_id = auth.uid()` in every query — simpler, safer, enforced at DB layer
- `onboarding_data jsonb` added to `user_insights` table — not in original plan spec but needed by Phase 5 multi-turn onboarding agent (mentioned in CLAUDE.md agent table)
- Migration committed to repo — schema is version-controlled and `npx supabase db push` can re-apply it to any new environment

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added .gitignore to exclude credentials from git**
- **Found during:** Task 2 (project scaffold step)
- **Issue:** No .gitignore existed in the repo. .env contains real Supabase credentials (anon key + project URL). Without .gitignore, `git add .` would commit these to the repo.
- **Fix:** Created .gitignore with .env, node_modules, Expo artifacts, Supabase temp dirs excluded
- **Files modified:** .gitignore (created)
- **Verification:** `git status` shows .env as untracked (not staged) after .gitignore was created
- **Committed in:** 273aa44 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical security)
**Impact on plan:** .gitignore is a security prerequisite for any project with credentials. No scope creep.

## Issues Encountered

**Supabase CLI `npx supabase link` requires a personal access token**, not the anon key. The CLI could not authenticate automatically in this non-TTY environment. Resolution options:

1. **Recommended — CLI push:** Run in terminal:
   ```bash
   npx supabase login
   npx supabase link --project-ref bqwdfhvhyiqfxmxzhoph
   npx supabase db push
   ```

2. **Fallback — Dashboard SQL Editor:** Copy the contents of `supabase/migrations/20260408000000_init.sql` and paste it into: Supabase Dashboard → SQL Editor → Run

Both options apply the identical SQL. The migration file is committed and ready.

## User Setup Required

To complete the schema deployment, run one of the options above (CLI or Dashboard SQL Editor). The migration SQL is at `supabase/migrations/20260408000000_init.sql`.

**Verify in Dashboard after running:** Table Editor should show: users, approaches, chat_messages, user_insights — all with RLS enabled.

## Next Phase Readiness

- .env credentials available for Expo project scaffold (Plan 01-02)
- Schema ready for lib/supabase.ts client initialization (Plan 01-03)
- **Blocker resolved:** Supabase project created and credentials in .env — Phase 1 can proceed
- **Remaining manual step:** Push migration SQL to the hosted project (see User Setup Required above)

---
*Phase: 01-foundation*
*Completed: 2026-04-08*
