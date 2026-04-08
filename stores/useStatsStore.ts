import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ApproachType } from '@/types'

interface StatsStore {
  streak: number
  totalApproaches: number
  avgChemistry: number
  topApproachType: ApproachType | null
  setStats: (stats: Partial<Pick<StatsStore, 'streak' | 'totalApproaches' | 'avgChemistry' | 'topApproachType'>>) => void
}

export const useStatsStore = create<StatsStore>()(
  persist(
    (set) => ({
      streak: 0,
      totalApproaches: 0,
      avgChemistry: 0,
      topApproachType: null,
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
