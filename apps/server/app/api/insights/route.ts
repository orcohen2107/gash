import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { runInsightsAgent } from '@/lib/agents/insights-agent'
import { sendPushNotificationToUser } from '@/lib/pushNotifications'

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const userId = auth.userId

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

    // Send push notification when new insights are generated
    if (result.weeklyMission?.title) {
      await sendPushNotificationToUser({
        userId,
        title: 'התובנות שלך מוכנות 📊',
        body: `משימה חדשה: ${result.weeklyMission.title}`,
        notificationType: 'insights_ready',
        data: {
          screen: '/(tabs)/dashboard',
        },
      }).catch((err) => {
        console.error('Failed to send insights notification:', err)
        // Non-blocking — don't fail if push notification fails
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
