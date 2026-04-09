import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { runMissionAgent } from '@/lib/agents/mission-agent'
import type { MissionResponse } from '@/lib/agents/mission-agent'
import type { ApproachType } from '@gash/types'

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user's approaches to build context
    const { data: approaches } = await supabaseAdmin
      .from('approaches')
      .select('approach_type, response, chemistry_score')
      .eq('user_id', user.id)
      .is('deleted_at', null)

    if (!approaches || approaches.length === 0) {
      return NextResponse.json({
        title: 'ברוכים הבאים',
        description: 'התחל לתעד גישות כדי לקבל משימות מותאמות',
        target: 1,
        target_approach_type: 'direct',
      } as MissionResponse)
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

    const bestType = Object.entries(typeCounts).reduce((best, [type, count]) =>
      count > (typeCounts[best] || 0) ? type : best
    ) as ApproachType

    const worstType = Object.entries(typeCounts).reduce((worst, [type, count]) =>
      count < (typeCounts[worst] ?? Infinity) ? type : worst
    ) as ApproachType

    // Generate mission via Claude
    const mission = await runMissionAgent({
      totalApproaches,
      successRate,
      avgChemistry,
      bestType,
      worstType,
    })

    // Save mission to database (if weekly_missions table exists)
    // For MVP, we'll just return the mission without persisting
    // TODO: Create weekly_missions table and persist missions

    return NextResponse.json(mission)
  } catch (err) {
    console.error('Mission generation error:', err)
    return NextResponse.json(
      {
        title: 'משימה שבועית',
        description: 'שדר לפחות 3 גישות השבוע',
        target: 3,
        target_approach_type: 'direct',
      } as MissionResponse,
      { status: 500 }
    )
  }
}
