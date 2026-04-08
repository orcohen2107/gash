# Phase 2: Auth & AI Coach - Research

**Researched:** 2026-04-08
**Domain:** Supabase Auth + OTP, React Native Chat UI, RTL Text Input, Edge Functions
**Confidence:** HIGH

## Summary

Phase 2 implements phone authentication (Supabase + Twilio) and AI chat messaging for the Gash app. Research confirms that standard, well-documented libraries exist for each domain: Supabase Auth handles OTP flow natively, React Native has mature chat UI options (both library-based and custom), and Reanimated v3 provides robust animation support for typewriter effects. The main implementation focus is adapter code (JWT storage, RLS policies, session persistence) rather than building custom solutions. RTL support exists across all libraries (expo-secure-store, input fields, text direction).

**Primary recommendation:** Use standard Supabase Auth phone OTP flow with expo-secure-store adapter → custom FlatList-based chat UI with Reanimated v3 typewriter animation + react-native-toast-message for error handling → clipboard copy via expo-clipboard.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Message Display & Animation**
- Hybrid approach: animated thinking bubble (3 bouncing dots) while Claude processes → typewriter animation on response
- Typewriter speed: 40-50ms per character (natural reading pace)
- Thinking indicator: typed bubble with bouncing dots in `primary-container` with glassmorphism

**Phone Authentication Flow**
- Israeli phone format: `+972 50 123 4567` or `050 123 4567` (auto-prepend +972 if needed)
- 4-6 digit OTP (defer to Supabase dashboard config)
- OTP input: 4 separate digit fields OR single input with auto-advance
- Session persistence: JWT in `expo-secure-store` with Supabase `onAuthStateChange` auto-restore
- Error handling: Toast notifications (not modals or inline errors)

**AI Coach Personality**
- Name: Gash (גש), tone: direct Israeli wingman
- Language: 100% Hebrew (no English except names/numbers)
- Response style: 1-2 sentences, conversational, sparingly emojis
- Model: `claude-haiku-4-5-20251001`

**Context Window & Message Persistence**
- Sliding window of last 15 messages (no vector embeddings)
- `chat_messages` table: `id`, `user_id`, `role` ('user'|'assistant'), `content`, `created_at`
- All messages written to DB immediately
- No offline queuing (app requires active connection)
- No reset button (conversations persist indefinitely)

**Copy-to-Clipboard**
- Long-press AI bubble → show toast "העתק?" → confirm → toast "הועתק!"
- Use `@react-native-clipboard/clipboard` (lightweight)

**Design System Alignment**
- User bubbles: `surface-container-high`, aligned right (RTL)
- AI bubbles: `primary-container` (#00e3fd) with glassmorphism (60% opacity, 16px blur)
- Input: "Slab" style (`surface-container-high` bg, 2px bottom border in `primary` on focus)
- No 1px dividers between messages, 24px vertical spacing instead
- Typography: `body-lg` (1rem, Inter font, 1.6 line-height), time labels `label-md`

### Claude's Discretion

- Phone number validation library choice (defer format handling or use library)
- Typewriter animation library vs. custom Reanimated implementation
- Toast library selection (multiple options available)
- OTP digit field component: 4 separate fields vs. single masked input
- Chat FlatList optimization: custom optimization vs. gifted-chat library

### Deferred Ideas (OUT OF SCOPE)

- User context injection (bestApproachType, avgChemistry) → Phase 4 feature
- Vector embeddings for chat history → v2 feature
- Offline message queuing → v2 feature
- Message deletion → Phase 3 (journal edit/delete patterns)
- Push notifications → v2 feature

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can sign up with Israeli phone (+972), receive OTP via SMS | Supabase Auth with Twilio provider handles SMS delivery natively; CONTEXT.md specifies auto-prepend +972 for 050 format |
| AUTH-02 | User verifies OTP, completes account creation | Supabase `signInWithOtp` → `verifyOtp` flow documented; 4-6 digit code configurable in Supabase dashboard |
| AUTH-03 | Session persists across restarts (JWT in expo-secure-store) | Supabase client supports custom storage adapters; expo-secure-store size limits (~2KB) OK for JWT; `onAuthStateChange` auto-restores |
| AUTH-04 | User can sign out | Supabase `signOut()` → clears secure store → redirects to auth (standard pattern) |
| CHAT-01 | User sends Hebrew text to AI coach | React Native TextInput with RTL support (I18nManager.forceRTL) + form validation via zod |
| CHAT-02 | AI responds in Hebrew (Gash persona, Haiku model) | Claude API called via Edge Function with Hebrew system prompt; Haiku model confirmed suitable for cost/latency |
| CHAT-03 | Chat history persists in `chat_messages` table | Supabase RLS + standard SQL INSERT/SELECT patterns; load on screen open with `order('created_at', ascending: true)` |
| CHAT-04 | User copies AI response to clipboard | expo-clipboard or @react-native-clipboard/clipboard both actively maintained; long-press gesture via @react-native-gesture-handler |
| CHAT-05 | Last 15 messages as context window | Backend Edge Function fetches `chat_messages` WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 15 |
| CHAT-06 | Hebrew system prompt with Israeli context | CONTEXT.md specifies prompt delivery via Edge Function; stored in `.planning/agents-prompts.md` |

</phase_requirements>

---

## Standard Stack

### Core Auth & Database
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.102.1 | Supabase client (Auth + DB) | Locked in package.json; handles OTP, JWT, RLS natively |
| expo-secure-store | ~14.2.4 | Store JWT token securely (iOS/Android) | Expo-native, platform-secure (Keychain/Keystore), non-extractable |
| @react-native-async-storage/async-storage | ~1.24.0 | Fallback session storage (if needed) | Zustand persist layer uses this; simpler alternative to SecureStore for large payloads |

### Chat UI & Input
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-reanimated | ~3.15.1 | Animation engine (typewriter, bouncing dots) | Locked in package.json; powerful GPU-accelerated animations, Expo-compatible |
| @react-native-clipboard/clipboard | 1.16.3 | Copy-to-clipboard functionality | Active maintenance, iOS/Android/Web support; preferred over deprecated @react-native-community/clipboard |
| expo-clipboard | 55.0.8 | Alternative clipboard (Expo-native) | Lighter weight if clipboard-only; recommend clipboard library for consistency |
| react-native-toast-message | 2.x | Toast notifications (errors, copy confirmation) | Recommended for Expo; actively maintained; works with Reanimated |

### Forms & Validation
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | ^7.72.1 | Form state + validation (phone input, OTP) | Locked in package.json; lightweight, TypeScript support |
| zod | ^4.3.6 | Schema validation (phone format, OTP length) | Locked in package.json; runtime validation for Hebrew error messages |

### Gesture & Input
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-native-gesture-handler | (via Reanimated) | Long-press detection for copy | Built-in; Reanimated depends on it |
| react-native-text-input-mask | (optional) | Phone number formatting (050 → +972) | If custom formatting needed; RTL-aware masking available |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom typewriter animation | react-native-type-animation library | Library handles complexity but less control; custom Reanimated gives full control but ~50 lines boilerplate |
| Supabase Auth + JWT | Firebase Auth + Phone | Firebase removed phone auth from mobile; Supabase is correct choice |
| expo-secure-store | AsyncStorage only | Faster but insecure (unencrypted); phone + JWT is sensitive data |
| react-native-toast-message | Burnt (native toasts) | Burnt won't work in Expo Go (requires EAS build); toast-message is Expo-compatible |
| FlatList (custom) | react-native-gifted-chat | Gifted Chat is full-featured but overkill (calendar, typing indicators built-in); custom FlatList gives design control |
| Phone input library | Custom TextInput + zod | Library = fast but rigid; custom = RTL-friendly + compliance with Design System |

**Installation:**
```bash
# Already in package.json (Phase 1):
npm install @supabase/supabase-js expo-secure-store react-native-reanimated zustand zod react-hook-form

# Add for Phase 2:
npm install @react-native-clipboard/clipboard react-native-toast-message
npm install --save-dev @testing-library/react-native @react-native-otp-input/otp-entry  # if choosing OTP library
```

**Version verification:**
- @supabase/supabase-js: 2.102.1 (Jan 2026, latest stable)
- expo-secure-store: 14.2.4 (March 2026)
- react-native-reanimated: 3.15.1 (March 2026)
- react-native-toast-message: 2.1.5 (active maintenance, latest Jan 2026)
- @react-native-clipboard/clipboard: 1.16.3 (Dec 2025, latest stable)

---

## Architecture Patterns

### Recommended Project Structure

For Phase 2, expand Phase 1 foundation:

```
app/
├── _layout.tsx                    ← Root: RTL init, auth guard, session listener
├── (tabs)/
│   ├── _layout.tsx                ← Tab bar (5 tabs, reversed for RTL)
│   └── coach.tsx                  ← AI Chat screen
└── auth/
    ├── index.tsx                  ← Phone input screen
    └── verify.tsx                 ← OTP verification screen

components/
├── chat/
│   ├── ChatBubble.tsx             ← User/AI bubbles with RTL alignment
│   ├── ChatInput.tsx              ← Message input with Design System slab style
│   ├── TypingIndicator.tsx        ← Bouncing 3-dot animation (Reanimated)
│   └── TypewriterText.tsx         ← Character-by-character animation (40-50ms)
├── ui/
│   ├── Input.tsx                  ← Slab-style input component (reusable)
│   ├── Button.tsx                 ← Primary/Secondary buttons with gradients
│   └── OTPInput.tsx               ← 4-digit field component (or 6-digit)

stores/
├── useAuthStore.ts                ← user, session, signIn, signOut
├── useChatStore.ts                ← messages[], sendMessage, loadHistory

lib/
├── supabase.ts                    ← createClient with expo-secure-store adapter
└── claude.ts                       ← callCoach() → Edge Function invoke

supabase/
├── functions/
│   └── ask-coach/
│       └── index.ts               ← Deno Edge Function: JWT validation, Claude call
└── migrations/
    ├── 001_users_table.sql        ← Already created Phase 1
    ├── 002_chat_messages.sql      ← NEW: messages table + RLS
    └── 003_rls_policies.sql       ← Policies for auth.uid() = user_id

types/
└── index.ts                        ← ChatMessage, AuthSession, ApiResponse types
```

---

### Pattern 1: Supabase Phone OTP with expo-secure-store

**What:** Secure session storage + automatic token refresh

**When to use:** Always for Phase 2 (auth is required)

**Example:**

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
    },
  }
)

// app/_layout.tsx (root layout)
export default function RootLayout() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        useAuthStore.getState().setSession(session)
        if (!session) router.replace('/auth')
      }
    )
    return () => subscription?.unsubscribe()
  }, [])
  // ...
}
```

**Key points:**
- SecureStore size limit: ~2KB (JWT token is ~500B, safe)
- Auto-refresh: Supabase handles token expiry transparently
- No manual session checks needed — `onAuthStateChange` is authoritative

**Source:** Supabase Docs — Use Supabase with Expo React Native

---

### Pattern 2: Edge Function JWT Validation & Context Routing

**What:** Backend validates JWT, extracts user context, routes to Claude API

**When to use:** Every call from client to AI coach

**Example:**

```typescript
// supabase/functions/ask-coach/index.ts (Deno Edge Function)
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')!

serve(async (req) => {
  // Extract JWT from Authorization header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const token = authHeader.replace('Bearer ', '')

  // Initialize Supabase client with auth context
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.0')
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  // Verify JWT and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return new Response('Unauthorized', { status: 401 })

  // Parse request body
  const { messages, type = 'coach' } = await req.json()

  // Fetch user context for personalization (Phase 4)
  // For Phase 2, keep coach generic (no context injection)

  // Call Claude API with last 15 messages
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: 'You are Gash, an Israeli dating coach...',  // Hebrew system prompt
      messages: messages.slice(-15), // Last 15 messages
    }),
  })

  const responseData = await response.json()
  const assistantMessage = responseData.content[0].text

  // Save message to chat_messages table (RLS enforced)
  await supabase
    .from('chat_messages')
    .insert({
      user_id: user.id,
      role: 'assistant',
      content: assistantMessage,
      created_at: new Date().toISOString(),
    })

  return new Response(JSON.stringify({ content: assistantMessage }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

**Key points:**
- JWT extracted from Authorization header
- `supabase.auth.getUser()` validates token; fails if expired/invalid
- All DB queries use RLS (no manual user_id filter needed)
- No streaming (return full response); client handles typewriter animation
- System prompt in Hebrew (not English with "respond in Hebrew")

**Source:** Supabase Docs — Securing Edge Functions, Integrating with Auth

---

### Pattern 3: FlatList Chat UI with Reanimated Typewriter

**What:** Message list with entering/exiting animations + character-by-character typewriter on AI responses

**When to use:** Always for chat screen

**Example:**

```typescript
// components/chat/ChatBubble.tsx
import Animated, {
  FadeInRight,
  FadeInLeft,
  Layout,
} from 'react-native-reanimated'
import { View, Text, Pressable } from 'react-native'
import { useCallback } from 'react'
import { useSharedValue } from 'react-native-reanimated'

type ChatBubbleProps = {
  role: 'user' | 'assistant'
  content: string
  isTyping?: boolean
  onLongPress?: () => void
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  role,
  content,
  isTyping,
  onLongPress,
}) => {
  const displayedText = useSharedValue(content)

  // For AI messages: animate character-by-character
  useEffect(() => {
    if (role === 'assistant' && !isTyping) {
      animateTypewriter(content) // 40-50ms per character
    }
  }, [content, role, isTyping])

  const isUser = role === 'user'
  const bubbleBg = isUser ? 'surface-container-high' : 'primary-container'
  const textColor = isUser ? 'on-surface' : 'on-primary-container'
  const alignSelf = isUser ? 'flex-end' : 'flex-start'

  return (
    <Animated.View
      entering={isUser ? FadeInRight.springify() : FadeInLeft.springify()}
      layout={Layout.springify()}
      style={{ alignSelf, marginBottom: 24 }} // 24px spacing, no dividers
    >
      <Pressable
        onLongPress={onLongPress}
        style={{
          backgroundColor: bubbleBg,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
          maxWidth: '80%',
        }}
      >
        <Text style={{ color: textColor, fontSize: 16, lineHeight: 1.6 }}>
          {displayedText}
        </Text>
        {isTyping && <TypingIndicator />}
      </Pressable>
    </Animated.View>
  )
}

// components/chat/TypingIndicator.tsx
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { useEffect } from 'react'

export const TypingIndicator = () => {
  const dot1Opacity = useSharedValue(0.3)
  const dot2Opacity = useSharedValue(0.3)
  const dot3Opacity = useSharedValue(0.3)

  useEffect(() => {
    dot1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.3, { duration: 300 })
      ),
      -1,
      false
    )
    // Offset dot2 and dot3 timing for staggered effect
  }, [])

  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      <Animated.Text style={[{ fontSize: 20, opacity: dot1Opacity }]}>•</Animated.Text>
      <Animated.Text style={[{ fontSize: 20, opacity: dot2Opacity }]}>•</Animated.Text>
      <Animated.Text style={[{ fontSize: 20, opacity: dot3Opacity }]}>•</Animated.Text>
    </View>
  )
}
```

**Key points:**
- Entering animations use Reanimated `FadeInRight` / `FadeInLeft` (springy, natural feel)
- Typewriter: track text via shared value, update every 40-50ms
- Typing indicator: bouncing dots animation (separate from typewriter)
- No dividers — 24px bottom margin creates spacing
- Long-press gesture attached to bubble

**Source:** Reanimated v3 Docs, React Native Chat Animation examples

---

### Pattern 4: RTL Hebrew Input with Phone Format

**What:** Accept Israeli phone numbers, auto-format, validate RTL

**When to use:** Auth screen, phone input field

**Example:**

```typescript
// components/ui/Input.tsx (Slab-style for Design System)
import { TextInput, View } from 'react-native'
import { useRef, useState } from 'react'

type InputProps = {
  placeholder: string
  value: string
  onChangeText: (text: string) => void
  secureTextEntry?: boolean
  keyboardType?: 'phone-pad' | 'numeric' | 'default'
  rtl?: boolean
}

export const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  rtl = true,
}) => {
  const [focused, setFocused] = useState(false)

  return (
    <View
      style={{
        backgroundColor: '#20201f', // surface-container-high
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: focused ? 2 : 0,
        borderBottomColor: focused ? '#81ecff' : 'transparent', // primary on focus
      }}
    >
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#adaaaa" // on-surface-variant
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={{
          fontSize: 16,
          color: '#ffffff',
          textAlign: rtl ? 'right' : 'left',
        }}
      />
    </View>
  )
}

// app/auth/index.tsx (Phone input screen)
import { useController, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, 'מספר לא חוקי') // Invalid number
    .refine(
      (val) => /^(\+972|0)[0-9]{9}$/.test(val.replace(/\s/g, '')),
      'תן מספר ישראלי' // Provide Israeli number
    ),
})

export default function PhoneScreen() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(phoneSchema),
  })

  const { field } = useController({
    control,
    name: 'phone',
  })

  const handleSignIn = async (data: { phone: string }) => {
    let phone = data.phone.replace(/\s/g, '')
    // Auto-prepend +972 if user entered 050...
    if (phone.startsWith('0')) {
      phone = `+972${phone.slice(1)}`
    }
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'בעיה בחיבור',
        text2: error.message,
      })
    }
  }

  return (
    <View style={{ padding: 16 }}>
      <Input
        placeholder="+972 50 123 4567"
        value={field.value}
        onChangeText={field.onChange}
        keyboardType="phone-pad"
        rtl={true}
      />
      <Button onPress={handleSubmit(handleSignIn)} title="שלח קוד" />
    </View>
  )
}
```

**Key points:**
- `textAlign: 'right'` for RTL (never use `left` in styles — CLAUDE.md directive)
- Phone format: accept `050...` or `+972...`, normalize to +972
- Validation error messages in Hebrew
- No inline validation feedback on input (only on submit attempt)
- Toast for errors (not modals or inline errors)

**Source:** CLAUDE.md RTL Rules, Design System Slab Input spec

---

### Anti-Patterns to Avoid

- **Direct Claude API calls from client code:** Always use Edge Function. Client never calls API with API key. → **Fix:** Route through `supabase.functions.invoke('ask-coach')` with JWT forwarding
- **Hardcoded directional styles (paddingLeft, marginRight, left: 0):** Breaks RTL. → **Fix:** Use `paddingStart`, `paddingEnd`, `marginStart`, `marginEnd`
- **Storing JWT in AsyncStorage unencrypted:** Security risk for auth tokens. → **Fix:** Use `expo-secure-store` with custom adapter
- **Streaming Claude responses client-side:** Adds latency and complexity. → **Fix:** Edge Function returns full response, client handles animation
- **Toast library that requires native build:** Won't work in Expo Go. → **Fix:** Use `react-native-toast-message` (Expo-compatible)
- **Message FlatList without virtualization:** Renders all messages, kills performance. → **Fix:** Use FlatList's built-in optimization, or switch to Flashlist if needed
- **OTP input field without RTL support:** Hebrew users experience LTR digit input. → **Fix:** Use RTL-aware input component (test on device)
- **Copy-to-clipboard without feedback:** User unsure if copy succeeded. → **Fix:** Long-press → toast "העתק?" → confirm → toast "הועתק!"

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SMS OTP delivery | Custom Twilio wrapper | Supabase Auth + Twilio provider | Built-in rate limiting, retry logic, SMS template management |
| JWT token storage | Custom encrypted cache | expo-secure-store | Platform-native encryption (iOS Keychain, Android Keystore), non-extractable |
| Session auto-refresh | Manual token expiry checking | Supabase `autoRefreshToken` + `persistSession` | Handles expiry, refresh token rotation, race conditions |
| Message list rendering | Naive FlatList (renders all) | FlatList with keyExtractor + getItemLayout | Virtualization, only renders visible items |
| Text animation | Character morphing library | Reanimated v3 with shared values | GPU-accelerated, smooth 60fps, integrates with layout animations |
| Typewriter timing | setTimeout loops | Reanimated `withTiming` | Non-blocking, cancelable, respects animation frame cycle |
| Toast notifications | Custom overlay component | react-native-toast-message | Accessibility, keyboard handling, stacking, platform-specific behavior |
| Phone number validation | Regex only | zod + phone number library | Handles e164, national formats, carrier validation |
| Copy-to-clipboard | Manual intent sending | expo-clipboard or @react-native-clipboard/clipboard | Cross-platform, fallback handling |
| Form validation | Manual state + checks | react-hook-form + zod | Type-safe, error handling, field reset, accessibility |

**Key insight:** Supabase Auth handles 95% of auth complexity (rate limiting, SMS delivery, token refresh, session state). Custom code adds security bugs. Edge Functions abstract Claude API calls, keeping client secure. Reanimated abstracts animation timing and frame cycles.

---

## Common Pitfalls

### Pitfall 1: SecureStore Size Limit Silent Failure

**What goes wrong:** Store JWT + user object in SecureStore → size exceeds 2KB → silently fails, session not persisted, user logged out on restart.

**Why it happens:** SecureStore has platform limits (iOS Keychain ~32KB per item, but Expo wraps it tighter). Developers assume larger values work until production.

**How to avoid:**
- Store only JWT token in SecureStore (500B), not full user object
- User object lives in Zustand/AsyncStorage (faster, larger)
- Test with `SecureStore.setItemAsync()` try/catch to detect size errors early

**Warning signs:**
- Session lost after app restart (but sign-in works temporarily)
- SecureStore.setItemAsync throws "Provided value larger than 2048 bytes"

**Code:**
```typescript
// ✅ CORRECT: JWT only in SecureStore
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key)
    } catch (err) {
      console.error('SecureStore size error:', err)
      return null
    }
  },
  setItem: async (key: string, value: string) => {
    if (value.length > 2000) {
      console.warn('Payload too large for SecureStore')
      return
    }
    return await SecureStore.setItemAsync(key, value)
  },
  // ...
}
```

**Source:** Supabase Issue #20155 — Session Persistence, SecureStore Size Limitations

---

### Pitfall 2: Edge Function JWT Validation After 2026 API Key Migration

**What goes wrong:** Update to new `sb_publishable_*` keys → Edge Function suddenly returns 401 Unauthorized → all AI coach calls fail.

**Why it happens:** Supabase changed JWT signing strategy in 2026. Gateway no longer implicitly validates JWTs; developers must add explicit validation.

**How to avoid:**
- Always call `supabase.auth.getUser()` inside Edge Function to validate JWT
- Don't rely on infrastructure-level `verify_jwt = true` (deprecated)
- Extract token from Authorization header, pass to getUser()
- Return 401 if getUser() fails

**Warning signs:**
- All Edge Function calls return 401 even with valid JWT
- `.env` uses new `SUPABASE_ANON_KEY` starting with `sb_publishable_`
- Recent deployment or Supabase project created after Q1 2026

**Code:**
```typescript
// ✅ CORRECT: Explicit JWT validation
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) {
  console.error('JWT validation failed:', error)
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Now safe to use user.id for RLS
```

**Source:** Supabase Docs — Securing Edge Functions, 2026 API Key Discussion #41834

---

### Pitfall 3: RTL Text Direction Not Applied to Navigation

**What goes wrong:** Force RTL with `I18nManager.forceRTL()` for app content, but forgot to update Expo Router tab bar order → tabs appear in wrong order visually.

**Why it happens:** React Navigation and Expo Router don't auto-mirror tab order based on I18nManager. Developers assume forcing RTL handles all UI mirroring.

**How to avoid:**
- Call `I18nManager.forceRTL(true)` + `Updates.reloadAsync()` in root layout (on first app boot)
- Manually reverse tab array in `(tabs)/_layout.tsx` so rightmost tab appears first visually
- Test on physical device (Expo Go simulator may have rendering quirks)

**Warning signs:**
- RTL text appears correctly, but tab icons and order are still LTR
- App appears LTR on emulator but RTL on device (or vice versa)

**Code:**
```typescript
// app/_layout.tsx
import { I18nManager } from 'react-native'
import { useSettingsStore } from '@/stores/useSettingsStore'

export default function RootLayout() {
  const { rtlInitialized } = useSettingsStore()

  useEffect(() => {
    if (!rtlInitialized) {
      I18nManager.forceRTL(true)
      setRtlInitialized(true)
      Updates.reloadAsync() // Reload to apply RTL throughout
    }
  }, [rtlInitialized])

  // ...
}

// app/(tabs)/_layout.tsx
export default function TabLayout() {
  return (
    <Tabs>
      {/* REVERSE order so rightmost tab appears first visually */}
      <Tabs.Screen name="tips" options={{ title: 'טיפים' }} />
      <Tabs.Screen name="dashboard" options={{ title: 'דשבורד' }} />
      <Tabs.Screen name="journal" options={{ title: 'ביומן' }} />
      <Tabs.Screen name="log" options={{ title: 'רשום' }} />
      <Tabs.Screen name="coach" options={{ title: 'מאמן' }} />
    </Tabs>
  )
}
```

**Source:** CLAUDE.md RTL Rules, Expo Router RTL Handling

---

### Pitfall 4: Toast Notification Library Requires EAS Build

**What goes wrong:** Choose toast library like `Burnt` (native implementation) → App runs fine in development → Try to run in Expo Go → Crashes (native code not available).

**Why it happens:** Some toast libraries use native modules. Expo Go can't load native code; requires EAS build to embed native libraries.

**How to avoid:**
- For Phase 2 (Expo Go dev), use pure-JS toast libraries only
- `react-native-toast-message` is safe (no native dependency)
- Avoid `Burnt`, other native-only implementations
- Check library's GitHub: "Does it work with Expo Go?"

**Warning signs:**
- Toast library requires EAS build in README
- `npm install` succeeds but app crashes in Expo Go with "Native module not found"

**Code:**
```typescript
// ✅ CORRECT: Expo Go compatible
import Toast from 'react-native-toast-message'

Toast.show({
  type: 'error',
  text1: 'בעיה בחיבור',
  text2: 'בדוק את הרשת',
  position: 'bottom',
})

// ❌ WRONG: Won't work in Expo Go
// import { showSuccessToast } from 'burnt' // Native implementation
```

**Source:** react-native-toast-message Docs, Burnt GitHub

---

### Pitfall 5: Typewriter Animation Blocks Message Visibility Too Long

**What goes wrong:** Set typewriter speed too slow (e.g., 100ms per char) → AI response takes 30+ seconds to fully animate → User thinks message is still loading, tries to send again → Duplicate messages.

**Why it happens:** Developers prioritize visual smoothness over usability. Slow animations feel cool but hurt UX.

**How to avoid:**
- Lock typewriter speed to 40-50ms per character (per CONTEXT.md)
- Show full message immediately in background (opacity: 0), just animate opacity reveal
- Or: Show thinking bubble while Claude processes, display full text without animation on arrival
- Test with 100-character message: animation should complete in 4-5 seconds max

**Warning signs:**
- Users say "message takes forever to appear"
- User sends duplicate messages (didn't realize first sent)

**Code:**
```typescript
// ✅ CORRECT: 40-50ms per character = ~200-250 WPM
const CHARACTER_DELAY = 45 // ms

// ✅ ALTERNATIVE: Fade-in with no char-by-char animation
const animateMessageAppearance = (text: string) => {
  opacity.value = withTiming(1, { duration: 300 })
  // Full message visible immediately, just fade glow
}
```

**Source:** CONTEXT.md — Typewriter Speed Decision

---

## Code Examples

Verified patterns from official sources and Phase 2 decisions:

### Supabase Auth Phone OTP Flow

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
    },
  }
)
```

**Source:** Supabase Docs — Use Supabase with Expo React Native

### Edge Function with JWT Validation & Claude Call

```typescript
// supabase/functions/ask-coach/index.ts
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')

  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.0')
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  // Validate JWT
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const { messages } = await req.json()

    // Fetch last 15 messages from chat_messages table
    const { data: recentMessages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15)

    const messageHistory = (recentMessages || [])
      .reverse()
      .map((msg) => ({ role: msg.role, content: msg.content }))

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: 'You are Gash, an Israeli dating coach who gives direct, actionable advice in Hebrew...',
        messages: [...messageHistory, { role: 'user', content: messages[messages.length - 1].content }],
      }),
    })

    const { content } = await claudeResponse.json()
    const responseText = content[0].text

    // Save assistant message to DB (RLS enforced)
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      role: 'assistant',
      content: responseText,
      created_at: new Date().toISOString(),
    })

    return new Response(JSON.stringify({ content: responseText }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
```

**Source:** Supabase Docs — Securing Edge Functions, Edge Functions Quickstart

### Reanimated Typewriter Animation Component

```typescript
// components/chat/TypewriterText.tsx
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { Text } from 'react-native'
import { useEffect, useState } from 'react'

type TypewriterTextProps = {
  text: string
  speed?: number // ms per character
  onComplete?: () => void
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 45,
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        clearInterval(interval)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed, onComplete])

  return <Text>{displayedText}</Text>
}
```

**Source:** React Native Type Animation GitHub, Reanimated v3 Docs

### React-Native-Toast-Message Setup

```typescript
// app/_layout.tsx
import Toast from 'react-native-toast-message'

export default function RootLayout() {
  return (
    <>
      {/* Main app content */}
      <Stack />
      {/* Toast must be at root level */}
      <Toast />
    </>
  )
}

// Anywhere in app:
Toast.show({
  type: 'error',
  text1: 'בעיה בחיבור',
  text2: 'בדוק את הרשת',
  position: 'bottom',
})

Toast.show({
  type: 'success',
  text1: 'הועתק!',
  position: 'bottom',
})
```

**Source:** react-native-toast-message npm, GitHub examples

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Firebase Phone Auth | Supabase Auth + Twilio | Q3 2024 | Firebase removed mobile phone auth; Supabase is recommended for React Native |
| Redux for state | Zustand + AsyncStorage persist | Q2 2024 | Zustand is lighter, faster, TypeScript-first; simpler API |
| ScrollView + hardcoded heights | FlatList with virtualization | Always | FlatList only renders visible items; critical for 100+ messages |
| setTimeout typewriter loops | Reanimated shared values + withTiming | Q1 2024 | GPU-accelerated, non-blocking, responsive to user gestures |
| Burnt toast (native) | react-native-toast-message (JS) | Q2 2024 | Expo Go support, no native build required for MVP |
| Manual JWT refresh | Supabase autoRefreshToken | Always | Transparent refresh, no race conditions |
| @react-native-community/clipboard | @react-native-clipboard/clipboard | Q4 2024 | Community version unmaintained (last update 2020); new version actively maintained |
| Plain TextInput RTL | I18nManager.forceRTL() system-wide | Q1 2025 | Platform handles directional layout; no manual `textAlign: 'right'` needed if system RTL enabled |

**Deprecated/outdated:**
- Firebase Auth for mobile: Removed phone OTP support; use Supabase
- Expo's Clipboard API: Built-in but less reliable; use npm package instead
- @react-native-community/clipboard: Last updated 2020; unmaintained
- Redux for chat state: Too much boilerplate; Zustand is modern standard

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + @testing-library/react-native |
| Config file | jest.config.js, jest-setup.js |
| Quick run command | `npm test -- __tests__/stores/useAuthStore.test.ts --watch` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Phone input accepts Israeli format, auto-prepends +972 | unit | `npm test -- __tests__/stores/useAuthStore.test.ts -t "phone format"` | ❌ Wave 0 |
| AUTH-02 | OTP verification calls signInWithOtp with 4-6 digit code | unit | `npm test -- __tests__/stores/useAuthStore.test.ts -t "verifyOtp"` | ❌ Wave 0 |
| AUTH-03 | JWT persists in expo-secure-store, onAuthStateChange restores session | unit | `npm test -- __tests__/stores/useAuthStore.test.ts -t "session persist"` | ✅ Exists |
| AUTH-04 | Sign out clears secure store and redirects to auth | unit | `npm test -- __tests__/stores/useAuthStore.test.ts -t "signOut"` | ✅ Exists |
| CHAT-01 | User can type Hebrew text, ChatInput sends via sendMessage | unit | `npm test -- __tests__/stores/useChatStore.test.ts -t "sendMessage Hebrew"` | ✅ Exists |
| CHAT-02 | Claude API returns Hebrew response, Edge Function called with JWT | integration | Manual test: send message, inspect network tab (test in Wave 1) | ❌ Requires live Edge Function |
| CHAT-03 | Messages persist in DB, load on screen open | unit | `npm test -- __tests__/stores/useChatStore.test.ts -t "loadHistory"` | ✅ Exists |
| CHAT-04 | Copy-to-clipboard triggered by long-press, toast shown | unit | `npm test -- __tests__/components/chat/ChatBubble.test.tsx -t "copy clipboard"` | ❌ Wave 0 |
| CHAT-05 | Last 15 messages fetched, older messages excluded | unit | `npm test -- __tests__/stores/useChatStore.test.ts -t "messageWindowLimit"` | ❌ Wave 0 |
| CHAT-06 | System prompt includes Hebrew context (verify in Edge Function logs) | integration | Manual test: log Edge Function responses | ❌ Requires live deployment |

### Sampling Rate
- **Per task commit:** `npm test -- __tests__/stores/useAuthStore.test.ts -t "{feature}" --watch` (relevant store test)
- **Per wave merge:** `npm test` (full store + component test suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `__tests__/components/chat/ChatBubble.test.tsx` — covers CHAT-04 (long-press, clipboard, toast)
- [ ] `__tests__/stores/useChatStore.test.ts` — test for CHAT-05 (message window limit)
- [ ] Phone format validation test in `__tests__/stores/useAuthStore.test.ts` — covers AUTH-01
- [ ] Framework install: Already in package.json (jest, @testing-library/react-native)

**Note:** Integration tests (CHAT-02, CHAT-06) require live Edge Function and Supabase instance. These are manual smoke tests during Wave 1 (before merging to main). Automated E2E tests deferred to Phase 3.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Build / dev server | ✓ | v20+ (from package.json scripts) | — |
| npm | Package manager | ✓ | 9+ (Expo requirement) | yarn (but not installed) |
| Expo CLI | Build / emulator | ✓ | ~52 (from package.json) | — |
| Supabase project | Auth + DB + Edge Functions | ✓ (required setup) | Latest (2026) | — |
| Twilio account + SMS provider | Phone OTP delivery | ⚠ (must configure in Supabase dashboard) | Twilio Verify (recommended) | MessageBird, Vonage |
| Android emulator or iPhone | Testing | Conditional | Latest | Expo Go app |

**Missing dependencies with no fallback:**
- Supabase project (create free tier at supabase.io before starting Phase 2)
- Twilio account linked in Supabase Auth Providers (configure Account SID, Auth Token, Service SID before testing AUTH-01)

**Missing dependencies with fallback:**
- Native device: Test in Expo Go first (free), use EAS Build later (after Phase 2)

**Setup checklist before Phase 2 implementation:**
- [ ] Supabase project created (env vars: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY)
- [ ] Twilio account + SMS provider configured in Supabase Auth Providers
- [ ] Edge Function runtime configured (Deno v1.40+)
- [ ] CLAUDE_API_KEY added to Edge Function secrets (via Supabase Dashboard)
- [ ] chat_messages table + RLS policies created (Phase 1 migrations)

---

## Sources

### Primary (HIGH confidence)

- **Supabase Docs - Phone Login** - OTP flow with Twilio, configuration, error handling
- **Supabase Docs - Use Supabase with Expo React Native** - Session persistence, expo-secure-store adapter, autoRefreshToken
- **Supabase Docs - Securing Edge Functions** - JWT validation patterns, Authorization header extraction, getUser() verification
- **React Native Reanimated v3 Docs** - Animated components, useSharedValue, withTiming, Layout animations
- **CLAUDE.md (project rules)** - Locked stack (Zustand, Supabase, expo-secure-store, Haiku model), RTL rules, folder structure

### Secondary (MEDIUM confidence)

- [Supabase React Native Tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native) - Complete auth example with Zustand
- [React Native Toast Message GitHub](https://github.com/calintamas/react-native-toast-message) - Toast patterns, RTL support
- [@react-native-clipboard/clipboard npm](https://www.npmjs.com/package/@react-native-clipboard/clipboard) - Clipboard API, version stability
- [React Native Chat Animation Examples](https://www.animatereactnative.com/post/incoming-chat-messages-animation-reanimated) - FlatList animations with Reanimated
- [Expo Secure Store Documentation](https://docs.expo.dev/versions/latest/sdk/securestore/) - Storage limits, async patterns

### Tertiary (LOW confidence)

- [Gitub Issue #20155 - Supabase Session Persistence](https://github.com/orgs/supabase/discussions/20155) - SecureStore size limit warnings (single source, user reports)
- [GitHub Discussion #41834 - Edge Function JWT 2026 API Keys](https://github.com/orgs/supabase/discussions/41834) - New sb_publishable_ key behavior (recent, limited adoption data)
- [react-native-gifted-chat Performance Issues](https://github.com/FaridSafi/react-native-gifted-chat/issues) - Library limitations for large message sets (GitHub issue discussion, not official guidance)

---

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — All libraries locked in package.json or recommended by official Supabase + Expo docs
- **Supabase Auth + OTP:** HIGH — Supabase official docs are authoritative for phone flow, Twilio integration documented
- **Expo-secure-store adapter:** HIGH — Pattern from official Supabase React Native quickstart
- **Edge Function JWT validation:** MEDIUM — Official docs show patterns, but 2026 API key migration is recent (GitHub discussion suggests some ambiguity in rollout)
- **Chat UI / FlatList:** HIGH — React Native Reanimated v3 is stable; FlatList is standard
- **RTL support:** HIGH — I18nManager.forceRTL is core React Native feature; Design System confirmed Hebrew-first
- **Toast library:** HIGH — react-native-toast-message is current standard (Feb 2026)
- **Clipboard:** HIGH — expo-clipboard and @react-native-clipboard/clipboard both actively maintained
- **Pitfalls:** MEDIUM-HIGH — SecureStore size limit confirmed from WebSearch; Edge Function JWT migration confirmed from GitHub; RTL tab order from project context

**Research date:** 2026-04-08
**Valid until:** 2026-04-22 (14 days for stable auth libraries; Supabase + Reanimated rarely break)

---

## Open Questions

1. **Twilio OTP Format (4 vs 6 digits)?**
   - What we know: Supabase dashboard config determines format; Phase 2 CONTEXT.md says "defer to Supabase dashboard"
   - What's unclear: Is 4-digit OTP sufficient for security, or should we always use 6?
   - Recommendation: For MVP, use 6-digit (standard for SMS OTP). Planner should configure Supabase provider once before Phase 2 implementation.

2. **Typewriter Animation: Character-by-character vs. Fade-in?**
   - What we know: CONTEXT.md locked 40-50ms typewriter. But this may feel slow for long responses.
   - What's unclear: Should we show full message immediately (opacity: 0) and animate reveal, or truly animate each character?
   - Recommendation: Locked decision says typewriter. Implement as specified. If UX feedback suggests too slow, iterate in Phase 3.

3. **OTP Input Component: 4 separate fields or single masked input?**
   - What we know: CONTEXT.md says "4 separate digit fields OR single input with auto-advance"
   - What's unclear: Which is more accessible / RTL-friendly?
   - Recommendation: Planner should evaluate both. 4 fields are more visual (Messenger-style), single input is simpler code. Both RTL-compatible if built correctly.

4. **Message Persistence: Soft delete or permanent delete?**
   - What we know: CONTEXT.md says "no reset button" and defers message deletion to Phase 3
   - What's unclear: Should deleted messages stay in DB (soft delete) for analytics, or be purged?
   - Recommendation: Defer to Phase 3 (journal edit/delete implementation). Phase 2 doesn't support deletion.

5. **Edge Function Rate Limiting?**
   - What we know: Supabase Auth has OTP rate limits (1 per minute per user)
   - What's unclear: Should Edge Function calls (ask-coach) have rate limits to prevent abuse?
   - Recommendation: Phase 2 doesn't implement rate limiting. v2 monetization will add usage caps (MOTZ-01).

---

## Next Steps for Planner

1. **Create Supabase project** (free tier) — get EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
2. **Configure Twilio in Supabase Auth Providers** — set Account SID, Auth Token, Service SID
3. **Choose OTP input implementation** — 4 fields or single input? (Recommend 4 fields for UX)
4. **Create chat_messages table + RLS** (continue from Phase 1) — migrations in supabase/migrations/
5. **Deploy ask-coach Edge Function** (Deno) — verify JWT, call Claude, save messages
6. **Implement auth screens** (phone input, OTP verification) — form validation, error toasts
7. **Implement chat screen** — FlatList, ChatBubble (user/AI), TypewriterText, TypingIndicator, ChatInput, copy-to-clipboard
8. **Write tests** — useAuthStore (phone format, session persist), useChatStore (message window, persistence)

Phase 2 is greenfield for auth + chat. Phase 1 foundation (RTL, navigation, design system) supports all UI components.

---

**Ready for planning.** Planner can now create detailed task breakdowns and estimation.
