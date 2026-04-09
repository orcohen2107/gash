import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { runInsightsAgent } from '@/lib/agents/insights-agent'
import { createRateLimitResponse } from '@/lib/rateLimit'
import { handleApiError } from '@/lib/apiError'

export async function GET(request: NextRequest) {
  const { userId } = await verifyAuth(request)

  // Rate limit: 5 requests per minute for insights (since it calls Claude)
  const rateLimitResponse = createRateLimitResponse(`insights:${userId}`, {
    limit: 5,
  })
  if (rateLimitResponse) return rateLimitResponse
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Check if we have fresh insights (< 24h old)
    const { data: existing } = await supabaseAdmin
      .from('user_insights')
      .select('weekly_mission, last_analysis_at')
      .eq('user_id', userId)
      .single()

    const now = new Date()
    if (existing && existing.last_analysis_at) {
      const lastAnalysis = new Date(existing.last_analysis_at)
      const hoursSinceAnalysis = (now.getTime() - lastAnalysis.getTime()) / (1000 * 60 * 60)
      if (hoursSinceAnalysis < 24) {
        return NextResponse.json({
          weeklyMission: existing.weekly_mission,
        })
      }
    }

    // Generate new insights
    const result = await runInsightsAgent(userId)

    // Save to database
    if (existing) {
      await supabaseAdmin
        .from('user_insights')
        .update({
          weekly_mission: result.weeklyMission,
          last_analysis_at: now.toISOString(),
        })
        .eq('user_id', userId)
    } else {
      await supabaseAdmin
        .from('user_insights')
        .insert({
          user_id: userId,
          weekly_mission: result.weeklyMission,
          last_analysis_at: now.toISOString(),
        })
    }

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
