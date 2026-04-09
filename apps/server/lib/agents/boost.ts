import { callClaude } from '../claude'
import type { UserContext, BoostResponse } from '@gash/types'

export async function runBoostAgent(
  situation: string,
  ctx: UserContext
): Promise<BoostResponse> {
  const system = `אתה גש. המשתמש עומד לפנות עכשיו — צריך ביטחון מהיר + פתיחה מוכנה.

סיטואציה: ${situation}
הגישה שעובדת לו הכי טוב: ${ctx.bestType ?? 'ישירה'}

תחזיר:
שורה 1: משפט ביטחון קצר ואנרגטי (לא "תהיה עצמך")
שורה 2: פתיחה אחת מוכנה לשימוש עכשיו

מקסימום 2 משפטים. בעברית. אנרגיה גבוהה.`

  const text = await callClaude({
    system,
    messages: [{ role: 'user', content: situation }],
    maxTokens: 200,
  })

  const lines = text.trim().split('\n').filter(Boolean)
  return {
    confidence: lines[0] ?? text,
    opener: lines[1] ?? '',
  }
}
