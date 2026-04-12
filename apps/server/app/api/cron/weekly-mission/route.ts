import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { runMissionAgent } from '@/lib/agents/mission-agent'
import { getRequestLogContext, logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  // Protect with CRON_SECRET header
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  try {
    // Find active users: had an approach in the last 14 days
    const cutoffDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    const cutoffStr = cutoffDate.toISOString().split('T')[0]

    const { data: approachesData } = await supabase
      .from('approaches')
      .select('user_id')
      .gte('date', cutoffStr)
      .is('deleted_at', null)

    // Deduplicate user IDs
    const userIds = [...new Set(approachesData?.map((r) => r.user_id) ?? [])]

    // Get this week's start date (Sunday)
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekStartStr = weekStart.toISOString().split('T')[0]

    let processed = 0

    for (const userId of userIds) {
      // Check if mission already exists for this week
      const { data: existing } = await supabase
        .from('weekly_missions')
        .select('id')
        .eq('user_id', userId)
        .eq('week_start', weekStartStr)
        .limit(1)

      if (existing && existing.length > 0) {
        continue // Skip if mission already exists
      }

      // Get user's approaches to build context
      const { data: approaches } = await supabase
        .from('approaches')
        .select('approach_type, response, chemistry_score')
        .eq('user_id', userId)
        .is('deleted_at', null)

      if (!approaches || approaches.length === 0) {
        continue // Skip if no approaches
      }

      // Compute user context
      const totalApproaches = approaches.length
      const successCount = approaches.filter(
        (a) => a.response === 'positive' || a.response === 'neutral'
      ).length
      const successRate = Math.round((successCount / totalApproaches) * 100)
      const avgChemistry = Math.round(
        (approaches.reduce((sum, a) => sum + (a.chemistry_score ?? 0), 0) / totalApproaches) * 10
      ) / 10

      // Find best and worst approach types
      const typeCounts: Record<string, number> = {}
      approaches.forEach((a) => {
        typeCounts[a.approach_type] = (typeCounts[a.approach_type] ?? 0) + 1
      })

      const typeKeys = Object.keys(typeCounts)
      const bestType =
        typeKeys.length === 0
          ? 'direct'
          : typeKeys.reduce((best, type) =>
              typeCounts[type] > (typeCounts[best] || 0) ? type : best
            )

      const worstType =
        typeKeys.length === 0
          ? 'direct'
          : typeKeys.reduce((worst, type) =>
              typeCounts[type] < (typeCounts[worst] ?? Infinity) ? type : worst
            )

      // Generate mission via Claude
      const mission = await runMissionAgent({
        totalApproaches,
        successRate,
        avgChemistry,
        bestType: bestType as any,
        worstType: worstType as any,
      })

      // Insert mission into weekly_missions table
      await supabase
        .from('weekly_missions')
        .insert({
          user_id: userId,
          title: mission.title,
          description: mission.description,
          target: mission.target,
          target_approach_type: mission.target_approach_type,
          week_start: weekStartStr,
          completed: false,
        })

      processed++
    }

    logger.info('cron.weekly_mission_completed', {
      ...getRequestLogContext(request, '/api/cron/weekly-mission'),
      processed,
      total: userIds.length,
    })

    return NextResponse.json({ processed, total: userIds.length })
  } catch (err) {
    logger.error('cron.weekly_mission_failed', {
      ...getRequestLogContext(request, '/api/cron/weekly-mission'),
      error: err,
    })
    return NextResponse.json({ error: 'Cron failed', details: String(err) }, { status: 500 })
  }
}
