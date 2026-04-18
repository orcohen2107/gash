import { callClaude, type ClaudeMessage } from '../claude'
import type { UserContext, CoachResponse } from '@gash/types'

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

function buildSystemPrompt(ctx: UserContext, scenario: string): string {
  const bestTypeHint = ctx.hasEnoughData && ctx.bestType
    ? `\n\nהערה פנימית: הגישה שהכי עובדת למשתמש זה היא "${ctx.bestType}". בסוף הסשן, התייחס לזה בפידבק.`
    : ''

  return `אתה משחק תפקיד של בחורה ישראלית בת 22-28 בסיטואציה הבאה:
**${scenario}**

חוקים קשיחים:
- אתה בחורה, לא מאמן. אל תשבור דמות תוך כדי שיחה.
- הגב באופן ריאליסטי — לפעמים חמה, לפעמים ניטרלית, לפעמים ממהרת. לא קל מדי ולא בלתי אפשרי.
- תגובות קצרות כמו שבחורה אמיתית מדברת — 1-3 משפטים.
- סלנג ישראלי טבעי, לא ספרותי.
- אל תתנדב יותר מדי מידע — תן לו לעבוד על השיחה.
- אם הפנייה גרועה (מביכה, עצבנית, לא מתאימה לסיטואציה) — הגב בקור רוח או חתוך. זה ריאליסטי.
- אם הפנייה טובה — אפשר להיות חמה, מעוניינת, פתוחה.

סיום הסשן:
כשהמשתמש כותב "סיום", "מספיק", "תן פידבק", "stop", "פידבק" — יצא מהדמות ותן פידבק כמאמן:
1. מה עבד טוב (פתיחה, אנרגיה, תגובה לאתגרים)
2. מה פחות עבד ולמה
3. טיפ ספציפי אחד לפעם הבאה
4. ציון קצר (🔥 מצוין / 👍 טוב / 💡 יש מה לשפר)${bestTypeHint}

שפה: עברית בלבד.`
}

function buildOpeningMessage(scenario: string): string {
  return `*סיטואציה: ${scenario}*\n\nאתה רואה אותה. הגש!`
}

export async function runPracticeAgent(
  messages: ClaudeMessage[],
  ctx: UserContext,
  isOpening: boolean
): Promise<CoachResponse> {
  if (isOpening) {
    const scenario = pickScenario()
    return { text: buildOpeningMessage(scenario) }
  }

  // Extract scenario from first assistant message if available
  const firstAssistant = messages.find((m) => m.role === 'assistant')
  const scenarioMatch = firstAssistant?.content.match(/\*סיטואציה: (.+?)\*/)
  const scenario = scenarioMatch?.[1] ?? SCENARIOS[0]

  const recentMessages = messages.slice(-20) // more context for roleplay
  const text = await callClaude({
    system: buildSystemPrompt(ctx, scenario),
    messages: recentMessages,
    maxTokens: 300,
  })

  return { text }
}
