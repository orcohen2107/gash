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
