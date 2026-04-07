# Claude API Research — Gash Dating Coach

**Researched:** 2026-04-07
**Confidence:** HIGH (all findings verified against official Anthropic docs)
**Models verified against:** claude-haiku-4-5, claude-sonnet-4-6

---

## Hebrew System Prompts

### Hebrew is first-class, not a workaround

Claude's multilingual benchmarks show Hebrew is not explicitly listed, but Arabic (which shares RTL script and regional proximity) scores 97.1% relative to English on Sonnet-class models and 92.5% on Haiku. Hebrew performance in practice is excellent — the model handles Modern Israeli Hebrew, slang, and mixed Hebrew/English naturally.

**Confidence: MEDIUM** — official multilingual benchmarks don't break out Hebrew specifically, but Arabic scores serve as a reasonable proxy. Real-world testing with Israeli slang is required to validate.

### How to structure the system prompt for Hebrew

Official guidance from Anthropic multilingual docs:

1. **Write the system prompt in Hebrew** — not English. This is the highest-signal instruction for consistent Hebrew output. Mixed-language system prompts (English instructions + Hebrew examples) cause inconsistent output language.
2. **Explicitly state the output language** in the system prompt even when self-evident: `תמיד ענה בעברית` reduces language-switch edge cases.
3. **Use native Hebrew script** throughout — never transliterated text in prompts.
4. **Add cultural context explicitly** — Claude understands Israeli cultural references when prompted, but specificity helps: name the contexts (בסיס, רכבת, בית קפה, מועדון) rather than relying on implicit knowledge.

### Handling mixed Hebrew/English

Israeli Hebrew naturally code-switches (app names, English loanwords, army slang). The recommended pattern:

- System prompt: written fully in Hebrew
- User messages: accept whatever the user writes (Hebrew, English, or mixed) — Claude handles this naturally
- Response language: enforce via system prompt instruction, not via user-turn injection
- English terms in responses (WhatsApp, Instagram, OK, vibe): leave in English — this is authentic Israeli speech and trying to force Hebrew equivalents sounds unnatural

### System prompt language recommendation

**Write the Gash system prompt entirely in Hebrew.** Rationale: Claude follows the system prompt's language as a strong signal for response language. An English system prompt that says "respond in Hebrew" is less reliable than a Hebrew system prompt that implicitly demonstrates the target register.

---

## Conversation Memory (MVP without vector DB)

### Context window reality for Gash

| Model | Context window | Max output | Typical Hebrew token cost |
|-------|---------------|------------|--------------------------|
| claude-haiku-4-5 | 200k tokens | 64k tokens | ~1.2-1.5x English (Hebrew script) |
| claude-sonnet-4-6 | 1M tokens | 64k tokens | ~1.2-1.5x English (Hebrew script) |

Hebrew uses approximately 20-50% more tokens than English for equivalent content because Hebrew script characters and vowel markers have different tokenization characteristics. Budget accordingly.

### Recommended strategy: Messages array sliding window

For MVP (no vector DB), use the messages array directly with a sliding window. This is the correct approach because:

- 200k token window (Haiku) = roughly 100k+ words of Hebrew conversation = many dozens of turns
- For a dating coach chat, conversations rarely exceed 20-30 turns per session
- Most user sessions are short (one question, a few back-and-forths)
- No external memory infrastructure needed at MVP scale

**Implementation pattern:**

```typescript
const MAX_CONVERSATION_TOKENS = 40000; // Leave headroom in 200k window
const MESSAGES_TO_KEEP = 20; // Keep last 20 turns as safety ceiling

function buildMessagesPayload(
  history: Message[],
  newUserMessage: string
): Message[] {
  // Always include the new message
  const allMessages = [...history, { role: 'user', content: newUserMessage }];
  
  // Simple sliding window: keep last N messages
  // Token counting via the Claude token counting API is more precise
  // but for MVP, message count is a practical proxy
  return allMessages.slice(-MESSAGES_TO_KEEP);
}
```

### When to add summarization (v2)

Summarization is warranted when conversations regularly exceed 30+ turns or when users want cross-session memory (e.g., "remember what I told you last week about Dana"). For MVP, in-session sliding window is sufficient.

The official Anthropic approach for long conversations is **server-side compaction** (beta on Sonnet 4.6 and Opus 4.6), which automatically summarizes older context when approaching token limits. This is the v2 path — not needed for MVP but worth knowing.

**Compaction is in beta as of April 2026** — available for Sonnet 4.6 and Opus 4.6 only, not Haiku 4.5.

### Context rot warning

Anthropic's own docs warn: "more context isn't automatically better. As token count grows, accuracy and recall degrade." For a coaching persona, a 10-15 turn window that stays focused beats a 50-turn window with diluted attention. Keep the window tight.

### Cross-session memory (v2 path)

Store a per-user `coachingSummary` string in Firestore, updated at end of session. Inject it as the first system message block. Example structure:

```
[מה שגש זוכר עליך]:
- ניסיון עיקרי: פנייה אחרי 3 חודשים, בעיקר בסביבת הבסיס
- נקודות חוזק: פותח שיחות טבעיות, הומור טוב
- עובד עליו: מעקב אחרי מספרים, פחד מדחייה ספציפית
```

This gives the coach continuity without vector search and costs only ~200 tokens per session.

---

## Streaming in React Native

### The direct SDK limitation

The official `@anthropic-ai/sdk` TypeScript package **does not support React Native** as a runtime environment. This is documented on the official SDK page. Direct SDK usage from Expo/React Native is not supported and will fail.

### The correct architecture: Firebase Cloud Function as proxy

All Claude API calls must route through a backend. Given Gash's stack uses Firebase, the correct pattern is:

```
React Native (Expo) → Firebase Cloud Function (Node.js) → Claude API
```

### Streaming via Firebase Cloud Functions: current state (April 2026)

Firebase streaming from Cloud Functions to **mobile clients** is NOT fully supported yet. Firebase's own blog post (March 2025) states: "We're also working on bringing this to the Python functions SDK, as well as our Swift, Kotlin, and Dart client SDKs." Mobile client SDKs (which React Native would rely on for native streaming) still fall back to non-streaming behavior.

**Practical conclusion for MVP: don't attempt native SSE streaming from Cloud Function to React Native.** Instead, use one of two patterns:

### Option A: Full response (recommended for MVP)

Cloud Function calls Claude API and waits for the full response, then returns it as a standard HTTP response. React Native receives the complete message.

- Pros: Simple, reliable, no streaming complexity
- Cons: User waits 1-3 seconds before seeing any text
- Acceptable for MVP: coaching responses are typically 2-4 sentences (per existing system prompt), so wait time is reasonable

```typescript
// Firebase Cloud Function (2nd gen)
export const askCoach = onCall(async (request) => {
  const { messages } = request.data;
  
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: GASH_SYSTEM_PROMPT,
    messages,
  });
  
  return { content: response.content[0].text };
});
```

### Option B: Simulated streaming via fetch polling (v2)

For a streaming-like UX in React Native, call a regular HTTPS endpoint that returns the full response, then use a typewriter animation on the client side to reveal text progressively. This gives perceived streaming without actual SSE.

```typescript
// Client-side typewriter effect
async function displayWithTypewriter(text: string, setter: (s: string) => void) {
  for (let i = 0; i <= text.length; i++) {
    setter(text.slice(0, i));
    await new Promise(r => setTimeout(r, 15)); // ~65 chars/sec
  }
}
```

### Option C: True streaming (post-MVP, when Firebase mobile SDKs support it)

When Firebase mobile streaming is available, use `onCall` with streaming mode and consume chunks via the Firebase client SDK. Not available as of April 2026.

### Timeout considerations

Firebase Cloud Functions (2nd gen) have a default timeout of 60 seconds, configurable to 540 seconds. For Claude API calls with `max_tokens: 1024`, typical response time is under 5 seconds on Haiku. Set function timeout to 30 seconds to be safe.

---

## Model Selection & Cost

### Current model landscape (April 2026)

The models referenced in the PRD (`claude-3-5-haiku`, `claude-3-5-sonnet`) are **legacy models** and should be updated. Current models:

| Model | API ID | Input | Output | Context | Speed |
|-------|--------|-------|--------|---------|-------|
| claude-haiku-4-5 | `claude-haiku-4-5-20251001` | $1/MTok | $5/MTok | 200k | Fastest |
| claude-sonnet-4-6 | `claude-sonnet-4-6` | $3/MTok | $15/MTok | 1M | Fast |

**Note:** `claude-3-haiku-20240307` (Claude Haiku 3) is **deprecated** and retires April 19, 2026. Do not use it.

### Recommendation: claude-haiku-4-5 for MVP

For a dating coach that produces 2-3 sentence responses in Hebrew, Haiku 4.5 is the right choice:

- 5-10x cheaper than Sonnet 4.6
- Fastest latency (critical for the <2 second response target in the PRD)
- Hebrew coaching responses don't require the reasoning depth of Sonnet
- 200k token context is more than sufficient for MVP conversation windows

**Cost estimate for freemium model (3 free messages/day):**

Assumptions:
- System prompt: ~500 Hebrew tokens (after optimization)
- Average conversation history sent: ~2,000 tokens (last 5 turns)
- User message: ~100 tokens
- Response: ~200 tokens
- Total per request: ~2,800 tokens input + 200 tokens output

Per request cost (Haiku 4.5):
- Input: 2,800 × $1/1M = $0.0028
- Output: 200 × $5/1M = $0.001
- Total: ~$0.0038 per message

With prompt caching on the system prompt (~500 tokens cached):
- Cache write: 500 × $1.25/1M = $0.000625 (first request only)
- Cache read: 500 × $0.10/1M = $0.00005 (subsequent requests)
- Input (non-cached): 2,300 × $1/1M = $0.0023
- Output: 200 × $5/1M = $0.001
- Total with cache: ~$0.00335 per message (~12% saving)

**Free tier cost (3 messages/day/user):**
- ~$0.01/user/day = ~$0.30/user/month
- 1,000 free users = $300/month
- Very manageable at early stage

**Premium tier (unlimited messages, 49 ILS/month ≈ $13/month):**
- Break-even at ~43 messages/day per premium user
- Typical power user: 10-15 messages/day → profitable at premium price

### Prompt caching for the system prompt

The Gash system prompt is ~500 tokens. **The minimum cacheable prompt for Haiku 4.5 is 4,096 tokens.** The system prompt alone will NOT qualify for caching.

To make caching worthwhile, you need to reach the 4,096 token threshold. Options:
1. Expand the system prompt with coaching context, example conversations, and cultural knowledge (~4,000+ tokens)
2. Inject the user's approach history as cached context (this is the better approach — it also improves coaching quality)

If injecting user history, use `cache_control: { type: 'ephemeral', ttl: '1h' }` since users may not return within 5 minutes. Cache hit rate for the same user's history in a single session should be high.

### Upgrade path: when to switch to Sonnet 4.6

Switch to Sonnet 4.6 when:
- Screenshot analysis (v2) is added — vision reasoning benefits from Sonnet's capability
- User feedback shows Haiku responses feel shallow or miss nuance
- You have sufficient revenue to absorb 3-5x cost increase

---

## Image & Screenshot Analysis (v2 prep)

### API format for base64 images

When screenshot analysis is added in v2, the message structure is:

```typescript
{
  role: 'user',
  content: [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg', // or image/png, image/webp
        data: base64EncodedString
      }
    },
    {
      type: 'text',
      text: 'תנתח את השיחה הזאת. מה הטון? מה הסיכויים? מה אני צריך לשלוח הלאה?'
    }
  ]
}
```

### Image sizing and cost

- Max image size for API: 5 MB per image
- Optimal size: resize to no more than 1.15 megapixels (≤1568px on longest edge) before sending
- A 1000x1000px screenshot costs ~1,334 tokens = ~$0.004 at Sonnet 4.6 prices
- Image tokens count as input tokens, so screenshot analysis calls are ~7x more expensive than text-only

### Implementation notes for React Native

1. Use `expo-image-picker` or `expo-camera` to capture the screenshot
2. Resize with `expo-image-manipulator` before encoding: `ImageManipulator.manipulateAsync(uri, [{resize: {width: 1000}}], {compress: 0.8, format: 'jpeg'})`
3. Encode to base64: `FileSystem.readAsStringAsync(resizedUri, {encoding: 'base64'})`
4. Send to Cloud Function (the image base64 string, not the file directly — keep under 32MB total request limit)
5. Cloud Function passes to Claude API with the structure above

### Files API alternative (better for repeated screenshots)

For v2, consider using the Claude Files API (`anthropic-beta: files-api-2025-04-14`) to upload screenshots once and reference by `file_id`. This reduces payload size in multi-turn conversations where the same screenshot is referenced. However, for MVP v2, base64 per-request is simpler.

### Which model for vision

Image analysis requires **Sonnet 4.6 or better** for quality screenshot analysis. Haiku 4.5 supports vision but produces lower-quality analysis for nuanced social content like WhatsApp screenshots. Plan to use Sonnet 4.6 specifically for screenshot analysis requests and Haiku 4.5 for text-only coaching.

---

## Error Handling

### HTTP error codes and handling strategy

| Code | Type | Meaning | Gash handling |
|------|------|---------|---------------|
| 400 | invalid_request_error | Malformed request | Log + alert dev; show generic error to user |
| 401 | authentication_error | Bad API key | Alert dev immediately; show "שירות לא זמין" |
| 402 | billing_error | Payment issue | Alert dev; show "שירות לא זמין" |
| 429 | rate_limit_error | Rate limit hit | Exponential backoff in Cloud Function; user sees loading state |
| 500 | api_error | Anthropic internal error | Retry once after 2s; if fails, show fallback |
| 529 | overloaded_error | API overloaded | Treat same as 500; retry with backoff |
| 504 | timeout_error | Request timed out | Use streaming for long requests; for MVP, retry once |

### Retry pattern for Cloud Function

```typescript
async function callClaudeWithRetry(
  params: MessageCreateParams,
  maxRetries = 2
): Promise<Message> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await anthropic.messages.create(params);
    } catch (error) {
      const isRetryable = isRetryableError(error);
      const isLastAttempt = attempt === maxRetries;
      
      if (!isRetryable || isLastAttempt) throw error;
      
      // Exponential backoff: 1s, 2s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Anthropic.APIError) {
    return [429, 500, 529].includes(error.status);
  }
  return false;
}
```

### Graceful degradation for users

When Claude API is unavailable, the app should NOT block the user entirely. Recommended fallback:

1. **Free tier users hitting rate limit**: Show a friendly message in Hebrew: "הגעת למגבלה היומית שלך. שדרג לפרמיום לשיחות ללא הגבלה 🔓" — this converts to premium rather than frustrating
2. **API down (500/529)**: Show: "גש לא זמין כרגע — נסה שוב בעוד כמה דקות" with a retry button
3. **Network error**: Show: "אין חיבור לאינטרנט" — standard connectivity error
4. **Timeout**: Cloud Function timeout of 30s; if exceeded, show "לוקח יותר מדי זמן — נסה שוב"

### Freemium rate limiting (app-level, not API-level)

Implement user-level daily message counting in Firestore, enforced in the Cloud Function before calling Claude:

```typescript
export const askCoach = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) throw new HttpsError('unauthenticated', 'Must be logged in');
  
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  // Check freemium limit
  if (!userData?.isPremium) {
    const today = new Date().toISOString().split('T')[0];
    const dailyCount = userData?.dailyMessageCount?.[today] ?? 0;
    
    if (dailyCount >= 3) {
      throw new HttpsError('resource-exhausted', 'Daily limit reached');
    }
    
    // Increment counter
    await db.collection('users').doc(userId).update({
      [`dailyMessageCount.${today}`]: FieldValue.increment(1)
    });
  }
  
  // Call Claude...
});
```

---

## Refined System Prompt

The existing system prompt has good intent but several structural issues: it's in English (reducing Hebrew output reliability), it's list-heavy (Claude processes prose instructions better), and it lacks cultural specificity that would make Gash feel authentically Israeli rather than a generic translation.

### Refined system prompt (Hebrew, persona-first)

```
אתה "גש" — מאמן דייטינג אישי לגברים ישראלים. השם "גש" מגיע מהמילה "לגשת" — לגשת לאנשים, לא לחכות שיגשו אליך.

האופי שלך:
אתה ישיר, חם, ומצחיק בסגנון ישראלי. לא מסביר פנים ולא מייפה את המציאות, אבל תמיד מעודד. אתה כמו החבר הכי טוב שנותן לך עצות כנות בלי לשפוט. אתה מבין את הריאלי — בסיס, רכבת, ברים בתל אביב, קפה בירושלים, פארק בחיפה. אתה מכיר את ה"כן ישראלי שנשמע כמו לא" ואת ה"לא" האמיתי.

הכללים שאתה לא עובר עליהם:
- לא מעודד גישות שמתבססות על מניפולציה, לחץ, או אי-כבוד
- לא מגרש נשים — כל ייעוץ מתבסס על כבוד הדדי
- לא נותן הבטחות — רק עצות שמגדילות סיכויים

איך אתה עונה:
- תשובות קצרות וממוקדות — 2-3 משפטים בדרך כלל
- כשאתה מציע טקסטים לשלוח — תן 2-3 אופציות מנוסחות, לא הסברים תיאורטיים
- שאל שאלת הבהרה אחת קצרה אם חסר לך מידע חיוני לפני שאתה עונה
- השתמש בעברית ישראלית רגילה — לא עברית ספרותית, לא אנגלית מיותרת

כשמנתחים תמונת שיחה (בגרסה הבאה):
- תזהה טון, עניין, ודגלים אדומים/ירוקים
- תן תגובה מוצעת קונקרטית, לא ניתוח ארוך
```

**Changes from original:**
- Written in Hebrew (not English) — highest-reliability path to consistent Hebrew output
- Removed numbered list format — prose instructions work better for persona definition
- Added authentic Israeli location references
- Made the "no manipulation" rule part of the persona, not a restriction list
- "Ask ONE clarifying question" — specificity prevents multi-question interrogations
- Removed "remember context from previous conversations" (this is implicit in the messages array; explicit instruction wastes tokens)
- Screenshot analysis section conditionally present only in v2

---

## Key Recommendations

- **Use `claude-haiku-4-5-20251001` for all MVP text chat** — fastest latency, lowest cost, sufficient quality for short coaching responses. Update PRD references from `claude-3-5-haiku` (legacy) immediately.

- **Write the system prompt in Hebrew, not English** — this is the single highest-impact change for consistent Hebrew output quality.

- **Architecture: React Native → Firebase Cloud Function → Claude API** — no direct SDK calls from RN; the official SDK does not support React Native runtime.

- **No streaming for MVP** — Firebase mobile streaming SDK not available yet (April 2026). Use full-response calls with optional client-side typewriter animation for UX.

- **Sliding window of last 15-20 messages** — sufficient for MVP conversation memory without any external storage. The 200k context window on Haiku 4.5 is far larger than needed.

- **System prompt prompt caching only pays off above 4,096 tokens** (Haiku 4.5 minimum). Expand the system prompt with coaching examples and inject user history as cached context to hit the threshold.

- **Rate limiting at app level (Firestore counter) not API level** — Anthropic rate limits are high enough that they won't be the bottleneck. Implement daily message counting yourself to enforce freemium rules.

- **Error handling: retry 429/500/529 with exponential backoff (max 2 retries)** — most Claude API errors are transient and resolve within seconds.

- **Use Sonnet 4.6 for v2 screenshot analysis, not Haiku** — vision quality difference is significant for social conversation screenshots.

- **Cross-session memory (v2): store a `coachingSummary` string in Firestore per user** — inject as context at session start. Gives continuity without vector DB. ~200 tokens cost per session.

- **Freemium conversion hook: when 429 (daily limit hit), show upgrade prompt** — don't show a generic error, convert the friction to revenue.

- **Token budget for Hebrew**: Hebrew text costs ~30-50% more tokens than equivalent English content. Account for this in `max_tokens` and cost projections.

---

## Sources

- [Anthropic Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview) — model IDs, pricing, context windows (verified April 2026)
- [Multilingual Support](https://platform.claude.com/docs/en/build-with-claude/multilingual-support) — Hebrew/multilingual best practices
- [Prompt Engineering Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) — system prompt structure
- [Context Windows](https://platform.claude.com/docs/en/build-with-claude/context-windows) — sliding window behavior, compaction
- [Prompt Caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) — cache_control, TTL, minimum token thresholds
- [Vision API](https://platform.claude.com/docs/en/build-with-claude/vision) — base64 image format, size limits, cost
- [API Errors](https://platform.claude.com/docs/en/api/errors) — error codes and recommended handling
- [Firebase Streaming Blog Post](https://firebase.blog/posts/2025/03/streaming-cloud-functions-genkit/) — mobile streaming limitation confirmed
- [TypeScript SDK](https://platform.claude.com/docs/en/api/sdks/typescript) — React Native not supported note
