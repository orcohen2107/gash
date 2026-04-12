import { callClaude } from '@/lib/claude'
import { buildUserContext } from '@/lib/build-user-context'
import { logger } from '@/lib/logger'

export interface InsightResponse {
  insights: string[]
  weeklyMission: {
    title: string
    description: string
    target: number
  }
}

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

דוגמה לתובנה טובה: "גישות ישירות מעניקות לך שיעור הצלחה גבוה יותר - המשך בזה"
דוגמה למשימה טובה: { title: "נסה גישה חדשה", description: "נסה את הסוג שטרם שיחקת בו", target: 1 }

ענה בJSON בלבד, בלי טקסט נוסף.`

  try {
    const raw = await callClaude({ system: systemPrompt, messages: [{ role: 'user', content: 'Generate insights based on approach patterns' }], jsonPrefill: true })
    const response: InsightResponse = JSON.parse(raw)
    return response
  } catch (err) {
    logger.error('agent.insights_failed', { userId, error: err })
    return {
      insights: [
        'המשך לתעד גישות כדי לקבל תובנות מעמיקות',
      ],
      weeklyMission: {
        title: 'המשך בקיום',
        description: 'תעד גישה נוספת השבוע',
        target: 1,
      },
    }
  }
}
