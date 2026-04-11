import { supabaseAdmin } from '@/lib/supabase'
import { runInsightsAgent } from '@/lib/agents/insights-agent'
import { runMissionAgent } from '@/lib/agents/mission-agent'
import type { MissionResponse } from '@/lib/agents/mission-agent'
import { sendPushNotificationToUser } from '@/lib/pushNotifications'
import type {
  Approach,
  ApproachType,
  DashboardKpis,
  DashboardResponse,
  InsightsResponse,
} from '@gash/types'

function computeKpis(approaches: Approach[]): DashboardKpis {
  const total = approaches.length
  if (total === 0) {
    return {
      totalApproaches: 0,
      successRate: 0,
      avgChemistry: 0,
      topApproachType: null,
    }
  }
  const successCount = approaches.filter(
    (a) => a.response === 'positive' || a.response === 'neutral'
  ).length
  const successRate = Math.round((successCount / total) * 100)
  const avgChemistry =
    Math.round(
      (approaches.reduce((sum, a) => sum + (a.chemistry_score ?? 0), 0) / total) * 10
    ) / 10

  const typeCounts: Record<string, number> = {}
  approaches.forEach((a) => {
    typeCounts[a.approach_type] = (typeCounts[a.approach_type] ?? 0) + 1
  })
  const typeKeys = Object.keys(typeCounts)
  const topApproachType =
    typeKeys.length === 0
      ? null
      : (typeKeys.reduce((best, type) =>
          (typeCounts[type] ?? 0) > (typeCounts[best] ?? 0) ? type : best
        ) as ApproachType)

  return {
    totalApproaches: total,
    successRate,
    avgChemistry,
    topApproachType,
  }
}

function agentInsightToInsightsResponse(
  result: Awaited<ReturnType<typeof runInsightsAgent>>
): InsightsResponse {
  const raw = result.insights
  const a = Array.isArray(raw) ? raw : []
  const insights: [string, string, string] = [
    String(a[0] ?? 'המשך לתעד גישות כדי לקבל תובנות מ-AI'),
    String(a[1] ?? ''),
    String(a[2] ?? ''),
  ]
  const wm = result.weeklyMission
  return {
    insights,
    weeklyMission: {
      title: wm.title ?? '',
      description: wm.description ?? '',
      target: typeof wm.target === 'number' ? wm.target : Number(wm.target) || 0,
      targetType: '',
    },
    trend: 'יציב',
    trendExplanation: '',
  }
}

async function loadInsightsPart(userId: string): Promise<InsightsResponse> {
  const { data: existing } = await supabaseAdmin
    .from('user_insights')
    .select('weekly_mission, last_analysis_at')
    .eq('user_id', userId)
    .single()

  const now = new Date()
  if (existing?.last_analysis_at) {
    const lastAnalysis = new Date(existing.last_analysis_at)
    const hoursSinceAnalysis = (now.getTime() - lastAnalysis.getTime()) / (1000 * 60 * 60)
    if (hoursSinceAnalysis < 24) {
      const wm = existing.weekly_mission as {
        title?: string
        description?: string
        target?: number
        targetType?: string
        target_approach_type?: string
      } | null
      return {
        insights: [
          'המשך לתעד גישות כדי לקבל תובנות מעודכנות מ-AI',
          '',
          '',
        ],
        weeklyMission: {
          title: String(wm?.title ?? ''),
          description: String(wm?.description ?? ''),
          target: typeof wm?.target === 'number' ? wm.target : Number(wm?.target) || 0,
          targetType: String(wm?.targetType ?? wm?.target_approach_type ?? ''),
        },
        trend: 'יציב',
        trendExplanation: '',
      }
    }
  }

  const result = await runInsightsAgent(userId)

  if (existing) {
    await supabaseAdmin
      .from('user_insights')
      .update({
        weekly_mission: result.weeklyMission,
        last_analysis_at: now.toISOString(),
      })
      .eq('user_id', userId)
  } else {
    await supabaseAdmin.from('user_insights').insert({
      user_id: userId,
      weekly_mission: result.weeklyMission,
      last_analysis_at: now.toISOString(),
    })
  }

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
    })
  }

  return agentInsightToInsightsResponse(result)
}

async function loadMissionPart(
  userId: string,
  approaches: Pick<Approach, 'approach_type' | 'response' | 'chemistry_score'>[]
): Promise<MissionResponse> {
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
    return {
      title: existingMission.title,
      description: existingMission.description,
      target: existingMission.target,
      target_approach_type: existingMission.target_approach_type as ApproachType,
    }
  }

  if (!approaches || approaches.length === 0) {
    return {
      title: 'ברוכים הבאים',
      description: 'התחל לתעד גישות כדי לקבל משימות מותאמות',
      target: 1,
      target_approach_type: 'direct',
    }
  }

  const totalApproaches = approaches.length
  const successCount = approaches.filter(
    (a) => a.response === 'positive' || a.response === 'neutral'
  ).length
  const successRate = Math.round((successCount / totalApproaches) * 100)
  const avgChemistry =
    Math.round(
      (approaches.reduce((sum, a) => sum + (a.chemistry_score ?? 0), 0) / totalApproaches) * 10
    ) / 10

  const typeCounts: Record<string, number> = {}
  approaches.forEach((a) => {
    typeCounts[a.approach_type] = (typeCounts[a.approach_type] ?? 0) + 1
  })

  const bestType = Object.keys(typeCounts).reduce((best, type) =>
    typeCounts[type] > (typeCounts[best] || 0) ? type : best
  ) as ApproachType

  const worstType = Object.keys(typeCounts).reduce((worst, type) =>
    typeCounts[type] < (typeCounts[worst] ?? Infinity) ? type : worst
  ) as ApproachType

  const mission = await runMissionAgent({
    totalApproaches,
    successRate,
    avgChemistry,
    bestType,
    worstType,
  })

  await supabaseAdmin.from('weekly_missions').insert({
    user_id: userId,
    title: mission.title,
    description: mission.description,
    target: mission.target,
    target_approach_type: mission.target_approach_type,
    week_start: weekStartStr,
    completed: false,
  })

  return mission
}

export async function buildDashboardPayload(userId: string): Promise<DashboardResponse> {
  const { data: rows, error } = await supabaseAdmin
    .from('approaches')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('date', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const approaches = (rows ?? []) as Approach[]
  const kpis = computeKpis(approaches)

  const [insights, mission] = await Promise.all([
    loadInsightsPart(userId),
    loadMissionPart(
      userId,
      approaches.map((a) => ({
        approach_type: a.approach_type,
        response: a.response,
        chemistry_score: a.chemistry_score,
      }))
    ),
  ])

  return {
    approaches,
    kpis,
    insights,
    mission,
  }
}
