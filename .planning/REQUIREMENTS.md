# Requirements: Gash

**Defined:** 2026-04-07
**Core Value:** The AI coach that learns your patterns and tells you exactly what works for *you* — not generic advice.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign up with phone number (Israeli format, +972) and receive OTP via SMS (Supabase + Twilio)
- [ ] **AUTH-02**: User can verify OTP and complete account creation
- [ ] **AUTH-03**: User session persists across app restarts (Supabase JWT in expo-secure-store)
- [ ] **AUTH-04**: User can sign out

### Chat — AI Coach

- [ ] **CHAT-01**: User can send a Hebrew text message to the AI coach
- [ ] **CHAT-02**: AI responds in Hebrew using the Gash persona (claude-haiku-4-5-20251001 via Supabase Edge Function)
- [ ] **CHAT-03**: Chat history is persisted in Supabase (`chat_messages` table) and loaded on screen open
- [ ] **CHAT-04**: User can copy any AI response to clipboard
- [ ] **CHAT-05**: Conversation includes the last N messages as context window (sliding window, no vector DB)
- [ ] **CHAT-06**: AI coach has a Hebrew-language system prompt with Israeli cultural context

### Approach Tracker

- [ ] **TRCK-01**: User can open a quick log form (bottom sheet) via FAB button
- [ ] **TRCK-02**: Log form includes all 8 fields: date, location, approach type, opener, her response, chemistry score (1-10 slider), follow-up type, notes
- [ ] **TRCK-03**: Log form submits in under 60 seconds (dropdowns/presets for common values)
- [ ] **TRCK-04**: Approach entry is saved to Firestore on submit
- [ ] **TRCK-05**: User sees a brief AI feedback message after saving (e.g., "גישה ישירה — יפה!")
- [ ] **TRCK-06**: User can edit an existing approach entry
- [ ] **TRCK-07**: User can delete an approach entry

### Journal / History

- [ ] **JRNL-01**: User can view all approach entries in a list, sorted by date (newest first)
- [ ] **JRNL-02**: Each list item shows: date, location, chemistry score (large), approach type, and follow-up result
- [ ] **JRNL-03**: User can filter entries by approach type (direct / situational / humor / online)
- [ ] **JRNL-04**: User can filter entries by date range
- [ ] **JRNL-05**: User can search entries by location name
- [ ] **JRNL-06**: User can tap an entry to view full details

### Dashboard / Analytics

- [ ] **DASH-01**: Dashboard displays 4 key metrics: total approaches, success rate (%), average chemistry score, top approach type
- [ ] **DASH-02**: Line graph shows chemistry score trend over time (last 30 entries)
- [ ] **DASH-03**: Bar chart shows success rate by approach type (4 bars)
- [ ] **DASH-04**: AI insight strings are generated from user data (e.g., "גישות ישירות עובדות הכי טוב בשבילך")
- [ ] **DASH-05**: Metrics update in real-time when new approaches are logged

### Tips & Missions

- [ ] **TIPS-01**: Tips library displays static tips organized by category (approach, conversation, confidence)
- [ ] **TIPS-02**: User can search tips by keyword
- [ ] **TIPS-03**: Current weekly mission is displayed prominently
- [ ] **TIPS-04**: User can mark current weekly mission as complete
- [ ] **TIPS-05**: Streak counter shows consecutive days with at least one logged approach
- [ ] **TIPS-06**: Streak is displayed on home/tab bar

### App Foundation

- [ ] **FNDN-01**: App uses forced RTL (Hebrew right-to-left) throughout all screens
- [ ] **FNDN-02**: App runs in Expo Go on iOS and Android (no EAS dev build required for development)
- [ ] **FNDN-03**: Tab navigation with 5 tabs: Coach, Log, Journal, Dashboard, Tips
- [ ] **FNDN-04**: All text, labels, and UI copy is in Hebrew

---

## v2 Requirements

### AI Memory & Personalization

- **PERS-01**: Conversation history is stored as vector embeddings for long-term memory
- **PERS-02**: AI coach recalls specific past interactions ("כשניסית גישה ישירה ב-3/3...")
- **PERS-03**: AI generates personalized weekly missions based on user's weakest areas
- **PERS-04**: AI-generated weekly insights report

### Screenshot Analysis

- **SCRN-01**: User can upload a screenshot of a WhatsApp/Instagram conversation
- **SCRN-02**: AI analyzes the conversation and identifies tone, intent, and recommendations
- **SCRN-03**: Uses claude-sonnet-4-6 for vision requests

### Push Notifications

- **NOTF-01**: Daily reminder notification to log approaches
- **NOTF-02**: Weekly mission reminder (Sunday morning)
- **NOTF-03**: Streak at-risk notification (if user hasn't logged in 23 hours)

### Monetization

- **MOTZ-01**: Free users limited to 3 chat messages per day
- **MOTZ-02**: Premium subscription unlocks unlimited chat (49 ILS/month or $4.99/month)
- **MOTZ-03**: In-app purchase: "Profile Power-up" ($2.99) — AI analyzes Instagram profile
- **MOTZ-04**: Usage counter displayed in chat UI for free users

### Advanced Analytics

- **ANLX-01**: Location-based success analysis ("הכי מצליח ב: קפה, רכבת...")
- **ANLX-02**: Time-of-day success patterns
- **ANLX-03**: Analytics export as shareable summary image

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Community forum / leaderboard | Needs moderation, critical mass, and content policy — v3 |
| WhatsApp / Instagram integration | OAuth complexity, platform TOS risk |
| Video coaching calls | Infrastructure cost, scheduling complexity — not core |
| Dark mode | RTL light-mode first; add later |
| Multiple language support | Hebrew-only is the value proposition for this market |
| Desktop / web version | Mobile-first; React Native Web deferred |
| Anonymous stats sharing | Privacy concerns, v3 feature |
| Real-time multiplayer / social features | Not core to solo coaching value |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FNDN-01 | Phase 1 | Pending |
| FNDN-02 | Phase 1 | Pending |
| FNDN-03 | Phase 1 | Pending |
| FNDN-04 | Phase 1 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| CHAT-01 | Phase 2 | Pending |
| CHAT-02 | Phase 2 | Pending |
| CHAT-03 | Phase 2 | Pending |
| CHAT-04 | Phase 2 | Pending |
| CHAT-05 | Phase 2 | Pending |
| CHAT-06 | Phase 2 | Pending |
| TRCK-01 | Phase 3 | Pending |
| TRCK-02 | Phase 3 | Pending |
| TRCK-03 | Phase 3 | Pending |
| TRCK-04 | Phase 3 | Pending |
| TRCK-05 | Phase 3 | Pending |
| TRCK-06 | Phase 3 | Pending |
| TRCK-07 | Phase 3 | Pending |
| JRNL-01 | Phase 3 | Pending |
| JRNL-02 | Phase 3 | Pending |
| JRNL-03 | Phase 3 | Pending |
| JRNL-04 | Phase 3 | Pending |
| JRNL-05 | Phase 3 | Pending |
| JRNL-06 | Phase 3 | Pending |
| DASH-01 | Phase 4 | Pending |
| DASH-02 | Phase 4 | Pending |
| DASH-03 | Phase 4 | Pending |
| DASH-04 | Phase 4 | Pending |
| DASH-05 | Phase 4 | Pending |
| TIPS-01 | Phase 5 | Pending |
| TIPS-02 | Phase 5 | Pending |
| TIPS-03 | Phase 5 | Pending |
| TIPS-04 | Phase 5 | Pending |
| TIPS-05 | Phase 5 | Pending |
| TIPS-06 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-07*
*Last updated: 2026-04-07 — Stack updated: Firebase → Supabase; FNDN-02 updated (Expo Go, no EAS dev build); AUTH/CHAT updated to Supabase*
