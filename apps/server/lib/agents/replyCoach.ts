import { callClaude } from '../claude'
import type { UserContext, ReplyCoachResponse, ReplyCoachRequest } from '@gash/types'
import { CLAUDE_MODEL_SONNET } from '@gash/constants'

function buildThreadContext(req: ReplyCoachRequest): string {
  if (req.thread && req.thread.length > 0) {
    const lines = req.thread.map((m) => `${m.sender}: "${m.text}"`).join('\n')
    return `השיחה המלאה (מהישנה לחדשה):\n${lines}`
  }
  return `ההודעה שקיבלתי: "${req.herMessage ?? ''}"`
}

export async function runReplyCoachAgent(
  req: ReplyCoachRequest,
  ctx: UserContext
): Promise<ReplyCoachResponse> {
  const contextBlock = req.context
    ? `הקשר:\n- איפה הכרנו: ${req.context.where ?? 'לא ידוע'}\n- כמה זמן מדברים: ${req.context.duration ?? 'לא ידוע'}\n- מה אני רוצה להשיג: ${req.context.goal ?? 'לא ידוע'}`
    : ''

  const system = `אתה מנתח שיחות ומאמן תגובות. תפקידך: לנתח מה שקיבלתי ולתת לי 3 תגובות מוכנות לשליחה.

מה שאתה יודע עליי:
- הגישה שעובדת לי: ${ctx.bestType ?? 'ישירה'}
- סגנון שמתאים לי: ${ctx.userStyle ?? 'ישיר'}

קודם נתח את ההודעה שלה (בשקט, לא בפלט):
- מה הטון? (חם / ניטרלי / מרוחק / משחקת / בוחנת)
- מה הכוונה? (מתעניינת / עונה מנימוס / פותחת / סוגרת)
- מה רמת האנרגיה? (גבוהה / בינונית / נמוכה)
- האם יש איתות חיובי? מה הוא?

אחרי הניתוח, תן 3 תגובות:
1. מצחיקה/קלילה — שוברת קרח, לא מנסה יותר מדי
2. סקרנית/מעניינת — פותחת שיחה, שואלת משהו חכם
3. ישירה/בטוחה — מקדמת לפגישה, בלי לשאול "רוצה לצאת?"

כל תגובה: מוכנה לשליחה, 1-2 משפטים, בעברית דבורה ישראלית.

החזר JSON בלבד:
{
  "analysis": { "tone": "...", "intent": "...", "signal": "חיובי|ניטרלי|שלילי", "summary": "..." },
  "replies": [
    { "style": "מצחיקה", "text": "...", "why": "..." },
    { "style": "סקרנית", "text": "...", "why": "..." },
    { "style": "ישירה", "text": "...", "why": "..." }
  ],
  "warning": null
}`

  const userMessage = [buildThreadContext(req), contextBlock].filter(Boolean).join('\n\n')

  const text = await callClaude({
    model: CLAUDE_MODEL_SONNET,
    system,
    messages: [{ role: 'user', content: userMessage }],
    jsonPrefill: true,
    maxTokens: 1500,
  })

  return JSON.parse(text) as ReplyCoachResponse
}
