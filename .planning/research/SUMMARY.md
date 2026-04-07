# Research Summary — Gash

**Synthesized:** 2026-04-07
**Sources:** expo-mobile.md, firebase-backend.md, claude-api.md, mobile-ux.md
**Overall Confidence:** HIGH (all 4 files rated HIGH or MEDIUM-HIGH with official sources)

---

## Executive Summary

Gash is a Hebrew-only AI dating coach mobile app where everything non-trivial touches three hard constraints simultaneously: RTL layout, native mobile SDKs (not web), and a backend-proxied AI API. The research confirms the original stack direction (Expo + Firebase + Claude) is correct, but several specific implementation choices in the PRD must be updated — model names are outdated, `expo-firebase-recaptcha` is deprecated, and native streaming from Firebase to React Native is not yet available. The dominant architectural insight is that the Claude API cannot be called directly from React Native; all AI calls must route through Firebase Cloud Functions, which also means no real SSE streaming for MVP.

The biggest risk is RTL. Hebrew layout correctness requires a development build (not Expo Go), physical device testing, explicit `textAlign: 'right'` on every text element, manual icon flipping, and careful selection of third-party libraries. RTL is not a feature that can be added at the end — it must be baked in from the first line of UI code. The second biggest risk is cold-start latency for the AI chat, which is mitigated by using `claude-haiku-4-5-20251001` (fastest model), deploying functions to `europe-west1` (closest Firebase region to Israel), and keeping context windows tight (15-20 messages max for MVP).

Firebase is validated as the right backend choice for this mobile-first, phone-OTP, real-time, simple-schema app. The cost model is extremely favorable — Firestore costs are negligible until 1,000+ DAUs; the real cost driver is the Claude API, which runs ~$0.30/user/month on the free tier and is profitable at premium pricing above ~43 messages/day.

---

## Critical Findings

These change decisions and must be addressed before writing any code.

### 1. Expo Go is completely unusable for this app
Three separate features require a development build (not Expo Go):
- `@react-native-firebase/auth` phone OTP
- `expo-notifications` push notifications
- `expo-local-authentication` FaceID/TouchID

**Decision:** Build a development client in Phase 1, day 1. Never develop against Expo Go for Gash.

### 2. PRD model names are outdated — update immediately
- `claude-3-5-haiku` → use `claude-haiku-4-5-20251001`
- `claude-3-5-sonnet` → use `claude-sonnet-4-6`
- `claude-3-haiku-20240307` is **deprecated, retires April 19, 2026** — hard cutoff

### 3. `expo-firebase-recaptcha` is deprecated and removed
Removed in Expo SDK 48. The correct phone auth path is `@react-native-firebase/auth` with a custom dev build. No workaround exists in Expo Go.

### 4. No native streaming from Firebase to React Native (April 2026)
Firebase's mobile client SDKs (Swift, Kotlin, Dart, and by extension React Native) do not yet support streaming from Cloud Functions. Firebase's own blog post (March 2025) confirms this is in progress but not available. **MVP must use full-response (non-streaming) calls.** A client-side typewriter animation can simulate the UX.

### 5. Claude SDK does not support React Native runtime
The `@anthropic-ai/sdk` TypeScript package explicitly does not support React Native. All Claude API calls must go through a backend. Architecture is: `React Native → Firebase Cloud Function (Node.js) → Claude API`. There is no shortcut.

### 6. System prompt must be written in Hebrew, not English
An English system prompt with "respond in Hebrew" instructions is less reliable than a Hebrew system prompt that demonstrates the target register. This is the single highest-impact change for consistent Hebrew output quality.

### 7. RTL requires a physical device + production build to verify
RTL rendering in Expo Go and iOS Simulator is unreliable. Some RTL bugs only surface on a real device with a standalone build. All RTL layout work must be validated on a physical device.

---

## Tech Stack Confirmed

| Layer | Library / Service | Version / Notes |
|-------|-------------------|-----------------|
| Framework | Expo (managed workflow) | SDK 52+ (required for iOS RTL fix) |
| Navigation | Expo Router v3 | File-based, auto deep linking |
| State management | Zustand + `persist` middleware | Per-domain stores |
| State persistence | `@react-native-async-storage/async-storage` | Standard state; use `expo-secure-store` for tokens |
| State persistence (perf) | `react-native-mmkv` | Swap in for high-frequency writes (streaming simulation) |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` | Controller pattern for RN inputs |
| Charts | `react-native-gifted-charts` | Line, bar, pie; RTL Y-axis via `yAxisSide='right'` |
| Slider | `@react-native-community/slider` v5 | Native UISlider/SeekBar, RTL-fixed in v5 |
| Bottom sheet | `@gorhom/bottom-sheet` v5 | Reanimated v3 + Gesture Handler v2 required |
| Chat UI | Custom FlatList (100-150 lines) | Skip react-native-gifted-chat; RTL + bundle reasons |
| Auth | `@react-native-firebase/auth` | Phone OTP; dev build required |
| Database | `@react-native-firebase/firestore` | Native SDK (not JS SDK) — offline persistence |
| Backend functions | Firebase Cloud Functions v2 (`firebase-functions/v2`) | `europe-west1` region |
| AI model (text) | `claude-haiku-4-5-20251001` | MVP text chat |
| AI model (vision, v2) | `claude-sonnet-4-6` | Screenshot analysis only |
| Notifications | `expo-notifications` | Dev build required |
| Biometrics | `expo-local-authentication` | Dev build required |
| Build | EAS Build (managed credentials) | Let EAS handle iOS certs |
| Animations | Lottie (`lottie-react-native`) | Mission completion celebrations |

---

## Architecture Decisions

### Cloud Function proxy is mandatory
`React Native → onCall Cloud Function → Claude API`. No direct SDK calls. Functions deployed to `europe-west1`. Use `firebase-functions/v2` (not v1). Store Claude API key in Firebase Secrets Manager via `defineSecret('CLAUDE_API_KEY')`.

### Callable functions over HTTP triggers
`onCall` auto-forwards auth tokens (`request.auth.uid` available without header setup), requires no CORS config, and integrates with App Check. All Gash client-facing functions use `onCall`. Reserve `onRequest` for webhooks only.

### Firestore schema: subcollections per user
```
/users/{userId}               ← profile, settings, totalApproaches (denormalized)
  /approaches/{approachId}    ← approach logs
  /chatMessages/{messageId}   ← immutable (no update/delete in security rules)
  /insights/{insightId}       ← written only by Cloud Functions (Admin SDK)
```

### Offline writes: fire-and-forget (no await)
The native `@react-native-firebase/firestore` SDK enables offline persistence by default. Approach logging must use fire-and-forget writes (no `await`) so the UI feels instant on poor Israeli mobile connections. Do not use `await` on Firestore writes in the UI flow.

### RTL: hardcoded at boot, never dynamic
Call `I18nManager.forceRTL(true)` + `I18nManager.allowRTL(true)` in `_layout.tsx` before any render. Store a one-time flag in `useSettingsStore` (persisted via AsyncStorage) to prevent repeated `Updates.reloadAsync()` calls. The app is Hebrew-only; dynamic locale switching is not a requirement and adds complexity.

### Conversation memory: sliding window, no vector DB
Keep the last 15-20 messages in the messages array. The 200k token context window on Haiku 4.5 is far larger than needed for MVP sessions. Cross-session memory (v2): store a `coachingSummary` string per user in Firestore, injected at session start (~200 tokens, no vector search needed).

### Freemium rate limiting: Firestore counter, not API rate limits
Enforce the 3 free messages/day limit inside the Cloud Function, before calling Claude, using a `dailyMessageCount.{date}` field on the user document. Anthropic's API rate limits won't be the bottleneck. When the limit is hit, throw `HttpsError('resource-exhausted')` and show an upgrade prompt in the app.

### Tab structure: 5 tabs, center as FAB
```
RTL visual order (right to left): [יומן] [לוח] [+] [שליחויות] [צ'אט]
```
The center `+` tab triggers the bottom sheet log form (not a navigation destination). Tab array index 0 renders on the far right in RTL mode — plan array order accordingly.

---

## Phase 1 Blockers

These must be set up before any feature work is possible.

1. **EAS development build** — run `eas build --profile development` for both platforms. Without this, phone auth, push notifications, and FaceID are all broken. This is the single most critical Phase 1 task.

2. **Firebase project + `@react-native-firebase` wiring** — `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) must be in the project root. Android SHA-1 and SHA-256 fingerprints must be registered in Firebase Console or phone auth throws `missing-client-identifier`.

3. **RTL initialization in `_layout.tsx`** — `I18nManager.forceRTL(true)` must be in the root layout before anything renders. This cannot be added later without auditing the entire stylesheet.

4. **Zustand store structure** — define all stores (`useAuthStore`, `useChatStore`, `useLogStore`, `useStatsStore`, `useSettingsStore`) with persistence setup before any screen is built.

5. **Cloud Functions v2 scaffold + `europe-west1` region** — the `askCoach` callable function must exist before any chat UI is built. Test with a hardcoded response first to verify the RN → Cloud Function pipeline works.

6. **Update model IDs** — remove all references to `claude-3-5-haiku`, `claude-3-5-sonnet`, `claude-3-haiku-20240307` from the codebase. Use `claude-haiku-4-5-20251001` for MVP.

7. **Test phone numbers in Firebase Console** — add `+972 555 000001` → `123456` (and variants) to Authentication > Phone > Test phone numbers. Required to develop auth without SMS costs and reCAPTCHA friction.

8. **Firestore indexes pre-created** — add `firestore.indexes.json` with composite indexes for `(type, date)`, `(response, date)`, `(followUp, date)` before the Journal filter UI is built. Missing indexes cause silent failures.

---

## Risk Areas

| Risk | Severity | Mitigation |
|------|----------|------------|
| RTL bugs in third-party libraries | HIGH | Test each library with `I18nManager.isRTL = true` before adopting. Known safe: gorhom bottom sheet, community slider v5, gifted-charts (with manual Y-axis). Known risky: any chart library, date pickers, drawers. |
| AI response latency >2s (user perception) | MEDIUM-HIGH | Use Haiku 4.5 (fastest), deploy to `europe-west1`, keep message history tight (15-20 msgs), add pulsing "..." typing indicator immediately on send. |
| iOS reCAPTCHA redirect conflicts with Expo Router | MEDIUM | Handle `appScheme://firebaseuth/link` deep link in root layout. Add test phone numbers to avoid reCAPTCHA in dev entirely. |
| Cold starts on Cloud Functions | MEDIUM | Use min instance = 1 on `askCoach` for production (small cost, eliminates 2-5s cold start on free tier). Cloud Functions v2 supports this. |
| Prompt caching threshold not met | LOW-MEDIUM | System prompt alone (~500 tokens) does not meet Haiku's 4,096 token cache minimum. Expand system prompt with coaching examples + inject user approach history as cached context to cross the threshold. |
| iOS keystore / provisioning expiry | LOW | EAS manages credentials automatically. Keystore is in EAS cloud, not local. Provisioning profiles expire in 12 months — EAS auto-rotates on next build. |
| Hebrew tokenization cost underestimation | LOW | Hebrew costs ~30-50% more tokens than equivalent English content. Recalculate cost projections using 1.4x multiplier on Hebrew text estimates. |

---

## Library Choices — Final Picks

| Use case | Winner | Loser (why not) |
|----------|--------|-----------------|
| Charts | `react-native-gifted-charts` | Victory Native XL (3 heavy deps, no pie chart); react-native-chart-kit (poor perf, dead) |
| Slider | `@react-native-community/slider` v5 | `@miblanchard/react-native-slider` (abandoned, JS-only) |
| Bottom sheet | `@gorhom/bottom-sheet` v5 | Raw `Modal` (no keyboard handling); `react-native-bottom-sheet` alternatives |
| Chat UI | Custom FlatList | `react-native-gifted-chat` (MomentJS, bundle bloat, RTL fragile) |
| State | Zustand | Redux Toolkit (overkill); Context API (re-render perf issues) |
| Forms | react-hook-form + zod | Formik (controlled inputs, re-renders on every keystroke) |
| Auth | `@react-native-firebase/auth` | `expo-firebase-recaptcha` (deprecated, removed SDK 48) |
| Firestore client | `@react-native-firebase/firestore` | Firebase JS SDK (offline persistence broken in RN) |
| AI model | `claude-haiku-4-5-20251001` | `claude-sonnet-4-6` (5-10x cost, overkill for 2-3 sentence responses) |
| Animations | `lottie-react-native` | Custom Animated API (more code, less polish for celebrations) |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack choices | HIGH | All library picks verified against official docs and npm trends |
| Firebase architecture | HIGH | Verified against rnfirebase.io, official Firebase docs |
| Claude API integration | HIGH | Verified against official Anthropic docs, April 2026 |
| Model names and pricing | HIGH | Verified directly against platform.claude.com/docs |
| Hebrew language quality | MEDIUM | No explicit Hebrew benchmark; Arabic proxy (97.1%) is reasonable but real-world slang testing required |
| RTL implementation | HIGH | Verified against RN docs, GitHub issues, Arabic/Hebrew developer community reports |
| Cost projections | MEDIUM | Firestore costs verified; usage estimates are modeled assumptions, not measured data |
| Streaming limitation | HIGH | Firebase's own blog post confirms mobile streaming not available; April 2026 |

**Overall: HIGH confidence on architecture and library decisions. MEDIUM on cost projections and Hebrew language quality (requires real-world testing).**

---

## Gaps to Address During Planning

1. **Notification strategy** — local-only reminders vs push from server. Needs a decision: does the server ever push to users, or is all notification logic on-device? Affects Cloud Functions scope.

2. **Freemium gate location** — does the premium check happen client-side (UI gating) or server-side only (Cloud Function)? Both are needed to prevent UI gaps, but client-side checks must never be the sole enforcement.

3. **User onboarding flow** — phone OTP + profile setup is not described in detail. Does the user set a name, age, goals? This affects the Firestore user doc schema and the coaching system prompt injection.

4. **Analytics/Crashlytics** — not researched. Firebase Analytics and Crashlytics are zero-config with `@react-native-firebase` but need to be explicitly added to `app.json` plugins.

5. **App Store / Google Play submission** — EAS Submit setup, store assets (screenshots, descriptions in Hebrew), and Apple Review guidance for dating-adjacent apps (policy risk) need a dedicated checklist before Phase 4.

---

## Sources (Aggregated)

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [react-native-firebase Auth — rnfirebase.io](https://rnfirebase.io/auth/phone-auth)
- [react-native-firebase Firestore — rnfirebase.io](https://rnfirebase.io/firestore/usage)
- [Firebase Cloud Functions Callable — official docs](https://firebase.google.com/docs/functions/callable)
- [Anthropic Models Overview — April 2026](https://platform.claude.com/docs/en/about-claude/models/overview)
- [Anthropic Multilingual Support](https://platform.claude.com/docs/en/build-with-claude/multilingual-support)
- [Firebase Streaming Blog Post (March 2025)](https://firebase.blog/posts/2025/03/streaming-cloud-functions-genkit/) — mobile SDKs not yet supported
- [Anthropic TypeScript SDK — RN not supported](https://platform.claude.com/docs/en/api/sdks/typescript)
- [Anthropic Prompt Caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [gorhom/bottom-sheet — GitHub](https://github.com/gorhom/react-native-bottom-sheet)
- [@react-native-community/slider — npm](https://www.npmjs.com/package/@react-native-community/slider)
- [react-native-gifted-charts — RTL use case](https://medium.com/@contact8abhishek/react-native-chat-graph-library-arabic-support-rtl-e8504ccf46a7)
- [EAS Build Setup — Expo Docs](https://docs.expo.dev/build/setup/)
- [I18nManager — React Native Docs](https://reactnative.dev/docs/i18nmanager)
- [Firestore Pricing](https://firebase.google.com/docs/firestore/pricing)
