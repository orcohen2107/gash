/**
 * נתוני תצוגה למסך מדדים — רק לפיתוח (__DEV__).
 * לא שולחים לשרת; ממלאים את useLogStore מקומית כדי לבדוק KPI, גרפים ומשימה.
 */
import type { Approach, ApproachType } from '@gash/types'
import type { Mission } from '@/stores/useBadgesStore'
import { useLogStore } from '@/stores/useLogStore'
import { useStatsStore } from '@/stores/useStatsStore'
import { useBadgesStore } from '@/stores/useBadgesStore'
import { loadDashboardBundle } from '@/lib/loadDashboardBundle'

const MOCK_USER_ID = '00000000-0000-0000-0000-00000000dev01'

const TYPE_CYCLE: ApproachType[] = [
  'direct',
  'direct',
  'direct',
  'humor',
  'situational',
  'online',
  'humor',
]

/** ~40 גישות ב־30 הימים האחרונים — כימיה עולה ואז קלה ירידה (לגרף קו), סוגים מעורבים לפסים */
export function buildDashboardMockApproaches(): Approach[] {
  const list: Approach[] = []
  let seq = 0
  for (let day = 0; day < 30; day++) {
    const perDay = day % 5 === 0 ? 2 : 1
    for (let j = 0; j < perDay; j++) {
      seq += 1
      const i = seq
      const d = new Date()
      d.setDate(d.getDate() - day)
      d.setHours(9 + j * 4, 30, 0, 0)

      const approach_type = TYPE_CYCLE[i % TYPE_CYCLE.length]
      // מניה שמשתנה עם הזמן — דומה לגרף במוקאפ
      const wave = Math.round(5 + 4 * Math.sin((day / 30) * Math.PI * 2) + ((i % 3) - 1))
      const chemistry_score = Math.min(10, Math.max(1, wave))

      const responseRoll = i % 10
      const response =
        responseRoll === 0
          ? 'negative'
          : responseRoll <= 2
            ? 'neutral'
            : 'positive'

      const dateStr = d.toISOString().slice(0, 10)

      list.push({
        id: `dev-mock-${i}`,
        user_id: MOCK_USER_ID,
        date: dateStr,
        location: i % 2 === 0 ? 'קפה' : 'מועדון',
        approach_type,
        opener: 'היי, שמתי לב ש…',
        response,
        chemistry_score,
        follow_up: i % 3 === 0 ? 'instagram' : 'text',
        notes: null,
        created_at: d.toISOString(),
      })
    }
  }
  return list
}

const MOCK_MISSION: Mission = {
  title: 'שלוש גישות ישירות השבוע',
  description: 'תרגל את הסגנון הכי מצליח אצלך — הוסף עוד נקודות לביטחון.',
  target: 3,
  target_approach_type: 'direct',
}

/** מחליף את רשימת הגישות במכשיר (נשמר ב-persist של הלוג עד רענון מהשרת). */
export function injectDashboardDevMock(): void {
  const approaches = buildDashboardMockApproaches()
  useLogStore.setState({ approaches })
  useStatsStore.getState().computeStats()
  useBadgesStore.setState({
    mission: MOCK_MISSION,
    isLoadingMission: false,
  })
  useBadgesStore.getState().checkAndUnlockBadges()
}

export async function clearDashboardDevMock() {
  return loadDashboardBundle()
}
