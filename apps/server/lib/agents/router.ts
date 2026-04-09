type Intent = 'boost' | 'reply-coach' | 'situation-opener' | 'coach'

const BOOST_PATTERNS = [
  /עומד לפנות/,
  /הולך לדבר/,
  /הולך לפנות/,
  /עכשיו אפנה/,
  /עכשיו אדבר/,
  /עומד לדבר/,
]

const REPLY_COACH_PATTERNS = [
  /היא שלחה/,
  /קיבלתי ממנה/,
  /ענתה לי/,
  /כתבה לי/,
  /הגיבה לי/,
  /מה להגיד לה/,
  /מה לענות/,
]

const SITUATION_OPENER_PATTERNS = [
  /תן לי פתיחה/,
  /מה לפתוח/,
  /איך לפתוח שיחה/,
  /פתיחה ל/,
  /איך להתחיל שיחה/,
]

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

export function detectIntent(message: string): Intent {
  if (matchesAny(message, BOOST_PATTERNS)) return 'boost'
  if (matchesAny(message, REPLY_COACH_PATTERNS)) return 'reply-coach'
  if (matchesAny(message, SITUATION_OPENER_PATTERNS)) return 'situation-opener'
  return 'coach'
}
