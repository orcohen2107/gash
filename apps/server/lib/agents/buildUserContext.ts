import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserContext, ApproachType } from '@gash/types'

function avg(nums: (number | null)[]): number {
  const valid = nums.filter((n): n is number => n !== null)
  if (valid.length === 0) return 0
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key])
    acc[k] = [...(acc[k] ?? []), item]
    return acc
  }, {} as Record<string, T[]>)
}

const STYLE_LABELS: Record<string, string> = {
  direct: 'ישיר ובטוח בעצמו',
  humor: 'מצחיק וקליל',
  situational: 'מחובר לסביבה',
  online: 'תקשורתי',
}

export async function buildUserContext(
  userId: string,
  supabase: SupabaseClient
): Promise<UserContext> {
  const { data } = await supabase
    .from('approaches')
    .select('approach_type, chemistry_score, follow_up, date, location')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .limit(30)

  if (!data || data.length === 0) return { hasEnoughData: false }
  if (data.length < 5) return { hasEnoughData: false, totalApproaches: data.length }

  const byType = groupBy(data, 'approach_type')
  const successByType = Object.entries(byType)
    .map(([type, rows]) => ({
      type: type as ApproachType,
      successRate: rows.filter((r) => r.follow_up !== 'nothing').length / rows.length,
      avgChemistry: avg(rows.map((r) => r.chemistry_score)),
      count: rows.length,
    }))
    .filter((t) => t.count >= 2)

  const sorted = [...successByType].sort((a, b) => b.successRate - a.successRate)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  const recent = data.slice(0, 5)
  const recentSuccess = recent.filter((r) => r.follow_up !== 'nothing').length
  const recentPattern = `${recentSuccess} מתוך 5 הגישות האחרונות הצליחו`

  return {
    hasEnoughData: true,
    totalApproaches: data.length,
    bestType: best?.type ?? 'direct',
    bestRate: Math.round((best?.successRate ?? 0) * 100),
    worstType: worst?.type ?? 'online',
    avgChemistry: avg(data.map((r) => r.chemistry_score)).toFixed(1),
    recentPattern,
    userStyle: STYLE_LABELS[best?.type ?? 'direct'],
    typeSuccessRates: Object.fromEntries(
      successByType.map((t) => [t.type, Math.round(t.successRate * 100)])
    ),
  }
}
