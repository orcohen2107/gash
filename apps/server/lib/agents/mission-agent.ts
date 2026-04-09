import { CLAUDE_MODEL_HAIKU } from '@gash/constants'
import { callClaudeJSON } from '../claude'
import type { ApproachType } from '@gash/types'

interface UserContext {
  totalApproaches: number
  successRate: number
  avgChemistry: number
  bestType: ApproachType | null
  worstType: ApproachType | null
}

export interface MissionResponse {
  title: string
  description: string
  target: number
  target_approach_type: ApproachType
}

export async function runMissionAgent(userContext: UserContext): Promise<MissionResponse> {
  const worstType = userContext.worstType || 'direct'
  const successRate = userContext.successRate || 0

  const systemPrompt = `
אתה מיועץ דייטינג מנוסה.
על סמך ההתאמות של המשתמש, הצע משימה שבועית אחת בעברית.
הנתונים:
- סוג הגישה החלש ביותר: ${worstType}
- שיעור הצלחה כללי: ${successRate}%
- סך הגישות: ${userContext.totalApproaches}

הנח בחירה פרטי של אחד מהסוגים הבאים ריב(direct, situational, humor, online).
המשימה צריכה להיות קצרה, בר-הישג, והעובדות היא טיפול לנקודה החלשה.
הנח בטקסט בעברית טבע בלבד.
הנח JSON עם המבנה: {"title": "כותרת בעברית קצרה", "description": "תיאור הנ מילולי", "target": 3, "target_approach_type": "direct/situational/humor/online"}
`

  try {
    const response = await callClaudeJSON<MissionResponse>(systemPrompt, CLAUDE_MODEL_HAIKU)

    return {
      title: response.title || 'משימה שבועית',
      description: response.description || 'שדר לפחות 3 גישות השבוע',
      target: response.target || 3,
      target_approach_type:
        (response.target_approach_type as ApproachType) || 'direct',
    }
  } catch (err) {
    console.error('Mission agent error:', err)
    // Return default mission
    return {
      title: 'שדר גישה אחת',
      description: 'נסה לשדר משימה אחת חדשה השבוע בסוג שאתה מתקשה בו',
      target: 1,
      target_approach_type: worstType,
    }
  }
}
