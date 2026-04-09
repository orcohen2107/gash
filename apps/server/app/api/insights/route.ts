import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { runInsightsAgent } from '@/lib/agents/insights'
import { handleApiError } from '@/lib/apiError'
import { INSIGHTS_REFRESH_HOURS } from '@gash/constants'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request)
    const supabase = createServiceClient()

    const { data: existing } = await supabase
      .from('user_insights')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existing?.last_analysis_at) {
      const lastAnalysis = new Date(existing.last_analysis_at)
      const hoursSince = (Date.now() - lastAnalysis.getTime()) / (1000 * 60 * 60)
      if (hoursSince < INSIGHTS_REFRESH_HOURS) {
        return NextResponse.json({ insights: existing })
      }
    }

    const fresh = await runInsightsAgent(userId, supabase)

    await supabase.from('user_insights').upsert({
      user_id: userId,
      weekly_mission: fresh.weeklyMission,
      last_analysis_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({ insights: fresh })
  } catch (error) {
    return handleApiError(error)
  }
}
