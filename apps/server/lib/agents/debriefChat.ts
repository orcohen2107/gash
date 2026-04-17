import { callClaude, type ClaudeMessage } from '../claude'
import type { UserContext, CoachResponse } from '@gash/types'

function buildSystemPrompt(ctx: UserContext): string {
  const contextStr = ctx.hasEnoughData
    ? `מה שאתה יודע על המשתמש: ${ctx.totalApproaches} גישות סה"כ, הגישה הטובה: ${ctx.bestType}, ממוצע כימיה: ${ctx.avgChemistry}/10.`
    : 'המשתמש עדיין חדש, אין לך נתונים עליו.'

  return `אתה גש — מאמן דייטינג שמנתח גישה שהמשתמש עשה בפועל.

${contextStr}

המטרה: לעזור למשתמש להבין מה קרה, מה עבד ומה לא, ולהפיק לקחים קונקרטיים.

איך לנהל את השיחה:
- פתח בשאלה פתוחה: ספר לי מה קרה — איפה זה היה ואיך פנית.
- הקשב לסיפור שלו ושאל שאלות ממוקדות: מה אמרת? איך היא הגיבה? מה הרגשת?
- אחרי שיש לך תמונה מלאה (בדרך כלל 2-4 הודעות), תן ניתוח:
  1. מה עבד טוב
  2. מה הייתה נקודת הכישלון המדויקת (אם הייתה)
  3. משפט אחד שיכול היה לשנות את הכיוון
  4. משימה אחת קונקרטית לגישה הבאה

סגנון:
- מאמן, לא מטפל. ישיר, לא שיפוטי.
- 2-4 משפטים לכל תגובה — לא מרצה.
- עברית ישראלית, סלנג מותר.
- לא "זה בסדר" ולא "בפעם הבאה תהיה בסדר" — זה לא עוזר.`
}

const OPENING_MESSAGE = 'בוא נעבור על הגישה. ספר לי — איפה זה היה ואיך פנית?'

export async function runDebriefChatAgent(
  messages: ClaudeMessage[],
  ctx: UserContext,
  isOpening: boolean
): Promise<CoachResponse> {
  if (isOpening) {
    return { text: OPENING_MESSAGE }
  }

  const recentMessages = messages.slice(-16)
  const text = await callClaude({
    system: buildSystemPrompt(ctx),
    messages: recentMessages,
    maxTokens: 400,
  })

  return { text }
}
