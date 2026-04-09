import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Toast from 'react-native-toast-message'
import { createApiClient } from '@gash/api-client'
import { SERVER_URL, getAuthHeaders } from '@/lib/server'
import type { Approach } from '@gash/types'

const client = createApiClient({ serverUrl: SERVER_URL, getHeaders: getAuthHeaders })

interface LogStore {
  approaches: Approach[]
  loading: boolean
  fetchApproaches: () => Promise<void>
  addApproach: (approach: Omit<Approach, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  editApproach: (id: string, updates: Partial<Approach>) => Promise<void>
  deleteApproach: (id: string) => Promise<void>
}

export const useLogStore = create<LogStore>()(
  persist(
    (set) => ({
      approaches: [],
      loading: false,
      fetchApproaches: async () => {
        set({ loading: true })
        const { approaches } = await client.approaches.list()
        set({ approaches, loading: false })
      },
      addApproach: async (approach) => {
        try {
          const { approach: created } = await client.approaches.create(approach)
          set((state) => ({ approaches: [created, ...state.approaches] }))

          // Increment streak after successful approach creation
          try {
            const { useStatsStore } = await import('./useStatsStore')
            const streakResult = await useStatsStore.getState().incrementStreak()
            Toast.show({
              type: 'success',
              text1: streakResult.message,
            })
          } catch (err) {
            console.error('Failed to increment streak:', err)
          }
        } catch (err) {
          console.error('Failed to add approach:', err)
          throw err
        }
      },
      editApproach: async (id, updates) => {
        const { approach: updated } = await client.approaches.update(id, updates)
        set((state) => ({
          approaches: state.approaches.map((a) => (a.id === id ? updated : a)),
        }))
      },
      deleteApproach: async (id) => {
        await client.approaches.remove(id)
        set((state) => ({
          approaches: state.approaches.filter((a) => a.id !== id),
        }))
      },
    }),
    {
      name: 'gash-log',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ approaches: state.approaches }),
    }
  )
)
