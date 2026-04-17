import { z } from 'zod'
import { callClaudeJSON } from '../claude'
import type { UserContext, ApproachFeedbackResponse, ApproachFeedbackRequest } from '@gash/types'

const ApproachFeedbackResponseSchema = z.object({
  feedback: z.string(),
  tip: z.string(),
  emoji: z.enum(['🔥', '👍', '💡', '📈']),
})

const FALLBACK_APPROACH_FEEDBACK: ApproachFeedbackResponse = {
  feedback: 'קח מזה למידה אחת ברורה: תעד מה אמרת ומה הייתה התגובה, ואז בפעם הבאה נשפר נקודה אחת בלבד.',
  tip: 'בפנייה הבאה תתמקד במשפט פתיחה קצר ואז שאלה אחת שממשיכה את הסיטואציה.',
  emoji: '💡',
}

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
- דפוס אישי רלוונטי: ${ctx.recentPattern ?? 'אין עדיין מספיק דפוס'}
- חולשה ידועה: ${ctx.weaknessEvidence ?? 'אין מספיק נתונים'}

כתוב פידבק שעוזר לו ללמוד. לא מחמיא לשווא, לא מדכא — כמו מאמן טוב.
הפידבק חייב להתייחס לפרט אחד מהפנייה עצמה או מהדפוס האישי. אל תכתוב מחמאה כללית.

החזר JSON בלבד:
{
  "feedback": "...",
  "tip": "...",
  "emoji": "🔥|👍|💡|📈"
}`

  return callClaudeJSON({
    system,
    messages: [{ role: 'user', content: 'תן לי פידבק על הפנייה' }],
    maxTokens: 500,
    schema: ApproachFeedbackResponseSchema,
    fallback: FALLBACK_APPROACH_FEEDBACK,
    logContext: { agent: 'approach-feedback' },
  })
}
