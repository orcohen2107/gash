import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createApiClient } from '@gash/api-client'
import { SERVER_URL, getAuthHeaders } from '@/lib/server'
import { useLogStore } from './useLogStore'
import { sendLocalNotification } from '@/lib/notifications'
import type { ApproachType, InsightsResponse } from '@gash/types'

const client = createApiClient({ serverUrl: SERVER_URL, getHeaders: getAuthHeaders })

interface StatsStore {
  streak: number
  totalApproaches: number
  successRate: number
  avgChemistry: number
  topApproachType: ApproachType | null
  fetchInsights: () => Promise<InsightsResponse>
  incrementStreak: () => Promise<{ streak: number; message: string }>
  computeStats: () => void
  setStats: (stats: Partial<Pick<StatsStore, 'streak' | 'totalApproaches' | 'successRate' | 'avgChemistry' | 'topApproachType'>>) => void
}

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => {
      // Subscribe to log store changes and recompute stats
      useLogStore.subscribe((state) => {
        get().computeStats()
      })

      return {
        streak: 0,
        totalApproaches: 0,
        successRate: 0,
        avgChemistry: 0,
        topApproachType: null,

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
          const topApproachType =
            Object.keys(typeCounts).reduce((best, type) =>
              (typeCounts[type] ?? 0) > (typeCounts[best] ?? 0) ? type : best
            ) || null

          set({
            totalApproaches,
            successRate,
            avgChemistry,
            topApproachType: topApproachType as ApproachType | null,
          })
        },

        fetchInsights: async (): Promise<InsightsResponse> => {
          try {
            const response = await client.insights.get()
            return response.insights
          } catch (err) {
            console.error('Failed to fetch insights:', err)
            return {
              insights: ['המשך לתעד גישות כדי לקבל תובנות מ-AI', '', ''],
              weeklyMission: { title: '', description: '', target: 0, targetType: '' },
              trend: 'יציב',
              trendExplanation: '',
            }
          }
        },

        incrementStreak: async () => {
          try {
            const response = await fetch(`${SERVER_URL}/api/user/streak`, {
              method: 'POST',
              headers: await getAuthHeaders(),
              body: JSON.stringify({ action: 'increment' }),
            })
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
