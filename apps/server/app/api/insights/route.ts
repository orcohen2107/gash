import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { runInsightsAgent } from '@/lib/agents/insights-agent'

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request)
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Check if we have fresh insights (< 24h old)
    const { data: existing } = await supabaseAdmin
      .from('user_insights')
      .select('id, insights, weekly_mission, last_analysis_at')
      .eq('user_id', user.id)
      .single()

    const now = new Date()
    if (existing && existing.last_analysis_at) {
      const lastAnalysis = new Date(existing.last_analysis_at)
      const hoursSinceAnalysis = (now.getTime() - lastAnalysis.getTime()) / (1000 * 60 * 60)
      if (hoursSinceAnalysis < 24) {
        return NextResponse.json({
          insights: existing.insights || [],
          weeklyMission: existing.weekly_mission,
        })
      }
    }

    // Generate new insights
    const result = await runInsightsAgent(user.id)

    // Save to database
    if (existing) {
      await supabaseAdmin
        .from('user_insights')
        .update({
          insights: result.insights,
          weekly_mission: result.weeklyMission,
          last_analysis_at: now.toISOString(),
        })
        .eq('user_id', user.id)
    } else {
      await supabaseAdmin
        .from('user_insights')
        .insert({
          user_id: user.id,
          insights: result.insights,
          weekly_mission: result.weeklyMission,
          last_analysis_at: now.toISOString(),
        })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Insights generation failed:', err)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}
