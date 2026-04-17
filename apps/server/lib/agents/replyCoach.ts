import { z } from 'zod'
import { callClaudeJSON } from '../claude'
import type { UserContext, ReplyCoachResponse, ReplyCoachRequest } from '@gash/types'
import { CLAUDE_MODEL_SONNET } from '@gash/constants'

const ReplyCoachResponseSchema = z.object({
  analysis: z.object({
    tone: z.string(),
    intent: z.string(),
    signal: z.enum(['חיובי', 'ניטרלי', 'שלילי']),
    summary: z.string(),
  }),
  replies: z.tuple([
    z.object({ style: z.string(), text: z.string(), why: z.string() }),
    z.object({ style: z.string(), text: z.string(), why: z.string() }),
    z.object({ style: z.string(), text: z.string(), why: z.string() }),
  ]),
  warning: z.string().nullable(),
})

const FALLBACK_REPLY_COACH_RESPONSE: ReplyCoachResponse = {
  analysis: {
    tone: 'לא ברור',
    intent: 'צריך עוד הקשר',
    signal: 'ניטרלי',
    summary: 'אין מספיק מידע לניתוח עמוק, אז עדיף לענות קצר ובטוח.',
  },
  replies: [
    { style: 'מצחיקה', text: 'חח אוקיי, זה נשמע שיש פה סיפור. תני לי את הגרסה המלאה.', why: 'פותח שיחה בלי לחץ.' },
    { style: 'סקרנית', text: 'מעניין, למה דווקא ככה?', why: 'מזמין אותה להרחיב.' },
    { style: 'ישירה', text: 'זורם לי להמשיך את זה פנים מול פנים. קפה קצר השבוע?', why: 'מקדם לפגישה בלי להתחנן.' },
  ],
  warning: null,
}

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
- הגישה שעובדת לי: ${ctx.bestTypeLabel ?? ctx.bestType ?? 'ישירה'}
- סגנון שמתאים לי: ${ctx.userStyle ?? 'ישיר'}
- ראיה אישית: ${ctx.bestEvidence ?? 'אין מספיק נתונים'}

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
אל תיתן תגובות גנריות כמו "מה נשמע" אם יש דרך להשתמש בהקשר. אם אין מספיק הקשר, תגיד זאת ב-warning.

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

  return callClaudeJSON({
    model: CLAUDE_MODEL_SONNET,
    system,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 1500,
    schema: ReplyCoachResponseSchema,
    fallback: FALLBACK_REPLY_COACH_RESPONSE,
    logContext: { agent: 'reply-coach' },
  })
}
