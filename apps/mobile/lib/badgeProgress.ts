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
    case 'first-step':
      return `עכשיו: ${total} מתוך 1 גישות מתועדות`
    case 'starter':
      return `עכשיו: ${total} מתוך 5 גישות מתועדות`
    case 'seasoned':
      return `עכשיו: ${total} מתוך 10 גישות מתועדות`
    case 'legend':
      return `עכשיו: ${total} מתוך 25 גישות מתועדות`
    case 'dominator':
      return `עכשיו: ${total} מתוך 50 גישות מתועדות`
    case 'three-day-streak':
      return `רצף נוכחי: ${streak} ימים (נדרש 3 רצופים עם גישה בכל יום)`
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
    case 'situational-player': {
      const situational = approaches.filter((a) => a.approach_type === 'situational').length
      return `גישות סיטואציונליות: ${situational} מתוך 5`
    }
    case 'online-active': {
      const online = approaches.filter((a) => a.approach_type === 'online').length
      return `גישות אונליין: ${online} מתוך 5`
    }
    case 'high-spark': {
      const highChemistry = approaches.filter((a) => (a.chemistry_score ?? 0) >= 8).length
      return `גישות עם כימיה 8 ומעלה: ${highChemistry} מתוך 5`
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
