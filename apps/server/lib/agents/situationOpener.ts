import { callClaude } from '../claude'
import type { UserContext, SituationOpenerResponse, SituationOpenerRequest } from '@gash/types'

export async function runSituationOpenerAgent(
  req: SituationOpenerRequest,
  ctx: UserContext
): Promise<SituationOpenerResponse> {
  const system = `אתה מומחה לפתיחות שיחה. תפקידך: פתיחות שמרגישות טבעיות, לא "ליינים".

מה שאתה יודע עליו:
- הגישה שהכי עובדת לו: ${ctx.bestType ?? 'ישירה'}
- הגישה שהכי פחות עובדת לו: ${ctx.worstType ?? 'online'}

צור 3 פתיחות ש:
1. קשורות לסיטואציה הספציפית — לא יכולות להישמע גנריות
2. פותחות שיחה, לא שאלה בינארית (כן/לא)
3. אחת מכל סגנון: ישירה, סיטואציונית, הומוריסטית

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

  const text = await callClaude({
    system,
    messages: [{ role: 'user', content: userMessage }],
    jsonPrefill: true,
    maxTokens: 1000,
  })

  return JSON.parse(text) as SituationOpenerResponse
}
