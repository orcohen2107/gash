---
phase: 2
phase_name: Auth & AI Coach
created: 2026-04-08
status: ready_for_research
---

# Phase 2: Auth & AI Coach — Implementation Context

## Phase Goal

Users can sign in with an Israeli phone number, send Hebrew messages to the Gash AI persona, and have their conversation history persist across sessions.

**Requirements:** AUTH-01 through AUTH-04, CHAT-01 through CHAT-06

---

## Locked Decisions

### Message Display & Animation (User Discussion)

**Response Display Flow:** Hybrid approach
- Show **animated thinking bubble** (3 bouncing dots) while Claude API processes
- Once response arrives, display with **typewriter animation**
- Typewriter speed: **40-50ms per character** (natural reading pace, ~200-250 WPM)
- After animation completes, message remains fully visible for copying/interaction
- **Rationale:** Feels responsive (indicator while waiting) + engaging (typewriter creates anticipation) without sacrificing usability

**Thinking Indicator Style:** Typing bubble with bouncing dots
- AI chat bubble with animated 3-dot indicator (like Messenger/WhatsApp)
- Matches Design System (use `primary-container` with glassmorphism blur)
- User sees immediate visual feedback that app is thinking

### Phone Authentication Flow (From CLAUDE.md)

**Phone Input Format:**
- Accept Israeli phone numbers: `+972 50 123 4567` or `050 123 4567` (with/without prefix)
- Validate as 10-digit number (regardless of prefix)
- If user types `050...`, auto-prepend `+972` when sending to Supabase Auth
- Placeholder: `+972 50 123 4567` (shows format)
- No inline validation errors — only show on submit attempt

**OTP Verification:**
- 4-digit or 6-digit OTP depending on Twilio SMS template (defer to Supabase dashboard config)
- Input: 4 separate digit fields OR single input field with auto-advance
- Supabase handles SMS delivery — app only handles UI
- On mismatch: Show error toast "קוד לא נכון. נסה שוב." (Code incorrect. Try again.)
- No auto-fill from SMS (requires user action — cleaner security)

**Session Persistence:**
- JWT token stored in `expo-secure-store` (non-extractable, platform-secure)
- Supabase `onAuthStateChange` listener in root layout auto-restores session
- Auto-refresh on token expiry (Supabase handles this)
- Sign-out clears secure store and redirects to auth

**Error Handling:**
- Invalid phone format: Show error toast "מספר לא חוקי. תן מספר ישראלי." (Invalid number. Provide Israeli number.)
- SMS not received after 2 min: Show "לא קיבלת קוד?" link to resend
- Network errors: Toast "בעיה בחיבור. בדוק את הרשת." (Connection issue. Check network.)
- OTP mismatch: Toast "קוד לא נכון. בדוק שוב." (Incorrect code. Check again.)
- **Use toast notifications** (not inline errors or modals) per Design System

### AI Coach Personality & Tone (From CLAUDE.md)

**Persona:**
- **Name:** Gash (גש) — Hebrew slang for "come on" / "let's go"
- **Tone:** Direct Israeli "wingman" — tells user what works, not generic advice
- **Language:** 100% Hebrew (no English, no Roman characters except when necessary for names/numbers)
- **Response style:** Short, actionable (1-2 sentences per turn), conversational
- **Emojis:** Sparingly — only when culturally appropriate (e.g., "🚀" for confidence boost, "💪" for encouragement)

**System Prompt:**
- Provided by CLAUDE.md — coach must know user's pattern (approach type, chemistry history) for personalization
- Delivered via Supabase Edge Function (ask-coach) — never called client-side
- Claude model: `claude-haiku-4-5-20251001` (Hebrew support, cost-efficient)

**Context Window:**
- Sliding window of **last 15 messages** from `chat_messages` table
- Include both user + AI messages (alternating)
- Ordered chronologically (oldest first, so Claude sees conversation flow)
- If < 15 messages exist, send all available
- Reset on new session (don't include previous day's chat)
- **No vector embeddings / embeddings-based retrieval** — use recency only (v2 feature)

**User Profile in Coach Prompts:**
- **Phase 2 decision:** Keep coach generic for now (no user stats injection)
- Coach persona should work for all users without personalization
- **Phase 4 feature:** Inject `bestApproachType`, `avgChemistry`, `recentPattern` from `user_insights`
- This allows phased rollout: auth + chat first, insights later

### Message Persistence (From CLAUDE.md + Design)

**Data Model:**
- `chat_messages` table: `id`, `user_id`, `role` ('user'|'assistant'), `content`, `created_at`
- All messages written to DB immediately on send (both user + AI responses)
- Query on screen open: `order('created_at', { ascending: true })` (oldest first, for UI rendering newest at bottom)

**Offline Handling:**
- App requires active connection (no offline queuing for MVP)
- Network error during send: Show toast "לא הצלחנו לשלוח. בדוק את הרשת." (Failed to send. Check network.)
- Retry: Manual retry button (not auto-retry)

**Conversation Reset:**
- No reset button on chat screen (conversations persist indefinitely)
- User can manually delete messages? → Defer to Phase 3 journal edit/delete patterns

### Copy-to-Clipboard

**Long-press behavior:**
- Long-press any AI message bubble → show toast "העתק?" (Copy?)
- On confirm: Copy to clipboard, show toast "הועתק!" (Copied!)
- Use `@react-native-clipboard/clipboard` library (lightweight)

---

## Design System Alignment

**Chat UI Components:**
- **User bubbles:** `surface-container-high`, aligned right (RTL)
- **AI bubbles:** `primary-container` (#00e3fd) with glassmorphism (60% opacity, 16px blur)
- **Thinking indicator:** AI bubble with bouncing dots in `primary-container`
- **Input field:** "Slab" style (`surface-container-high` bg, 2px bottom border in `primary` on focus)
- **Send button:** Primary gradient (`#81ecff` → `#00d4ec`), `md` radius (12px)
- **Error toasts:** Bottom sheet or centered toast, use `on-surface` text with brief message

**Typography:**
- Body text: `body-lg` (1rem), `Inter` font, line-height 1.6
- Time labels on messages: `label-md` (0.75rem), `on-surface-variant` (#adaaaa)
- No dividers between messages (24px vertical spacing instead)

---

## What Downstream Agents Should Know

### For gsd-phase-researcher:
- Investigate best practices for: typewriter animations in React Native (Reanimated v3), toast libraries, secure storage with Supabase JWT
- Look into Twilio SMS template options (OTP format, resend flow)
- Research: custom keyboard for digit-only OTP inputs (if 4-digit field approach chosen)

### For gsd-planner:
- Phase 2 scope: **Auth only** (5 plans) + **Chat only** (5 plans) = 10 plans total
- No user context (profile stats) in coach prompts this phase — keep coach generic
- Message persistence is table-based (no caching, all writes to DB)
- Error handling strategy: Toasts for all user-facing errors
- Design System components must match: no 1px borders, use surface shifts
- Tests: Auth flow, JWT persistence, message persistence, Edge Function calls

---

## Canonical References

Downstream agents should consult these docs (in order):

1. **CLAUDE.md** (project rules) — Stack, folder structure, auth flow, Edge Function routing, Claude API config
2. **DESIGN-SYSTEM.md** (visual language) — Colors, typography, components, spacing, Glassmorphism rules
3. **ROADMAP.md** — Phase 2 goal and requirements (AUTH-01 through CHAT-06)
4. **REQUIREMENTS.md** — Detailed acceptance criteria for each requirement
5. **Supabase schema migrations** — `.planning/phases/01-foundation/01-01-SUMMARY.md` for DB structure

---

## Deferred Ideas

(None yet — Phase 2 is focused. If new ideas emerge during planning, they'll be captured here.)

---

## Decision Timeline

- **Message Display:** User discussion → Hybrid + typing bubble + 40-50ms typewriter
- **Phone Auth:** CLAUDE.md locked → Israeli format, OTP, secure storage
- **Coach Persona:** CLAUDE.md locked → Hebrew, direct wingman tone, Haiku model
- **Context Window:** CLAUDE.md locked → Last 15 messages, no embeddings (v2 feature)
- **User Profile:** Deferred to Phase 4 (generic coach for now)

---

## Ready for Research & Planning

This context is complete. Downstream agents can:
1. **gsd-phase-researcher:** Investigate implementation patterns
2. **gsd-planner:** Design detailed tasks without re-asking user questions

Status: ✅ All decisions locked | Ready to `/gsd:plan-phase 2`
