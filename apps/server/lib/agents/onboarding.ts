import { callClaude, type ClaudeMessage } from '../claude'
import type { OnboardingResponse } from '@gash/types'

const STEP_SYSTEM = `אתה גש. המשתמש חדש — מכיר אותו ב-4 שאלות קצרות.
אתה לא מראיין — שיחה קצרה ונעימה. כל שאלה נובעת מהתשובה הקודמת.

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

  const text = await callClaude({
    system,
    messages,
    jsonPrefill: step === 4,
  })

  if (step === 4) {
    const parsed = JSON.parse(text)
    return parsed as OnboardingResponse
  }

  return { text, onboardingComplete: false }
}
