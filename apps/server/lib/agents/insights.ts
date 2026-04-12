import { callClaude } from '../claude'
import type { InsightsResponse } from '@gash/types'
import type { SupabaseClient } from '@supabase/supabase-js'

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
בחר משימה שבועית שמתמקדת בנקודה החלשה ביותר. המשימה: קונקרטית, ניתנת לביצוע, מדידה.

החזר JSON בלבד:
{
  "insights": ["...", "...", "..."],
  "weeklyMission": { "title": "...", "description": "...", "target": 3, "targetType": "approaches|direct|humor|situational" },
  "trend": "עולה|יורד|יציב",
  "trendExplanation": "..."
}`

  const text = await callClaude({
    system,
    messages: [{ role: 'user', content: 'נתח את הנתונים שלי' }],
    jsonPrefill: true,
    maxTokens: 1500,
  })

  return JSON.parse(text) as InsightsResponse
}
