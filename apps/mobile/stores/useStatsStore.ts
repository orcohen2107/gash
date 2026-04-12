import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createApiClient } from '@gash/api-client'
import { SERVER_URL, getAuthHeaders, handleAuthError } from '@/lib/server'
import { cache, CACHE_PRESETS } from '@/lib/cache'
import { useLogStore } from './useLogStore'
import { sendLocalNotification } from '@/lib/notifications'
import type { ApproachType, InsightsResponse } from '@gash/types'

const client = createApiClient({
  serverUrl: SERVER_URL,
  getHeaders: getAuthHeaders,
  onAuthError: handleAuthError,
})

const INSIGHT_FALLBACK = 'המשך לתעד גישות כדי לקבל תובנות מ-AI'

/** השרת לעיתים מחזיר רק `{ weeklyMission }` (ניתוח אחרון מתחת ל־24 שעות); המטמון הישן שמר לפעמים רק מערך — מתאימים תמיד ל־InsightsResponse */
function normalizeInsightsResponse(raw: unknown): InsightsResponse {
  const emptyMission = {
    title: '',
    description: '',
    target: 0,
    targetType: '',
  }
  const base: InsightsResponse = {
    insights: [INSIGHT_FALLBACK, '', ''],
    weeklyMission: emptyMission,
    trend: 'יציב',
    trendExplanation: '',
  }

  if (raw == null) {
    return base
  }

  if (Array.isArray(raw)) {
    return {
      ...base,
      insights: [
        String(raw[0] ?? INSIGHT_FALLBACK),
        String(raw[1] ?? ''),
        String(raw[2] ?? ''),
      ],
    }
  }

  if (typeof raw !== 'object') {
    return base
  }

  const r = raw as Record<string, unknown>
  const ins = r.insights
  let triple: [string, string, string] = [...base.insights]
  if (Array.isArray(ins)) {
    triple = [
      String(ins[0] ?? INSIGHT_FALLBACK),
      String(ins[1] ?? ''),
      String(ins[2] ?? ''),
    ]
  }

  let weeklyMission = emptyMission
  const wm = r.weeklyMission
  if (wm && typeof wm === 'object') {
    const m = wm as Record<string, unknown>
    const t = m.target
    weeklyMission = {
      title: String(m.title ?? ''),
      description: String(m.description ?? ''),
      target:
        typeof t === 'number' && !Number.isNaN(t)
          ? t
          : Number(t) || 0,
      targetType: String(m.targetType ?? ''),
    }
  }

  const tr = r.trend
  const trend: InsightsResponse['trend'] =
    tr === 'עולה' || tr === 'יורד' || tr === 'יציב' ? tr : 'יציב'

  return {
    insights: triple,
    weeklyMission,
    trend,
    trendExplanation: typeof r.trendExplanation === 'string' ? r.trendExplanation : '',
  }
}

interface StatsStore {
  streak: number
  totalApproaches: number
  successRate: number
  avgChemistry: number
  topApproachType: ApproachType | null
  isLoadingInsights: boolean
  fetchInsights: () => Promise<InsightsResponse>
  fetchCurrentStreak: () => Promise<number>
  incrementStreak: () => Promise<{ streak: number; message: string }>
  computeStats: () => void
  setStats: (stats: Partial<Pick<StatsStore, 'streak' | 'totalApproaches' | 'successRate' | 'avgChemistry' | 'topApproachType'>>) => void
}

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => {
      // Subscribe to log store changes and recompute stats
      const unsubscribe = useLogStore.subscribe((state) => {
        get().computeStats()
      })

      // Note: Unsubscribe is called automatically when store is destroyed
      // but we keep the reference for clarity
      ;(unsubscribe)

      return {
        streak: 0,
        totalApproaches: 0,
        successRate: 0,
        avgChemistry: 0,
        topApproachType: null,
        isLoadingInsights: false,

        computeStats: () => {
          const approaches = useLogStore.getState().approaches
          const total = approaches.length

          // Total approaches
          const totalApproaches = total

          // Success rate: (positive + neutral) / total * 100
          const successCount = approaches.filter(
            (a) => a.response === 'positive' || a.response === 'neutral'
          ).length
          const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0

          // Average chemistry score
          const avgChemistry =
            total > 0
              ? Math.round(
                  (approaches.reduce((sum, a) => sum + (a.chemistry_score ?? 0), 0) / total) *
                    10
                ) / 10
              : 0

          // Best approach type by count
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

          set({
            totalApproaches,
            successRate,
            avgChemistry,
            topApproachType: topApproachType as ApproachType | null,
          })
        },

        fetchInsights: async (): Promise<InsightsResponse> => {
          set({ isLoadingInsights: true })
          try {
            // Check cache first (stale-while-revalidate pattern)
            const cachedWithMeta = await cache.getWithMetadata<unknown>('insights')

            if (cachedWithMeta.data != null && !cachedWithMeta.isExpired) {
              set({ isLoadingInsights: false })
              return normalizeInsightsResponse(cachedWithMeta.data)
            }

            // Fetch fresh from server (תגובה חלקית אפשרית — ראה route GET /api/insights)
            const response = await client.insights.get()
            const normalized = normalizeInsightsResponse(response)

            await cache.set('insights', normalized, CACHE_PRESETS.LONG)

            set({ isLoadingInsights: false })
            return normalized
          } catch (err) {
            console.error('Failed to fetch insights:', err)
            set({ isLoadingInsights: false })

            const cachedWithMeta = await cache.getWithMetadata<unknown>('insights')
            if (cachedWithMeta.data != null) {
              console.warn('Returning stale cached insights due to fetch error')
              return normalizeInsightsResponse(cachedWithMeta.data)
            }

            return normalizeInsightsResponse(null)
          }
        },

        fetchCurrentStreak: async () => {
          try {
            const response = await fetch(`${SERVER_URL}/api/user/streak`, {
              method: 'GET',
              headers: await getAuthHeaders(),
            })

            if (!response.ok) {
              throw new Error(`Failed to fetch streak: ${response.status}`)
            }

            const data = (await response.json()) as { streak: number }
            const streak = Number(data.streak) || 0
            set({ streak })
            return streak
          } catch (err) {
            console.error('Failed to fetch current streak:', err)
            return get().streak
          }
        },

        incrementStreak: async () => {
          try {
            const response = await fetch(`${SERVER_URL}/api/user/streak`, {
              method: 'POST',
              headers: await getAuthHeaders(),
              body: JSON.stringify({ action: 'increment' }),
            })
            if (!response.ok) {
              throw new Error(`Failed to increment streak: ${response.status}`)
            }
            const data = (await response.json()) as { streak: number; message: string }
            set({ streak: data.streak })
            // Trigger notification for milestone streaks (7, 14, 21, etc.)
            if (data.streak > 0 && data.streak % 7 === 0) {
              sendLocalNotification(`🔥 רצף שבועי!`, `${data.streak} ימים רצופים — כל הכבוד!`)
            }
            return data
          } catch (err) {
            console.error('Failed to increment streak:', err)
            return { streak: 0, message: 'Error' }
          }
        },

        setStats: (stats) => set(stats),
      }
    },
    {
      name: 'gash-stats',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        streak: state.streak,
        totalApproaches: state.totalApproaches,
        successRate: state.successRate,
        avgChemistry: state.avgChemistry,
        topApproachType: state.topApproachType,
      }),
    }
  )
)
