import { callClaude, type ClaudeMessage } from '../claude'
import type { CoachResponse, UserContext } from '@gash/types'

const SCENARIOS = [
  'בתחנת אוטובוס — היא עומדת ומסתכלת בטלפון, ממתינה לאוטובוס',
  'בקפה — היא יושבת לבד עם ספר ולוגמת קפה',
  'בסופרמרקט — היא עומדת ליד מדף ובוחרת מוצרים',
  'ברכבת — היא יושבת לידך ומסתכלת על מסך',
  'בפארק — היא יוצאת לריצה ועוצרת לשתות מים',
  'בגלריה / מוזיאון — היא מסתכלת על תמונה',
  'במסיבה — היא עומדת עם חברה, שניהן צוחקות',
  'בחוף — היא שוכבת על מגבת ומסתכלת לים',
]

function pickScenario(): string {
  return SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]
}

function buildOpeningMessage(scenario: string): string {
  return `*סיטואציה: ${scenario}*\n\nאתה רואה אותה. הגש.`
}

function buildSystemPrompt(ctx: UserContext, scenario: string): string {
  const personalHint = ctx.hasEnoughData
    ? `\n\nהערה פנימית: הסגנון שהכי עובד לו הוא "${ctx.bestTypeLabel ?? ctx.bestType}" (${ctx.bestEvidence ?? 'אין פירוט'}). בפידבק, השתמש בזה רק אם זה באמת רלוונטי למה שקרה בשיחה.`
    : ''

  return `אתה משחק תפקיד של בחורה ישראלית בת 22-28 בסיטואציה הבאה:
${scenario}

חוקים קשיחים:
- אתה בחורה בסיטואציה, לא מאמן. אל תשבור דמות תוך כדי השיחה.
- הגב באופן ריאליסטי — לפעמים חמה, לפעמים ניטרלית, לפעמים ממהרת.
- תגובות קצרות כמו בשיחה אמיתית: 1-3 משפטים.
- אל תתנדב יותר מדי מידע. תן לו להוביל.
- אם הפנייה מביכה, לחוצה או לא מתאימה לסיטואציה — הגב בקור רוח או חתוך.
- אם הפנייה טובה — אפשר להיות חמה, מעוניינת ופתוחה.

כשהמשתמש כותב "סיום", "מספיק", "תן פידבק", "stop" או "פידבק" — צא מהדמות ותן:
1. מה עבד
2. מה פחות עבד
3. טיפ אחד לפעם הבאה
4. ציון קצר: מצוין / טוב / יש מה לשפר${personalHint}

שפה: עברית בלבד.`
}

function extractScenario(messages: ClaudeMessage[]): string {
  const firstAssistant = messages.find((message) => message.role === 'assistant')
  const scenarioMatch = firstAssistant?.content.match(/\*סיטואציה: (.+?)\*/)
  return scenarioMatch?.[1] ?? SCENARIOS[0]
}

export async function runPracticeAgent(
  messages: ClaudeMessage[],
  ctx: UserContext,
  isOpening: boolean
): Promise<CoachResponse & { scenario?: string }> {
  if (isOpening) {
    const scenario = pickScenario()
    return { text: buildOpeningMessage(scenario), scenario }
  }

  const scenario = extractScenario(messages)
  const text = await callClaude({
    system: buildSystemPrompt(ctx, scenario),
    messages: messages.slice(-20),
    maxTokens: 300,
    logContext: { agent: 'practice' },
  })

  return { text }
}
