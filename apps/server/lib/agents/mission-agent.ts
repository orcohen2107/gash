import { CLAUDE_MODEL_HAIKU } from '@gash/constants'
import { z } from 'zod'
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

const MissionResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  target: z.number(),
  target_approach_type: z.enum(['direct', 'situational', 'humor', 'online']),
})

export async function runMissionAgent(userContext: UserContext): Promise<MissionResponse> {
  const worstType = userContext.worstType || 'direct'
  const successRate = userContext.successRate || 0
  const fallback: MissionResponse = {
    title: 'גישה אחת ממוקדת',
    description: 'נסה השבוע גישה אחת בסגנון שאתה פחות מתרגל, ותעד מה אמרת ומה הייתה התגובה.',
    target: 1,
    target_approach_type: worstType,
  }

  const systemPrompt = `
אתה מאמן דייטינג מנוסה.
על סמך נתוני המשתמש, הצע משימה שבועית אחת בעברית.
הנתונים:
- סוג הגישה החלש ביותר: ${worstType}
- שיעור הצלחה כללי: ${successRate}%
- סך הגישות: ${userContext.totalApproaches}

בחר target_approach_type אחד בלבד מתוך: direct, situational, humor, online.
המשימה צריכה להיות קצרה, ברת ביצוע, מדידה, וקשורה לנקודת החולשה.
אל תכתוב משהו כללי כמו "תעבוד על ביטחון". כתוב פעולה שהוא יכול לבצע השבוע.
החזר JSON בלבד במבנה:
{"title": "כותרת בעברית קצרה", "description": "תיאור מעשי", "target": 3, "target_approach_type": "direct"}
`

  return callClaudeJSON({
    model: CLAUDE_MODEL_HAIKU,
    system: systemPrompt,
    messages: [{ role: 'user', content: 'צור משימה שבועית' }],
    maxTokens: 400,
    schema: MissionResponseSchema,
    fallback,
    logContext: { agent: 'mission' },
  })
}
