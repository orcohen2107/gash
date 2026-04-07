# Skill: Agent Routing Pattern

איך Edge Function אחת מנתבת בין 7 agents לפי `type`.

## Intent Router — לפני Claude

```ts
// supabase/functions/ask-coach/intentRouter.ts
// רץ לפני הקריאה לClaude — Claude לא מנתב, הbackend מנתב

export function detectIntent(message: string, explicitType?: string): AgentType {
  // אם הfrontend שלח type מפורש — תכבד אותו
  if (explicitType) return explicitType as AgentType

  const msg = message.toLowerCase().trim()

  // reply-coach — הודעה שקיבל ממישהי
  if (/היא כתבה|היא שלחה|קיבלתי הודעה|מה אני עונה|מה לענות|מה להגיב/.test(msg))
    return 'reply-coach'

  // boost — עומד לפנות עכשיו
  if (/עומד לפנות|אני בדרך|עומד לגשת|יש לי בחורה|יש פה/.test(msg))
    return 'boost'

  // situation-opener — בקשת פתיחות לסיטואציה
  if (/איך פותח|מה אומרים|פתיחה ל|איך מתחיל/.test(msg))
    return 'situation-opener'

  // ברירת מחדל
  return 'coach'
}
```

## Router הראשי

```ts
// supabase/functions/ask-coach/router.ts
import { PROMPTS } from './prompts.ts'
import { buildUserContext } from './buildUserContext.ts'

type AgentType = 'coach' | 'reply-coach' | 'situation-opener' | 'profile' | 'insights' | 'onboarding' | 'debrief'

const MODEL_OVERRIDES: Partial<Record<AgentType, string>> = {
  'reply-coach': 'claude-sonnet-4-6',  // ניואנסים של שפה
}

const JSON_AGENTS: AgentType[] = ['reply-coach', 'situation-opener', 'profile', 'insights', 'onboarding']

export async function routeAgent(
  type: AgentType,
  userId: string,
  body: any,
  messages: any[],
  supabase: SupabaseClient
) {
  const userProfile = await buildUserContext(userId, supabase)
  const model = MODEL_OVERRIDES[type] ?? 'claude-haiku-4-5-20251001'
  const systemPrompt = buildSystemPrompt(type, userProfile, body)

  const response = await claude.messages.create({
    model,
    max_tokens: JSON_AGENTS.includes(type) ? 2048 : 1024,
    system: systemPrompt,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // JSON agents — parse and validate
  if (JSON_AGENTS.includes(type)) {
    try {
      return { type: 'json', data: JSON.parse(text) }
    } catch {
      // fallback: extract JSON from markdown code block
      const match = text.match(/```json?\s*([\s\S]*?)```/)
      if (match) return { type: 'json', data: JSON.parse(match[1]) }
      return { type: 'text', data: text } // fail gracefully
    }
  }

  return { type: 'text', data: text }
}
```

## buildSystemPrompt

```ts
function buildSystemPrompt(type: AgentType, profile: UserProfile, body: any): string {
  const base = PROMPTS[type] // מחרוזת מ-prompts.ts

  // inject user profile
  let prompt = injectProfile(base, profile)

  // inject onboarding data if exists
  if (profile.onboardingData && type === 'coach') {
    prompt += `\n\nמה למדת עליו בהכרות:
- סגנון מועדף: ${profile.onboardingData.initialStyle}
- אתגר עיקרי: ${profile.onboardingData.mainChallenge}
- מקומות: ${profile.onboardingData.preferredLocations.join(', ')}`
  }

  // inject approach data for profile/debrief
  if (['profile', 'debrief'].includes(type) && body?.approach) {
    prompt = prompt.replace('{{approachType}}', body.approach.approach_type)
    prompt = prompt.replace('{{opener}}', body.approach.opener ?? '')
    prompt = prompt.replace('{{response}}', body.approach.response ?? '')
    prompt = prompt.replace('{{chemistry}}', String(body.approach.chemistry_score))
    prompt = prompt.replace('{{followUp}}', body.approach.follow_up)
    prompt = prompt.replace('{{location}}', body.approach.location ?? '')
  }

  return prompt
}
```

## כללים
- model override רק ל-reply-coach (Sonnet). כל השאר Haiku.
- JSON agents מחזירים JSON. fail → fallback לtext.
- שמירה ל-chat_messages רק ל-type=coach ו-type=debrief.
- onboarding result נשמר ל-user_insights בשדה `onboarding_data`.
