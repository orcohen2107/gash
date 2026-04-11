import type { Badge } from '@gash/constants'
import type { Approach } from '@gash/types'

function isSuccessfulResponse(a: Approach): boolean {
  return a.response === 'positive' || a.response === 'neutral'
}

/**
 * שורת סטטוס חיה לפי הגישות והרצף — מתאימה ללוגיקה ב־useBadgesStore.checkAndUnlockBadges
 */
export function getBadgeLiveStatusLine(
  badgeId: Badge['id'],
  approaches: Approach[],
  streak: number,
  missionsCompleted: number
): string {
  const total = approaches.length

  switch (badgeId) {
    case 'starter':
      return `עכשיו: ${total} מתוך 5 גישות מתועדות`
    case 'seasoned':
      return `עכשיו: ${total} מתוך 10 גישות מתועדות`
    case 'legend':
      return `עכשיו: ${total} מתוך 25 גישות מתועדות`
    case 'dominator':
      return `עכשיו: ${total} מתוך 50 גישות מתועדות`
    case 'seven-day-streak':
      return `רצף נוכחי: ${streak} ימים (נדרש 7 רצופים עם גישה בכל יום)`
    case 'direct-master': {
      const direct = approaches.filter((a) => a.approach_type === 'direct')
      const n = direct.length
      if (n === 0) {
        return 'אין עדיין גישות ישירות מתועדות — התחל לתעד עם סוג «ישיר».'
      }
      const ok = direct.filter(isSuccessfulResponse).length
      const pct = Math.round((ok / n) * 100)
      return `גישות ישירות: ${n} (מינ׳ 10). הצלחה לפי תגובות: ${pct}% (נדרש מעל 60%).`
    }
    case 'charmer': {
      const humor = approaches.filter((a) => a.approach_type === 'humor')
      const n = humor.length
      if (n === 0) {
        return 'אין עדיין גישות «הומור» מתועדות.'
      }
      const ok = humor.filter(isSuccessfulResponse).length
      const pct = Math.round((ok / n) * 100)
      return `גישות הומור: ${n} (מינ׳ 10). הצלחה לפי תגובות: ${pct}% (נדרש מעל 70%).`
    }
    case 'savant':
      return `משימות שבועיות שהושלמו במכשיר: ${missionsCompleted} מתוך 5`
    default:
      return ''
  }
}
