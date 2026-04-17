import { z } from 'zod'
import { callClaudeJSON } from '../claude'
import type { InsightsResponse } from '@gash/types'
import type { SupabaseClient } from '@supabase/supabase-js'

const InsightsResponseSchema = z.object({
  insights: z.tuple([z.string(), z.string(), z.string()]),
  weeklyMission: z.object({
    title: z.string(),
    description: z.string(),
    target: z.number(),
    targetType: z.string(),
  }),
  trend: z.enum(['עולה', 'יורד', 'יציב']),
  trendExplanation: z.string(),
})

const FALLBACK_INSIGHTS: InsightsResponse = {
  insights: [
    'המשך לתעד גישות כדי לזהות דפוסים אמיתיים.',
    'ככל שתוסיף יותר פרטים, התובנות יהיו חדות יותר.',
    'התמקד השבוע בפנייה אחת מתועדת היטב במקום בכמות בלבד.',
  ],
  weeklyMission: {
    title: 'תיעוד מדויק',
    description: 'תעד גישה אחת עם פתיחה, תגובה וציון כימיה.',
    target: 1,
    targetType: 'approaches',
  },
  trend: 'יציב',
  trendExplanation: 'אין מספיק מידע עדכני כדי לקבוע שינוי אמיתי.',
}

export async function runInsightsAgent(
  userId: string,
  supabase: SupabaseClient
): Promise<InsightsResponse> {
  const { data: approaches } = await supabase
    .from('approaches')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .limit(30)

  const system = `אתה מנתח דפוסי התנהגות. תפקידך: לזהות מה באמת עובד למשתמש הזה, לא עצות גנריות.

נתוני הגישות (30 אחרונות):
${JSON.stringify(approaches ?? [], null, 2)}

נתח לעומק:
- סוג הגישה עם אחוז ההצלחה הגבוה ביותר
- סוג הגישה עם ציון הכימיה הממוצע הגבוה ביותר
- האם יש דפוס של שעה / יום / מקום בהצלחות?
- מה השתפר בחודש האחרון לעומת לפני?
- מה הנקודה החלשה ביותר שלו עכשיו?

כתוב תובנות שמרגישות אישיות — "אתה" לא "משתמשים". השתמש במספרים מהנתונים.
אם הנתונים לא מספיקים למסקנה מסוימת, כתוב זאת במפורש ולא כהשערה.
בחר משימה שבועית שמתמקדת בנקודה החלשה ביותר. המשימה: קונקרטית, ניתנת לביצוע, מדידה.

החזר JSON בלבד:
{
  "insights": ["...", "...", "..."],
  "weeklyMission": { "title": "...", "description": "...", "target": 3, "targetType": "approaches|direct|humor|situational" },
  "trend": "עולה|יורד|יציב",
  "trendExplanation": "..."
}`

  return callClaudeJSON({
    system,
    messages: [{ role: 'user', content: 'נתח את הנתונים שלי' }],
    maxTokens: 1500,
    schema: InsightsResponseSchema,
    fallback: FALLBACK_INSIGHTS,
    logContext: { agent: 'insights-legacy' },
  })
}
