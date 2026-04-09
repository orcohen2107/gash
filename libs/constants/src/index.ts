import type { ApproachType, FollowUpType } from '@gash/types'

export const APPROACH_TYPE_LABELS: Record<ApproachType, string> = {
  direct: 'ישיר',
  situational: 'סיטואציונלי',
  humor: 'הומוריסטי',
  online: 'אונליין',
}

export const FOLLOW_UP_LABELS: Record<FollowUpType, string> = {
  meeting: 'פגישה',
  text: 'הודעה',
  instagram: 'אינסטגרם',
  nothing: 'כלום',
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
