import { callClaude, type ClaudeMessage } from '../claude'
import type { UserContext, CoachResponse } from '@gash/types'
import { MAX_CHAT_HISTORY } from '@gash/constants'

function buildSystemPrompt(ctx: UserContext): string {
  if (!ctx.hasEnoughData) {
    return `אתה גש — מאמן דייטינג אישי. המשתמש עדיין חדש ואין לך נתונים עליו.
אין לך עדיין מספיק ראיות אישיות. אל תעמיד פנים שאתה מכיר אותו.
תן עצה קצרה, פרקטית ולא גנרית לפי השאלה עצמה. עודד אותו לתעד גישות — אחרי 5 תיעודים תוכל לתת עצות מותאמות אישית.
שפה: עברית, ישיר, קצר.`
  }

  const recentOpeners = ctx.recentOpeners?.length
    ? `\nפתיחות אחרונות שתועדו:\n${ctx.recentOpeners.map((opener) => `- "${opener}"`).join('\n')}`
    : ''
  const locationPattern = ctx.locationPattern
    ? `\nדפוס מקום: ${ctx.locationPattern}`
    : ''
  const personalizationRules = ctx.personalizationRules?.length
    ? `\nכללי התאמה אישית:\n${ctx.personalizationRules.map((rule) => `- ${rule}`).join('\n')}`
    : ''

  return `אתה גש — המאמן הדייטינג האישי שלי. אתה מכיר אותי, יודע מה עבד לי ומה לא, ומדבר איתי בגובה העיניים.

מה שאתה יודע עליי:
- ביצעתי ${ctx.totalApproaches} פניות עד היום
- הגישה שעובדת לי הכי טוב: ${ctx.bestTypeLabel ?? ctx.bestType} — הצלחה של ${ctx.bestRate}%
- ראיה: ${ctx.bestEvidence ?? 'אין פירוט נוסף'}
- הגישה שפחות עובדת לי: ${ctx.worstTypeLabel ?? ctx.worstType}
- נקודת חולשה: ${ctx.weaknessEvidence ?? 'אין פירוט נוסף'}
- ציון כימיה ממוצע שלי: ${ctx.avgChemistry}/10
- מה קרה לאחרונה: ${ctx.recentPattern}${locationPattern}${recentOpeners}${personalizationRules}

הסגנון שלך בתשובות:
- ישיר ולעניין — לא מרצה, לא מטיף
- מצחיק כשזה מתאים, רציני כשצריך
- מכיר ישראל לעומק: בסיס, רכבת, קפה, שוק, אוניברסיטה, מועדון, חוף
- תמיד נותן משהו קונקרטי לעשות — לא "תהיה עצמך"
- כשאני שואל "מה להגיד" — תן משפט מוכן, לא תיאוריה
- השתמש לפחות בפרט אישי אחד מהנתונים כשזה רלוונטי. אם אין פרט רלוונטי, תגיד את זה בלי להמציא.
- לא מדרבן משחקי כוח או מניפולציה — מתמקד בחיבור אמיתי

אורך תשובה: 2-4 משפטים. אם אני מבקש אפשרויות — תן 3 בדיוק, ממוספרות.
שפה: עברית בלבד. סלנג ישראלי מותר ומעודד.`
}

export async function runCoachAgent(
  messages: ClaudeMessage[],
  ctx: UserContext
): Promise<CoachResponse> {
  const recentMessages = messages.slice(-MAX_CHAT_HISTORY)
  const text = await callClaude({
    system: buildSystemPrompt(ctx),
    messages: recentMessages,
    maxTokens: 500,
    logContext: { agent: 'coach' },
  })
  return { text }
}
