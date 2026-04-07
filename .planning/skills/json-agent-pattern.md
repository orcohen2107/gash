# Skill: JSON Agent Pattern

איך לגרום ל-Claude להחזיר JSON נקי + parse בטוח עם fallback.

## בפרומפט — כללים ש-Claude מקשיב להם

```
החזר JSON בלבד. בלי טקסט לפני או אחרי. בלי markdown. רק JSON.
```

זה עובד ב-90% מהמקרים. ה-10% — Claude מוסיף ```json wrapper.

## Parse בטוח

```ts
export function safeParseJSON<T>(text: string): T | null {
  // ניסיון ראשון — JSON ישיר
  try {
    return JSON.parse(text)
  } catch {}

  // ניסיון שני — extract מ-markdown block
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) {
    try {
      return JSON.parse(match[1].trim())
    } catch {}
  }

  // ניסיון שלישי — מצא {} או [] ראשון ואחרון
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    try {
      return JSON.parse(text.slice(first, last + 1))
    } catch {}
  }

  return null
}
```

## Validation עם Zod (בEdge Function)

```ts
import { z } from 'npm:zod'

// reply-coach response schema
const ReplyCoachSchema = z.object({
  analysis: z.object({
    tone: z.string(),
    intent: z.string(),
    signal: z.enum(['חיובי', 'ניטרלי', 'שלילי']),
    summary: z.string(),
  }),
  replies: z.array(z.object({
    style: z.string(),
    text: z.string(),
    why: z.string(),
  })).length(3),
  warning: z.string().nullable(),
})

// Usage:
const parsed = safeParseJSON(claudeResponse)
const result = ReplyCoachSchema.safeParse(parsed)
if (!result.success) {
  // fallback: return raw text as coach message
  return { type: 'text', data: claudeResponse }
}
```

## חוקים
- תמיד fallback לטקסט — לעולם לא ליפול עם error למשתמש
- zod validation — כל JSON agent צריך schema
- log failures — `console.error` כשJSON parse נכשל, לdebug
