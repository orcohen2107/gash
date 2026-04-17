import { z } from 'zod'
import { callClaudeJSON } from '../claude'
import type { UserContext, SituationOpenerResponse, SituationOpenerRequest } from '@gash/types'

const OpenerSchema = z.object({
  style: z.string(),
  text: z.string(),
  followUp: z.string(),
})

const SituationOpenerResponseSchema = z.object({
  openers: z.tuple([OpenerSchema, OpenerSchema, OpenerSchema]),
  tip: z.string(),
})

const FALLBACK_SITUATION_OPENER: SituationOpenerResponse = {
  openers: [
    { style: 'ישירה', text: 'היי, זה קצת אקראי, אבל היית נראית לי מעניינת אז באתי להגיד שלום.', followUp: 'איך עובר לך היום?' },
    { style: 'סיטואציונית', text: 'אני מנסה להבין אם המקום הזה תמיד ככה או שנפלתי על רגע מיוחד.', followUp: 'את מכירה פה טוב?' },
    { style: 'הומוריסטית', text: 'יש לי תחושה שאני עומד לקבל פה המלצה טובה או מבט מוזר. מה הסיכוי שלי?', followUp: 'מה היית ממליצה?' },
  ],
  tip: 'פתח רגוע, ואז תמשיך לפי התגובה שלה במקום לדחוף עוד משפטים מוכנים.',
}

export async function runSituationOpenerAgent(
  req: SituationOpenerRequest,
  ctx: UserContext
): Promise<SituationOpenerResponse> {
  const system = `אתה מומחה לפתיחות שיחה. תפקידך: פתיחות שמרגישות טבעיות, לא "ליינים".

מה שאתה יודע עליו:
- הגישה שהכי עובדת לו: ${ctx.bestTypeLabel ?? ctx.bestType ?? 'ישירה'}
- הגישה שהכי פחות עובדת לו: ${ctx.worstTypeLabel ?? ctx.worstType ?? 'אונליין'}
- ראיה אישית: ${ctx.bestEvidence ?? 'אין מספיק נתונים'}
- דפוס מקום: ${ctx.locationPattern ?? 'אין דפוס מקום מובהק'}

צור 3 פתיחות ש:
1. קשורות לסיטואציה הספציפית — לא יכולות להישמע גנריות
2. פותחות שיחה, לא שאלה בינארית (כן/לא)
3. אחת מכל סגנון: ישירה, סיטואציונית, הומוריסטית
4. אם יש סגנון שעובד לו טוב, תן לו עדיפות בניסוח אבל עדיין החזר את שלושת הסגנונות.

החזר JSON בלבד:
{
  "openers": [
    { "style": "ישירה", "text": "...", "followUp": "..." },
    { "style": "סיטואציונית", "text": "...", "followUp": "..." },
    { "style": "הומוריסטית", "text": "...", "followUp": "..." }
  ],
  "tip": "..."
}`

  const userMessage = `סיטואציה: ${req.situation}${req.context ? `\nהקשר: ${req.context}` : ''}`

  return callClaudeJSON({
    system,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 1000,
    schema: SituationOpenerResponseSchema,
    fallback: FALLBACK_SITUATION_OPENER,
    logContext: { agent: 'situation-opener' },
  })
}
