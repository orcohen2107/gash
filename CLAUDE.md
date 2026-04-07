# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Gash (גש)** — Hebrew AI dating coach + approach tracker. React Native (Expo) mobile app for Israeli men ages 18-35.

## Stack

- **Mobile**: React Native (Expo) — Expo Go compatible during development, no EAS dev build required
- **Database + Auth**: Supabase (PostgreSQL, Phone OTP via Twilio, Edge Functions)
- **AI**: Claude API via Supabase Edge Function — model `claude-haiku-4-5-20251001` only (never `claude-3-5-*`)
- **State**: Zustand + AsyncStorage persist
- **Navigation**: Expo Router v3 (file-based, `app/(tabs)/`)
- **Language**: TypeScript strict mode throughout

## Critical Constraints

- **Hebrew + RTL everywhere**: `I18nManager.forceRTL(true)` set at boot. Use logical style props (`paddingStart`, `marginEnd`) not directional (`paddingLeft`). All UI copy in Hebrew.
- **No Firebase**: This project uses Supabase. Do not add any Firebase packages or references.
- **No streaming**: Supabase Edge Functions don't support streaming to React Native. Use full response + client-side typewriter animation.
- **Claude API key**: Never in client code. Always called via Supabase Edge Function (`supabase/functions/ask-coach/`).
- **System prompt in Hebrew**: The Gash AI persona prompt must be written in Hebrew, not English with "respond in Hebrew".

## Architecture

```
app/ (Expo Router)
  (tabs)/
    coach.tsx       ← Chat / AI Coach screen
    log.tsx         ← Quick log form (bottom sheet via FAB)
    journal.tsx     ← Approach history + filters
    dashboard.tsx   ← Analytics + charts
    tips.tsx        ← Tips library + weekly mission
  _layout.tsx       ← RTL boot config here (I18nManager.forceRTL)
  auth/
    index.tsx       ← Phone number input
    verify.tsx      ← OTP verification

stores/             ← Zustand stores (useAuthStore, useChatStore, useLogStore, useStatsStore, useSettingsStore)
lib/
  supabase.ts       ← Supabase client init (@supabase/supabase-js)
supabase/
  functions/
    ask-coach/      ← Deno Edge Function → Claude API
  migrations/       ← SQL schema files
```

## Key Libraries

| Purpose | Library |
|---------|---------|
| Bottom sheet (log form) | `@gorhom/bottom-sheet` v5 |
| Charts | `react-native-gifted-charts` |
| Slider (chemistry score) | `@react-native-community/slider` |
| Forms | `react-hook-form` + `zod` |
| Auth session storage | `expo-secure-store` |

## Database Tables

`users`, `approaches`, `chat_messages`, `user_insights` — all with RLS (row-level security), users can only read/write their own rows.

## Development

```bash
npx expo start          # Start in Expo Go
supabase start          # Local Supabase (Docker)
supabase functions serve # Local Edge Functions
```

## GSD Workflow

Planning docs are in `.planning/`. Run `/gsd:plan-phase N` to plan a phase, `/gsd:execute-phase N` to build it.
Current phase: **Phase 1 — Foundation** (not started).
