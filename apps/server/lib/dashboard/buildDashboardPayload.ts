import { supabaseAdmin } from '@/lib/supabase'
import { runInsightsAgent } from '@/lib/agents/insights-agent'
import { runMissionAgent } from '@/lib/agents/mission-agent'
import type { MissionResponse } from '@/lib/agents/mission-agent'
import { sendPushNotificationToUser } from '@/lib/pushNotifications'
import { logger } from '@/lib/logger'
import { loadCurrentStreak } from '@/lib/streak'
import type {
  Approach,
  ApproachType,
  DashboardKpis,
  DashboardResponse,
  DashboardSummary,
  FollowUpType,
  InsightsResponse,
} from '@gash/types'

const APPROACH_TYPES: ApproachType[] = ['direct', 'situational', 'humor', 'online']
const ONE_DAY_MS = 24 * 60 * 60 * 1000

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

function isDateInRange(dateKey: string, start: Date, end: Date): boolean {
  const d = new Date(dateKey)
  d.setHours(0, 0, 0, 0)
  return d >= start && d < end
}

function mostCommonFollowUp(approaches: Approach[]): FollowUpType | null {
  const counts: Partial<Record<FollowUpType, number>> = {}
  approaches.forEach((approach) => {
    if (!approach.follow_up) return
    counts[approach.follow_up] = (counts[approach.follow_up] ?? 0) + 1
  })

  const entries = Object.entries(counts) as Array<[FollowUpType, number]>
  if (entries.length === 0) return null
  return entries.reduce((best, current) => (current[1] > best[1] ? current : best))[0]
}

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

function computeSummary(approaches: Approach[], currentStreak: number): DashboardSummary {
  const now = new Date()
  const thisWeekStart = startOfWeek(now)
  const nextWeekStart = new Date(thisWeekStart.getTime() + 7 * ONE_DAY_MS)
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * ONE_DAY_MS)

  const thisWeekApproaches = approaches.filter((a) =>
    isDateInRange(a.date, thisWeekStart, nextWeekStart)
  ).length
  const lastWeekApproaches = approaches.filter((a) =>
    isDateInRange(a.date, lastWeekStart, thisWeekStart)
  ).length

  const typeCounts = APPROACH_TYPES.map((type) => ({
    type,
    count: approaches.filter((a) => a.approach_type === type).length,
  }))
  const strongestType = computeKpis(approaches).topApproachType
  const practiceType =
    approaches.length === 0
      ? null
      : typeCounts.reduce((lowest, current) =>
          current.count < lowest.count ? current : lowest
        ).type

  const highChemistryCount = approaches.filter((a) => (a.chemistry_score ?? 0) >= 8).length
  const highChemistryRate =
    approaches.length > 0 ? Math.round((highChemistryCount / approaches.length) * 100) : 0

  return {
    thisWeekApproaches,
    lastWeekApproaches,
    weeklyDelta: thisWeekApproaches - lastWeekApproaches,
    currentStreak,
    strongestType,
    practiceType,
    mostCommonFollowUp: mostCommonFollowUp(approaches),
    highChemistryCount,
    highChemistryRate,
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
      logger.error('dashboard.insights_push_failed', { userId, error: err })
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

  const typeKeys = Object.keys(typeCounts)
  const fallbackType: ApproachType = 'direct'
  const bestType =
    typeKeys.length === 0
      ? fallbackType
      : (typeKeys.reduce((best, type) =>
          typeCounts[type] > (typeCounts[best] || 0) ? type : best
        ) as ApproachType)

  const worstType =
    typeKeys.length === 0
      ? fallbackType
      : (typeKeys.reduce((worst, type) =>
          typeCounts[type] < (typeCounts[worst] ?? Infinity) ? type : worst
        ) as ApproachType)

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

  // Load insights, mission, and streak with error handling
  let insights: InsightsResponse = {
    insights: ['המשך לתעד גישות כדי לקבל תובנות מ-AI', '', ''],
    weeklyMission: {
      title: 'התחל הרשלה',
      description: 'תעד 3 גישות השבוע',
      target: 3,
      targetType: 'direct',
    },
    trend: 'יציב',
    trendExplanation: '',
  }
  let mission: MissionResponse = {
    title: 'התחל הרשלה',
    description: 'תעד גישה אחת כיום',
    target: 1,
    target_approach_type: 'direct',
  }
  let streak = 0

  try {
    insights = await loadInsightsPart(userId)
  } catch (err) {
    logger.error('dashboard.insights_failed', { userId, error: err })
  }

  try {
    mission = await loadMissionPart(
      userId,
      approaches.map((a) => ({
        approach_type: a.approach_type,
        response: a.response,
        chemistry_score: a.chemistry_score,
      }))
    )
  } catch (err) {
    logger.error('dashboard.mission_failed', { userId, error: err })
  }

  try {
    streak = await loadCurrentStreak(userId)
  } catch (err) {
    logger.error('dashboard.streak_failed', { userId, error: err })
  }

  return {
    approaches,
    kpis,
    summary: computeSummary(approaches, streak),
    insights,
    mission,
    streak,
  }
}
