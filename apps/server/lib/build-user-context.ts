import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface UserContext {
  totalApproaches: number
  successRate: number
  avgChemistry: number
  bestType: string | null
  worstType: string | null
  recentPattern: string
}

export async function buildUserContext(userId: string): Promise<UserContext> {
  const { data: approaches, error } = await supabaseAdmin
    .from('approaches')
    .select('approach_type, response, chemistry_score, date')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .limit(30)

  if (error || !approaches) {
    logger.error('user_context.fetch_approaches_failed', { userId, error })
    return {
      totalApproaches: 0,
      successRate: 0,
      avgChemistry: 0,
      bestType: null,
      worstType: null,
      recentPattern: 'שום דפוס',
    }
  }

  const totalApproaches = approaches.length
  if (totalApproaches === 0) {
    return {
      totalApproaches: 0,
      successRate: 0,
      avgChemistry: 0,
      bestType: null,
      worstType: null,
      recentPattern: 'שום דפוס',
    }
  }

  // Success rate: (positive + neutral) / total * 100
  const successCount = approaches.filter(
    (a) => a.response === 'positive' || a.response === 'neutral'
  ).length
  const successRate = totalApproaches > 0
    ? Math.round((successCount / totalApproaches) * 100)
    : 0

  // Average chemistry
  const avgChemistry = totalApproaches > 0
    ? Math.round(
        (approaches.reduce((sum, a) => sum + (a.chemistry_score ?? 0), 0) /
          totalApproaches) *
          10
      ) / 10
    : 0

  // Compute type counts
  const typeCounts: Record<string, number> = {}
  approaches.forEach((a) => {
    typeCounts[a.approach_type] = (typeCounts[a.approach_type] ?? 0) + 1
  })

  const typeKeys = Object.keys(typeCounts)
  const bestType =
    typeKeys.length === 0
      ? null
      : typeKeys.reduce((best, type) =>
          (typeCounts[type] ?? 0) > (typeCounts[best] ?? 0) ? type : best
        )

  const worstType =
    typeKeys.length === 0
      ? null
      : typeKeys.reduce((worst, type) =>
          (typeCounts[type] ?? 0) < (typeCounts[worst] ?? Infinity) ? type : worst
        )

  // Detect recent pattern
  const recent5 = approaches.slice(0, 5)
  const recentSuccessRate = recent5.length > 0
    ? (recent5.filter((a) => a.response === 'positive' || a.response === 'neutral')
        .length / recent5.length) * 100
    : 0

  const recentPattern =
    recentSuccessRate > 70
      ? 'סדרה טובה'
      : recentSuccessRate > 40
        ? 'דפוס מעורב'
        : 'אתגר עדכני'

  return {
    totalApproaches,
    successRate,
    avgChemistry,
    bestType,
    worstType,
    recentPattern,
  }
}
