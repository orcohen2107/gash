import { callClaude, type ClaudeMessage } from '../claude'
import type { UserContext, DebriefResponse, DebriefRequest } from '@gash/types'

const STEP_1_SYSTEM = (req: DebriefRequest) => `אתה מאמן אישי. המשתמש ביצע גישה שלא הצליחה.

פרטי הפנייה:
- סוג: ${req.approach.approach_type} | פתיחה: "${req.approach.opener ?? ''}" | תגובתה: "${req.approach.response ?? ''}" | כימיה: ${req.approach.chemistry_score ?? 0}/10

אל תגיד "לא נורא". תכיר בזה ישירות ושאל שאלה ממוקדת אחת בלבד:
"אוקיי, לא הלך. [שאלה: מה הרגשת בשנייה שפתחת? / מה חשבת כשהיא הגיבה?]"

משפט אחד בלבד. לא ניתוח. רק השאלה.`

const STEP_2_SYSTEM = (ctx: UserContext) => `אתה מאמן. ראית את הגישה הכושלת ואת תשובת המשתמש לשאלתך.

מה שאתה יודע עליו: הכי מוצלח ב-${ctx.bestType ?? 'direct'} (${ctx.bestRate ?? 0}%).

תן:
1. אבחנה ספציפית — מה גרם לכישלון (תזמון / פתיחה / אנרגיה / סיטואציה)
2. משימה אחת קונקרטית — "בפעם הבאה ש...תנסה..."

סגנון: מאמן, לא מטפל. ישיר. מנחה קדימה. עברית קצרה.`

export async function runDebriefAgent(
  req: DebriefRequest,
  ctx: UserContext
): Promise<DebriefResponse> {
  if (req.debriefStep === 1) {
    const text = await callClaude({
      system: STEP_1_SYSTEM(req),
      messages: [{ role: 'user', content: 'ביצעתי גישה שלא הלכה' }],
      maxTokens: 200,
    })
    return { text, debriefComplete: false }
  }

  const messages: ClaudeMessage[] = req.messages ?? []
  const text = await callClaude({
    system: STEP_2_SYSTEM(ctx),
    messages,
    maxTokens: 400,
  })
  return { diagnosis: text, mission: '', debriefComplete: true }
}
