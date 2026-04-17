import { z } from 'zod'
import { callClaudeJSON } from '@/lib/claude'
import { buildUserContext } from '@/lib/build-user-context'

export interface InsightResponse {
  insights: string[]
  weeklyMission: {
    title: string
    description: string
    target: number
  }
}

const InsightResponseSchema = z.object({
  insights: z.array(z.string()).min(1).max(3),
  weeklyMission: z.object({
    title: z.string(),
    description: z.string(),
    target: z.number(),
  }),
})

export async function runInsightsAgent(userId: string): Promise<InsightResponse> {
  const userContext = await buildUserContext(userId)

  if (userContext.totalApproaches === 0) {
    return {
      insights: [
        'התחל לתעד גישות כדי לקבל תובנות מעמיקות על ההתקדמות שלך',
      ],
      weeklyMission: {
        title: 'תיעוד גישה',
        description: 'תעד גישה אחת לפחות',
        target: 1,
      },
    }
  }

  const systemPrompt = `אתה מנתח דפוסים של גישות התאמה. קיבלת נתונים סטטיסטיים על ${userContext.totalApproaches} גישות של משתמש.

סטטיסטיקה על הגישות:
- סוג מוביל: ${userContext.bestType || 'אין'}
- סוג חלש: ${userContext.worstType || 'אין'}
- שיעור הצלחה כללי: ${userContext.successRate}%
- ממוצע כימיה: ${userContext.avgChemistry}/10
- דפוס אחרון: ${userContext.recentPattern}

המשימה שלך:
1. חלץ 2-3 תובנות קונקרטיות וקשורות לנתונים שלו
2. כל תובנה צריכה להיות בעברית טבעית, בדיוק משפט אחד
3. התובנות צריכות לדבר על כוחות, דפוסים או תחומים לשיפור
4. הצע משימה שבועית קטנה וקונקרטית שמטרתה חיזוק הבטחון
5. השתמש במספר אחד לפחות מתוך הנתונים. אם אין מספיק נתונים למסקנה, כתוב את זה במקום להמציא.

דוגמה לתובנה טובה: "גישות ישירות מעניקות לך שיעור הצלחה גבוה יותר - המשך בזה"
דוגמה למשימה טובה: { title: "נסה גישה חדשה", description: "נסה את הסוג שטרם שיחקת בו", target: 1 }

ענה בJSON בלבד, בלי טקסט נוסף.`

  return callClaudeJSON({
    system: systemPrompt,
    messages: [{ role: 'user', content: 'נתח את דפוסי הגישות שלי' }],
    maxTokens: 900,
    schema: InsightResponseSchema,
    fallback: {
      insights: [
        'המשך לתעד גישות כדי לקבל תובנות מעמיקות יותר על מה שעובד לך.',
      ],
      weeklyMission: {
        title: 'תיעוד גישה',
        description: 'תעד גישה אחת השבוע עם פתיחה, תגובה וציון כימיה.',
        target: 1,
      },
    },
    logContext: { agent: 'insights', userId },
  })
}
