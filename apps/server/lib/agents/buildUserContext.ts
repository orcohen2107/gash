import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserContext, ApproachType } from '@gash/types'
import { APPROACH_TYPE_LABELS } from '@gash/constants'

interface ApproachContextRow {
  approach_type: ApproachType
  chemistry_score: number | null
  follow_up: string | null
  date: string
  location: string | null
  opener: string | null
  response: string | null
}

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

function isSuccessful(followUp: string | null): boolean {
  return Boolean(followUp && followUp !== 'nothing')
}

function buildRecentPattern(rows: ApproachContextRow[]): string {
  const recent = rows.slice(0, 5)
  const previous = rows.slice(5, 10)
  const recentSuccess = recent.filter((r) => isSuccessful(r.follow_up)).length

  if (previous.length < 3) return `${recentSuccess} מתוך ${recent.length} הגישות האחרונות הצליחו`

  const previousSuccess = previous.filter((r) => isSuccessful(r.follow_up)).length
  const trend =
    recentSuccess > previousSuccess
      ? 'במגמת שיפור'
      : recentSuccess < previousSuccess
        ? 'דורש התאוששות'
        : 'יציב'

  return `${recentSuccess} מתוך ${recent.length} האחרונות הצליחו (${trend} מול ${previousSuccess} מתוך ${previous.length} לפני כן)`
}

function buildLocationPattern(rows: ApproachContextRow[]): string | undefined {
  const rowsWithLocation = rows.filter((row) => row.location)
  const byLocation = groupBy(rowsWithLocation, 'location')
  const ranked = Object.entries(byLocation)
    .map(([location, locationRows]) => ({
      location,
      count: locationRows.length,
      successRate: locationRows.filter((row) => isSuccessful(row.follow_up)).length / locationRows.length,
    }))
    .filter((row) => row.count >= 2)
    .sort((a, b) => b.successRate - a.successRate)

  const best = ranked[0]
  if (!best) return undefined

  return `${best.location}: ${Math.round(best.successRate * 100)}% הצלחה מתוך ${best.count} פניות`
}

function buildRecentOpeners(rows: ApproachContextRow[]): string[] {
  return rows
    .filter((row) => row.opener && row.opener.trim().length > 0)
    .slice(0, 3)
    .map((row) => row.opener?.trim() ?? '')
}

export async function buildUserContext(
  userId: string,
  supabase: SupabaseClient
): Promise<UserContext> {
  const { data } = await supabase
    .from('approaches')
    .select('approach_type, chemistry_score, follow_up, date, location, opener, response')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .limit(30)

  if (!data || data.length === 0) return { hasEnoughData: false }
  if (data.length < 5) return { hasEnoughData: false, totalApproaches: data.length }

  const rows = data as ApproachContextRow[]
  const byType = groupBy(rows, 'approach_type')
  const successByType = Object.entries(byType)
    .map(([type, rows]) => ({
      type: type as ApproachType,
      successRate: rows.filter((r) => isSuccessful(r.follow_up)).length / rows.length,
      avgChemistry: avg(rows.map((r) => r.chemistry_score)),
      count: rows.length,
    }))
    .filter((t) => t.count >= 2)

  const sorted = [...successByType].sort((a, b) => b.successRate - a.successRate)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]
  const lowChemistryRows = rows.filter((row) => (row.chemistry_score ?? 0) <= 4)
  const commonLowType = lowChemistryRows.length > 0
    ? Object.entries(groupBy(lowChemistryRows, 'approach_type')).sort((a, b) => b[1].length - a[1].length)[0]
    : undefined
  const worstType = worst?.type ?? (commonLowType?.[0] as ApproachType | undefined) ?? 'online'
  const worstTypeLabel = APPROACH_TYPE_LABELS[worstType]
  const bestType = best?.type ?? 'direct'
  const bestTypeLabel = APPROACH_TYPE_LABELS[bestType]
  const bestRate = Math.round((best?.successRate ?? 0) * 100)
  const worstRate = Math.round((worst?.successRate ?? 0) * 100)

  return {
    hasEnoughData: true,
    totalApproaches: rows.length,
    bestType,
    bestRate,
    worstType,
    avgChemistry: avg(rows.map((r) => r.chemistry_score)).toFixed(1),
    recentPattern: buildRecentPattern(rows),
    userStyle: STYLE_LABELS[bestType],
    typeSuccessRates: Object.fromEntries(
      successByType.map((t) => [t.type, Math.round(t.successRate * 100)])
    ),
    bestTypeLabel,
    worstTypeLabel,
    bestEvidence: `${bestTypeLabel}: ${bestRate}% הצלחה מתוך ${best?.count ?? 0} פניות מתועדות`,
    weaknessEvidence: `${worstTypeLabel}: ${worstRate}% הצלחה; ${lowChemistryRows.length} פניות עם כימיה נמוכה`,
    locationPattern: buildLocationPattern(rows),
    recentOpeners: buildRecentOpeners(rows),
    personalizationRules: [
      `להעדיף ניסוחים בסגנון ${STYLE_LABELS[bestType]}`,
      `להיזהר מלהמליץ יותר מדי על ${worstTypeLabel} בלי התאמה לסיטואציה`,
      'להשתמש רק בדפוסים שמופיעים בנתונים, ולא להמציא היסטוריה אישית',
    ],
  }
}
