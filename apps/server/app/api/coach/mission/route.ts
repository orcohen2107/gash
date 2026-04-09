import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { runMissionAgent } from '@/lib/agents/mission-agent'
import type { MissionResponse } from '@/lib/agents/mission-agent'
import type { ApproachType } from '@gash/types'

export async function POST(request: NextRequest) {
  const { userId } = await verifyAuth(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const action = body.action || 'get'

    // Action: get or complete
    if (action === 'complete') {
      // Mark current week's mission as completed
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekStartStr = weekStart.toISOString().split('T')[0]

      const { data: mission } = await supabaseAdmin
        .from('weekly_missions')
        .select('id')
        .eq('user_id', userId)
        .eq('week_start', weekStartStr)
        .single()

      if (mission) {
        await supabaseAdmin
          .from('weekly_missions')
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq('id', mission.id)

        // Increment missions_completed counter
        await supabaseAdmin
          .from('user_insights')
          .upsert({
            user_id: userId,
            missions_completed: (await supabaseAdmin
              .from('user_insights')
              .select('missions_completed')
              .eq('user_id', userId)
              .single()
              .then((r) => (r.data?.missions_completed ?? 0) + 1)) as unknown as number,
          })
      }

      return NextResponse.json({ success: true })
    }

    // Action: get (default) — return cached mission or generate new one
    // Check for existing mission this week
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const { data: existingMission } = await supabaseAdmin
      .from('weekly_missions')
      .select('title, description, target, target_approach_type')
      .eq('user_id', userId)
      .eq('week_start', weekStartStr)
      .eq('completed', false)
      .single()

    if (existingMission) {
      return NextResponse.json({
        title: existingMission.title,
        description: existingMission.description,
        target: existingMission.target,
        target_approach_type: existingMission.target_approach_type,
      } as MissionResponse)
    }

    // Get user's approaches to build context
    const { data: approaches } = await supabaseAdmin
      .from('approaches')
      .select('approach_type, response, chemistry_score')
      .eq('user_id', userId)
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

    // Save mission to weekly_missions table
    await supabaseAdmin
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
