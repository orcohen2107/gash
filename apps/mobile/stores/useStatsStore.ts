import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createApiClient } from '@gash/api-client'
import { SERVER_URL, getAuthHeaders } from '@/lib/server'
import type { ApproachType } from '@gash/types'

const client = createApiClient({ serverUrl: SERVER_URL, getHeaders: getAuthHeaders })

interface StatsStore {
  streak: number
  totalApproaches: number
  avgChemistry: number
  topApproachType: ApproachType | null
  fetchInsights: () => Promise<void>
  incrementStreak: () => Promise<{ streak: number; message: string }>
  setStats: (stats: Partial<Pick<StatsStore, 'streak' | 'totalApproaches' | 'avgChemistry' | 'topApproachType'>>) => void
}

export const useStatsStore = create<StatsStore>()(
  persist(
    (set) => ({
      streak: 0,
      totalApproaches: 0,
      avgChemistry: 0,
      topApproachType: null,
      fetchInsights: async () => {
        const { insights } = await client.insights.get()
        set({
          streak: 0,
          totalApproaches: 0,
          avgChemistry: 0,
          topApproachType: null,
        })
        void insights
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
          return data
        } catch (err) {
          console.error('Failed to increment streak:', err)
          return { streak: 0, message: 'Error' }
        }
      },
      setStats: (stats) => set(stats),
    }),
    {
      name: 'gash-stats',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        streak: state.streak,
        totalApproaches: state.totalApproaches,
        avgChemistry: state.avgChemistry,
        topApproachType: state.topApproachType,
      }),
    }
  )
)
