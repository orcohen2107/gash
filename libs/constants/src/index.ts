import type { ApproachType, DurationType, FollowUpType } from '@gash/types'

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

export const DURATION_LABELS: Record<DurationType, string> = {
  brief: 'עד דקה',
  short: '1–5 דקות',
  long: 'יותר מ-5',
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

export const COACH_MODES = [
  {
    id: 'practice' as const,
    label: 'תרגול סיטואציות',
    icon: '🎭',
    description: 'תרגל שיחה עם בחורה בסיטואציה אמיתית',
    openingHint: 'Claude יגלם בחורה ישראלית בסיטואציה — אתה תפנה אליה',
  },
  {
    id: 'coach' as const,
    label: 'שאלה למאמן',
    icon: '🎯',
    description: 'שאל כל שאלה על גישות, ביטחון ודייטינג',
    openingHint: 'המאמן כאן בשבילך',
  },
  {
    id: 'debrief-chat' as const,
    label: 'עיבוד גישה',
    icon: '🔍',
    description: 'נתח גישה שעשית — מה עבד ומה אפשר לשפר',
    openingHint: 'ספר מה קרה וקבל ניתוח מעמיק',
  },
] as const

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
  category: 'ביטחון' | 'אישור' | 'זיהוי' | 'פלירטוט' | 'ליווי'
  emoji: string
}

export const TIPS: Tip[] = [
  {
    id: 'confidence-body-language',
    title: 'שפת גוף',
    description: 'עמוד זקוף, שמור על מבט רגוע וחייך. זה אומר יותר מאלף מילים.',
    category: 'ביטחון',
    emoji: '💪',
  },
  {
    id: 'confidence-eye-contact',
    title: 'קשר עיניים',
    description: 'צור קשר עיניים קצר ורגוע, ואז שחרר. זה בונה חיבור בלי לחץ.',
    category: 'ביטחון',
    emoji: '👀',
  },
  {
    id: 'confidence-voice',
    title: 'קול חזק',
    description: 'דבר לאט, ברור ובקול יציב. אל תבלע מילים ואל תמהר להסביר את עצמך.',
    category: 'ביטחון',
    emoji: '🎤',
  },
  {
    id: 'confidence-slow-down',
    title: 'דבר לאט יותר',
    description: 'קח חצי שנייה לפני תשובה. קצב רגוע משדר ביטחון ונותן למילים שלך משקל.',
    category: 'ביטחון',
    emoji: '🧘',
  },
  {
    id: 'confidence-open-shoulders',
    title: 'כתפיים פתוחות',
    description: 'עמוד פתוח ולא מכונס. ידיים רגועות, כתפיים אחורה ומבט בגובה העיניים.',
    category: 'ביטחון',
    emoji: '🧍',
  },
  {
    id: 'validation-listening',
    title: 'הקשבה אקטיבית',
    description: 'שאל שאלות והקשב באמת. תן לה מקום לדבר על עצמה.',
    category: 'אישור',
    emoji: '👂',
  },
  {
    id: 'validation-ask-about-her',
    title: 'שאל עליה מוקדם',
    description: 'אחרי פתיחה קצרה, שאל משהו פשוט עליה: איך קוראים לה, מאיפה היא או מה היא עושה כאן.',
    category: 'אישור',
    emoji: '🙋',
  },
  {
    id: 'validation-share-yourself',
    title: 'תן משפט על עצמך',
    description: 'אל תהפוך את זה לראיון. הוסף פרט קטן עליך כדי שגם היא תרגיש מי מדבר איתה.',
    category: 'אישור',
    emoji: '🗣️',
  },
  {
    id: 'validation-compliments',
    title: 'מחמאה אמיתית',
    description: 'בחר משהו ספציפי שאתה מעריך בה, לא רק "את יפה".',
    category: 'אישור',
    emoji: '💫',
  },
  {
    id: 'validation-indirect-compliment',
    title: 'מחמאה עקיפה',
    description: 'החמא על וייב, אנרגיה או סגנון: "יש לך אנרגיה חדה כזאת" מרגיש אישי יותר.',
    category: 'אישור',
    emoji: '🌟',
  },
  {
    id: 'validation-curiosity-compliment',
    title: 'מחמאה עם סקרנות',
    description: 'נסה מחמאה שפותחת שיחה: "את נראית לי ישירה" או "יש לך וייב חייכני".',
    category: 'אישור',
    emoji: '✨',
  },
  {
    id: 'validation-depth-question',
    title: 'שאלת עומק',
    description: 'אחרי שיש חיבור ראשוני, שאל משהו פחות טכני: מה מסקרן אותה, מה היא אוהבת, מה חשוב לה.',
    category: 'אישור',
    emoji: '🧠',
  },
  {
    id: 'validation-react-to-her',
    title: 'תגיב למה שהיא אומרת',
    description: 'אל תרוץ לשאלה הבאה. תפוס מילה אחת שלה, תגיב עליה ותמשיך משם.',
    category: 'אישור',
    emoji: '🔁',
  },
  {
    id: 'validation-statements',
    title: 'הצהרות במקום ראיון',
    description: 'במקום לשאול כל הזמן, נסה להצהיר: "את נראית לי אחת שלא יושבת במקום".',
    category: 'אישור',
    emoji: '🎙️',
  },
  {
    id: 'validation-followup',
    title: 'המשך נכון',
    description: 'אם היא לא מעוניינת, קבל את זה בכבוד. אם יש עניין, המשך בעדינות.',
    category: 'אישור',
    emoji: '🤝',
  },
  {
    id: 'recognition-signals',
    title: 'קרא את הסימנים',
    description: 'אם היא מחייכת בחזרה או שומרת קשר עיניים, אפשר להמשיך. אם לא, כבד את הגבול.',
    category: 'זיהוי',
    emoji: '🔍',
  },
  {
    id: 'recognition-timing',
    title: 'בחר את הרגע הנכון',
    description: 'בחר רגע נוח ולא לחוץ. תזמון טוב משנה את כל התחושה.',
    category: 'זיהוי',
    emoji: '⏰',
  },
  {
    id: 'recognition-opener',
    title: 'בחר פתיחה תואמת',
    description: 'בחר פתיחה ישירה, סיטואציונלית או הומוריסטית לפי המצב. עדינות היא יתרון.',
    category: 'זיהוי',
    emoji: '🎯',
  },
  {
    id: 'recognition-situation-humor',
    title: 'הומור על הסיטואציה',
    description: 'השתמש במה שקורה סביבכם. משפט על המקום, התור או הרגע מרגיש טבעי יותר ממשפט מוכן.',
    category: 'זיהוי',
    emoji: '😄',
  },
  {
    id: 'recognition-notice-vibe',
    title: 'שים לב לוייב שלה',
    description: 'אם היא אנרגטית, שקטה או חדה, תגיד את זה בעדינות ומה זה גורם לך לחשוב עליה.',
    category: 'זיהוי',
    emoji: '🪩',
  },
  {
    id: 'recognition-interesting-detail',
    title: 'שמתי לב למשהו',
    description: 'פתח סקרנות עם "שמתי לב למשהו מעניין אצלך" ואז תן אבחנה קטנה ולא כבדה.',
    category: 'זיהוי',
    emoji: '🕵️',
  },
  {
    id: 'flirt-push-pull',
    title: 'קרוב־רחוק',
    description: 'שלב מחמאה וטיז קטן: "את יחסית חמודה למישהי שנראית כמו עורכת דין". רק בטון משחקי.',
    category: 'פלירטוט',
    emoji: '🧲',
  },
  {
    id: 'flirt-light-teasing',
    title: 'טיזינג עדין',
    description: 'משפטים כמו "לא מאמין לך" או "אין סיכוי שאת ככה" עובדים רק כשהטון מחויך ולא שיפוטי.',
    category: 'פלירטוט',
    emoji: '😏',
  },
  {
    id: 'flirt-assumptions',
    title: 'נחש עליה משהו',
    description: 'במקום לשאול הכל, תניח הנחה קטנה. אם טעית, זה עדיין יוצר משחק ושיחה.',
    category: 'פלירטוט',
    emoji: '🎲',
  },
  {
    id: 'flirt-playful-drama',
    title: 'דרמה משחקית',
    description: 'צור רגע קטן: "רגע, עכשיו הבנתי עלייך משהו". זה מכניס אנרגיה בלי להיות כבד.',
    category: 'פלירטוט',
    emoji: '🎭',
  },
  {
    id: 'flirt-small-bet',
    title: 'התערבות קטנה',
    description: 'נסה "אני מתערב שאת..." כדי להפוך שאלה למשחק קצר ולא לראיון.',
    category: 'פלירטוט',
    emoji: '🤝',
  },
  {
    id: 'flirt-playful-challenge',
    title: 'אתגר קטן',
    description: 'משפט כמו "אין סיכוי שאת מצליחה לעשות את זה" יכול לעבוד כשיש חיוך ונוחות.',
    category: 'פלירטוט',
    emoji: '🏁',
  },
  {
    id: 'flirt-gentle-sexual',
    title: 'פלירטוט מיני עדין',
    description: 'רק כשכבר יש נוחות ופלרטוט הדדי. משהו קליל, לא ישיר מדי ולא לוחץ.',
    category: 'פלירטוט',
    emoji: '🔥',
  },
  {
    id: 'persistence-boundaries',
    title: 'התמדה עם גבולות',
    description: 'אפשר להיות עקבי, אבל תמיד לכבד גבולות. יש הבדל בין ביטחון ללחץ.',
    category: 'ליווי',
    emoji: '💪',
  },
  {
    id: 'persistence-learning',
    title: 'כל גישה היא לימוד',
    description: 'כל ניסיון, גם כזה שלא הצליח, מלמד אותך משהו לפעם הבאה.',
    category: 'ליווי',
    emoji: '📚',
  },
]

export interface Badge {
  id:
    | 'first-step'
    | 'starter'
    | 'seasoned'
    | 'legend'
    | 'dominator'
    | 'three-day-streak'
    | 'seven-day-streak'
    | 'direct-master'
    | 'situational-player'
    | 'online-active'
    | 'high-spark'
    | 'charmer'
    | 'savant'
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
    id: 'first-step',
    title: 'צעד ראשון',
    description: 'גישה אחת מתועדת',
    emoji: '🚀',
    whatIs: 'תג התחלה מהירה — מסמן שעשית את הצעד הראשון והכנסת נתון אמיתי למערכת.',
    howToUnlock:
      'תעד גישה אחת בטאב «תיעוד». אחרי השמירה הראשונה התג נפתח אוטומטית.',
  },
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
    id: 'three-day-streak',
    title: '3 ימים',
    description: '3 ימים רצופים עם גישה',
    emoji: '⚡',
    whatIs: 'תג להרגל ראשוני — כמה ימים רצופים שבהם אתה ממשיך לזוז.',
    howToUnlock:
      'שמור על רצף של 3 ימים רצופים, עם לפחות גישה אחת מתועדת בכל יום.',
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
    id: 'situational-player',
    title: 'קורא מצב',
    description: '5 גישות סיטואציונליות',
    emoji: '🧭',
    whatIs: 'תג למי שמתאמן על פתיחות שמבוססות על הסיטואציה סביבו.',
    howToUnlock:
      'תעד לפחות 5 גישות שסומנו כסיטואציונליות. זה נמדד לפי סוג הגישה בטופס התיעוד.',
  },
  {
    id: 'online-active',
    title: 'פעיל אונליין',
    description: '5 גישות אונליין',
    emoji: '📱',
    whatIs: 'תג למי שמתרגל גם פתיחות ושיחות דרך אונליין.',
    howToUnlock:
      'תעד לפחות 5 גישות שסומנו כאונליין. כל תיעוד כזה מקדם אותך לתג.',
  },
  {
    id: 'high-spark',
    title: 'ניצוץ גבוה',
    description: '5 גישות עם כימיה 8+',
    emoji: '✨',
    whatIs: 'תג שמתמקד באיכות החיבור, לא רק בכמות הגישות.',
    howToUnlock:
      'תעד לפחות 5 גישות שבהן דירגת את הכימיה 8 ומעלה.',
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

export const TIP_CATEGORIES: Array<{ label: string; value: Tip['category'] | 'all' }> = [
  { label: 'כל', value: 'all' },
  { label: 'ביטחון', value: 'ביטחון' },
  { label: 'אישור', value: 'אישור' },
  { label: 'זיהוי', value: 'זיהוי' },
  { label: 'פלירטוט', value: 'פלירטוט' },
  { label: 'ליווי', value: 'ליווי' },
]
