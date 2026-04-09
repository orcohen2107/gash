import { callClaude } from '../claude'
import type { UserContext, ApproachFeedbackResponse, ApproachFeedbackRequest } from '@gash/types'

export async function runApproachFeedbackAgent(
  req: ApproachFeedbackRequest,
  ctx: UserContext
): Promise<ApproachFeedbackResponse> {
  const { approach } = req
  const typeRate = ctx.typeSuccessRates?.[approach.approach_type] ?? 0
  const isAboveAverage = (approach.chemistry_score ?? 0) > Number(ctx.avgChemistry ?? 0)

  const system = `המשתמש זה עתה ביצע פנייה. תפקידך: פידבק קצר, ישיר, שמלמד משהו.

פרטי הפנייה:
- סוג גישה: ${approach.approach_type}
- מה הוא אמר/עשה: "${approach.opener ?? 'לא תועד'}"
- תגובתה: "${approach.response ?? 'לא תועדה'}"
- ציון כימיה שנתן: ${approach.chemistry_score ?? 'לא דורג'}/10
- תוצאה: ${approach.follow_up ?? 'לא ידוע'}

הקשר של המשתמש:
- סה"כ פניות: ${ctx.totalApproaches ?? 0}
- הצלחה ממוצעת שלו בגישה ${approach.approach_type}: ${typeRate}%
- האם זו הצלחה ביחס לרגיל שלו? ${isAboveAverage ? 'מעל הממוצע' : 'מתחת לממוצע'}

כתוב פידבק שעוזר לו ללמוד. לא מחמיא לשווא, לא מדכא — כמו מאמן טוב.

החזר JSON בלבד:
{
  "feedback": "...",
  "tip": "...",
  "emoji": "🔥|👍|💡|📈"
}`

  const text = await callClaude({
    system,
    messages: [{ role: 'user', content: 'תן לי פידבק על הפנייה' }],
    jsonPrefill: true,
    maxTokens: 500,
  })

  return JSON.parse(text) as ApproachFeedbackResponse
}
