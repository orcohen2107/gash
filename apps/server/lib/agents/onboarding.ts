import { z } from 'zod'
import { callClaude, callClaudeJSON, type ClaudeMessage } from '../claude'
import type { OnboardingResponse } from '@gash/types'

const OnboardingCompleteResponseSchema = z.object({
  initialStyle: z.enum(['direct', 'humor', 'situational', 'online']),
  mainChallenge: z.string(),
  preferredLocations: z.array(z.string()),
  motivation: z.string(),
  onboardingComplete: z.literal(true),
})

const FALLBACK_ONBOARDING_COMPLETE = {
  initialStyle: 'direct' as const,
  mainChallenge: 'confidence',
  preferredLocations: [],
  motivation: 'להשתפר בפניות ולבנות ביטחון',
  onboardingComplete: true as const,
}

const STEP_SYSTEM = `אתה גש. המשתמש חדש — מכיר אותו ב-4 שאלות קצרות.
אתה לא מראיין — שיחה קצרה ונעימה. כל שאלה נובעת מהתשובה הקודמת.
המטרה היא לבנות פרופיל אישי שימושי, לא לתת נאום פתיחה.

שלב 1: "מה קורה אחי! אני גש, המאמן שלך. ספר לי — מה הביא אותך לפה?"
שלב 2: שאל על הסגנון — "אתה יותר ישיר או יותר הומוריסטי בדרך כלל?"
שלב 3: שאל על האתגר — "מה הכי מאתגר אותך? הפתיחה? ההמשך? שיחת טקסט?"
שלב 4: שאל איפה + סכם — "ואיפה בדרך כלל? קפה? רכבת? מועדון?"

כל תשובה: הודעה אחת קצרה, עברית דבורה.`

const STEP_4_SUFFIX = `\n\nסכם את המשתמש והחזר JSON בלבד: {"initialStyle":"direct|humor|situational|mixed","mainChallenge":"opening|continuation|texting|confidence","preferredLocations":[...],"motivation":"...","onboardingComplete":true}`

export async function runOnboardingAgent(
  messages: ClaudeMessage[],
  step: 1 | 2 | 3 | 4
): Promise<OnboardingResponse> {
  const system = step === 4 ? STEP_SYSTEM + STEP_4_SUFFIX : STEP_SYSTEM

  if (step === 4) {
    return callClaudeJSON({
      system,
      messages,
      schema: OnboardingCompleteResponseSchema,
      fallback: FALLBACK_ONBOARDING_COMPLETE,
      logContext: { agent: 'onboarding', step },
    })
  }

  const text = await callClaude({
    system,
    messages,
    maxTokens: 300,
    logContext: { agent: 'onboarding', step },
  })

  return { text, onboardingComplete: false }
}
