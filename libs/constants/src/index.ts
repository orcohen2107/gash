import type { ApproachType, FollowUpType } from '@gash/types'

export const APPROACH_TYPE_LABELS: Record<ApproachType, string> = {
  direct: 'ישיר',
  situational: 'סיטואציונלי',
  humor: 'הומוריסטי',
  online: 'אונליין',
}

export const FOLLOW_UP_LABELS: Record<FollowUpType, string> = {
  meeting: 'דייט / פגישה',
  text: 'הודעה',
  instagram: 'אינסטגרם',
  nothing: 'כלום',
  phone: 'מספר טלפון',
  instant: 'באותו הרגע — ניצוץ / משהו קרה',
  coffee: 'ישבנו לקפה',
  kiss: 'נישקתי',
  went_home: 'הלכנו הביתה',
}

export const CHEMISTRY_LABELS: Record<number, string> = {
  1: 'ממש לא',
  2: 'לא כל כך',
  3: 'מעט',
  4: 'קצת',
  5: 'בסדר',
  6: 'נחמד',
  7: 'טוב',
  8: 'מצויין',
  9: 'מדהים',
  10: 'אש!',
}

export const HEBREW_LABELS = {
  coach: 'מאמן',
  log: 'תיעוד',
  journal: 'יומן',
  dashboard: 'דשבורד',
  tips: 'טיפים',
  send: 'שלח',
  save: 'שמור',
  cancel: 'ביטול',
  delete: 'מחק',
  edit: 'ערוך',
  loading: 'טוען...',
  error: 'שגיאה',
  retry: 'נסה שוב',
  phone: 'מספר טלפון',
  otp: 'קוד אימות',
  verifyPhone: 'אמת מספר',
  sendCode: 'שלח קוד',
  enterCode: 'הזן קוד',
  resendCode: 'שלח שוב',
  welcomeBack: 'ברוך הבא בחזרה',
  startCoaching: 'התחל אימון',
  typeMessage: 'כתוב הודעה...',
  noApproaches: 'עדיין אין גישות מתועדות',
  addFirstApproach: 'הוסף את הגישה הראשונה שלך',
  dateLabel: 'תאריך',
  locationLabel: 'מיקום',
  approachTypeLabel: 'סוג גישה',
  openerLabel: 'פתיחה',
  responseLabel: 'תגובה',
  chemistryLabel: 'כימיה',
  followUpLabel: 'תוצאה',
  notesLabel: 'הערות',
} as const

export const SERVER_URL_DEFAULT = 'http://localhost:3001'

export const CLAUDE_MODEL_HAIKU = 'claude-haiku-4-5-20251001'
export const CLAUDE_MODEL_SONNET = 'claude-sonnet-4-6'

export const MAX_CHAT_HISTORY = 15
export const MIN_APPROACHES_FOR_INSIGHTS = 5
export const INSIGHTS_REFRESH_HOURS = 24
export const LOW_CHEMISTRY_DEBRIEF_THRESHOLD = 4

export interface Tip {
  id: string
  title: string
  description: string
  category: 'ביטחון' | 'אישור' | 'זיהוי' | 'ליווי'
  emoji: string
}

export const TIPS: Tip[] = [
  {
    id: 'confidence-body-language',
    title: 'שפת גוף',
    description: 'עמוד זקוף, מבט ישיר, לחייך. זה יגיד יותר מ-1000 מילים.',
    category: 'ביטחון',
    emoji: '💪',
  },
  {
    id: 'confidence-eye-contact',
    title: 'קשר עיניים',
    description: 'כל 3 שניות, התבונן בעיניה לשנייה אחת. זה יוצר קשר אמתי.',
    category: 'ביטחון',
    emoji: '👀',
  },
  {
    id: 'confidence-voice',
    title: 'קול חזק',
    description: 'דבר לאט, בעצמה, בצורה ברורה. אל תנמק את המילים.',
    category: 'ביטחון',
    emoji: '🎤',
  },
  {
    id: 'validation-listening',
    title: 'הקשבה אקטיבית',
    description: 'שאל שאלות, אל תשאל רק עליך. תן לה למעשות על עצמה.',
    category: 'אישור',
    emoji: '👂',
  },
  {
    id: 'validation-compliments',
    title: 'התחייבות אמתית',
    description: 'התחייב לכמה דברים ספציפיים שאתה אוהב בה - לא רק "את יפה".',
    category: 'אישור',
    emoji: '💫',
  },
  {
    id: 'validation-followup',
    title: 'המשך נכון',
    description: 'אל תעלם מהפנים אם היא לא מעוניינת. תמשך בעדינות או בקבל את התשובה.',
    category: 'אישור',
    emoji: '🤝',
  },
  {
    id: 'recognition-signals',
    title: 'קרא את הסימנים',
    description: 'אם היא משיבה לחיוך או מחזירה קשר עיניים - המשך. אם לא - כבדו את הגבולות.',
    category: 'זיהוי',
    emoji: '🔍',
  },
  {
    id: 'recognition-timing',
    title: 'בחר את הרגע הנכון',
    description: 'לא בשעה 23:00, לא כשהיא עם חברות. חנוך את הרגע - זה משנה.',
    category: 'זיהוי',
    emoji: '⏰',
  },
  {
    id: 'recognition-opener',
    title: 'בחר פתיחה תואמת',
    description: 'בחר בין Direct, Situational או Humor בהתאם למצב. עדינות ברירה טובה.',
    category: 'זיהוי',
    emoji: '🎯',
  },
  {
    id: 'persistence-boundaries',
    title: 'התמדה עם גבולות',
    description: 'אל תוותר אחרי "לא" אחד, אבל כבדו את הגבולות שלה. יש הבדל.',
    category: 'ליווי',
    emoji: '💪',
  },
  {
    id: 'persistence-learning',
    title: 'כל גישה היא לימוד',
    description: 'כל הנסיון - אפילו הכישלונות - מלמד אותך משהו. תשמור על הנכונות.',
    category: 'ליווי',
    emoji: '📚',
  },
]

export interface Badge {
  id: 'starter' | 'seasoned' | 'legend' | 'dominator' | 'seven-day-streak' | 'direct-master' | 'charmer' | 'savant'
  title: string
  /** שורה קצרה ברשימה */
  description: string
  emoji: string
  /** משפט אחד — מה מייצג התג */
  whatIs: string
  /** הסבר מפורט איך משיגים (מסתנכרן עם הלוגיקה באפליקציה) */
  howToUnlock: string
}

export const BADGES: Badge[] = [
  {
    id: 'starter',
    title: 'התחלה',
    description: '5 גישות מתועדות',
    emoji: '🌱',
    whatIs: 'תג התחלה — מראה שהתחלת לתעד גישות באפליקציה.',
    howToUnlock:
      'תעד לפחות 5 גישות בטאב «תיעוד» (כל שמירה נספרת). הנתונים מגיעים מהגישות השמורות אצלך — אין צורך להגדיר כלום בנפרד.',
  },
  {
    id: 'seasoned',
    title: 'מנוסה',
    description: '10 גישות מתועדות',
    emoji: '🔥',
    whatIs: 'תג למי שכבר בונה הרגל של תיעוד עקבי.',
    howToUnlock: 'הגע ל־10 גישות מתועדות בסך הכל (מחושב אוטומטית מכל הרישומים שלך).',
  },
  {
    id: 'legend',
    title: 'אגדה',
    description: '25 גישות מתועדות',
    emoji: '🏆',
    whatIs: 'תג להישג של ניסיון משמעותי בתיעוד.',
    howToUnlock: 'הגע ל־25 גישות מתועדות בסך הכל.',
  },
  {
    id: 'dominator',
    title: 'דומיננט',
    description: '50 גישות מתועדות',
    emoji: '👑',
    whatIs: 'תג למתעדים ברמה גבוהה — הרבה ניסוי בשטח.',
    howToUnlock: 'הגע ל־50 גישות מתועדות בסך הכל.',
  },
  {
    id: 'seven-day-streak',
    title: '7 ימים',
    description: '7 ימים רצופים עם גישה',
    emoji: '🌟',
    whatIs: 'תג לרצף יומי — יום אחרי יום עם לפחות גישה אחת מתועדת.',
    howToUnlock:
      'שמור על רצף של 7 ימים רצופים שבכל אחד מהם יש לפחות גישה אחת מתועדת. הרצף מחושב מהנתונים שלך ביומן.',
  },
  {
    id: 'direct-master',
    title: 'אלוף דירקט',
    description: '10 גישות ישירות עם מעל 60% הצלחה',
    emoji: '🎯',
    whatIs: 'תג למי שמצליח עם גישה ישירה — לפי סוג הגישה והתגובה שסימנת.',
    howToUnlock:
      'צריך לפחות 10 גישות שסומנו כגישה ישירה (direct). מתוכן, אחוז התגובות שסומנו כחיוביות או ניטרליות צריך להיות מעל 60%.',
  },
  {
    id: 'charmer',
    title: 'מלך ההומור',
    description: '10 גישות בהומור עם מעל 70% הצלחה',
    emoji: '💫',
    whatIs: 'תג למי שמצליח עם גישה בהומור.',
    howToUnlock:
      'לפחות 10 גישות שסומנו כהומור, ומעל 70% מהן עם תגובה חיובית או ניטרלית (כפי שסימנת בטופס).',
  },
  {
    id: 'savant',
    title: 'מומחה',
    description: '5 משימות שבועיות השלמו',
    emoji: '🧠',
    whatIs: 'תג למי שמקיים משימות שבועיות באפליקציה.',
    howToUnlock:
      'השלם 5 משימות שבועיות (מסך הטיפים — «סמן כבוצע» כשהיעד הושג). המונה נשמר באפליקציה ומתעדכן כשהשרת מאשר השלמה.',
  },
]

export const TIP_CATEGORIES: Array<{ label: string; value: Tip['category'] }> = [
  { label: 'כל', value: 'ביטחון' },
  { label: 'ביטחון', value: 'ביטחון' },
  { label: 'אישור', value: 'אישור' },
  { label: 'זיהוי', value: 'זיהוי' },
  { label: 'ליווי', value: 'ליווי' },
]
