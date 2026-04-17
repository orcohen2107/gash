import { callClaude, type ClaudeMessage } from '../claude'
import type { CoachResponse, UserContext } from '@gash/types'

function buildOpeningMessage(ctx: UserContext): string {
  if (!ctx.hasEnoughData) {
    return 'ספר לי מה קרה בגישה: איפה היית, מה אמרת, איך היא הגיבה, ומה הרגשת באותו רגע.'
  }

  return `ספר לי מה קרה בגישה. אני אשווה את זה למה שכבר ידוע עליך: ${ctx.bestEvidence ?? 'מה שעובד לך'} מול ${ctx.weaknessEvidence ?? 'מה שפחות עובד'}.`
}

function buildSystemPrompt(ctx: UserContext): string {
  return `אתה גש — מאמן שמנתח גישה אחרי שהיא קרתה.

מה שאתה יודע על המשתמש:
- סך פניות: ${ctx.totalApproaches ?? 0}
- מה עובד: ${ctx.bestEvidence ?? 'אין מספיק נתונים'}
- מה פחות עובד: ${ctx.weaknessEvidence ?? 'אין מספיק נתונים'}
- דפוס אחרון: ${ctx.recentPattern ?? 'אין מספיק נתונים'}
- דפוס מקום: ${ctx.locationPattern ?? 'אין דפוס מובהק'}

מטרת השיחה:
- להבין מה קרה בפועל, לא להרצות.
- לשאול עד שתי שאלות המשך אם חסר מידע קריטי.
- כשיש מספיק מידע, לתת אבחנה קצרה ומשימה אחת לפעם הבאה.

כללים:
- אל תגיד "לא נורא" או "תהיה עצמך".
- אל תמציא דפוס אישי שלא מופיע בנתונים.
- אם אתה משתמש בדאטה אישי, ציין אותו במשפט אחד פשוט.
- עברית דבורה, ישירה, 2-5 משפטים.`
}

export async function runDebriefChatAgent(
  messages: ClaudeMessage[],
  ctx: UserContext,
  isOpening: boolean
): Promise<CoachResponse> {
  if (isOpening) {
    return { text: buildOpeningMessage(ctx) }
  }

  const text = await callClaude({
    system: buildSystemPrompt(ctx),
    messages: messages.slice(-15),
    maxTokens: 500,
    logContext: { agent: 'debrief-chat' },
  })

  return { text }
}
