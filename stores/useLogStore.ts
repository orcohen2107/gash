import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Approach } from '@/types'

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
        // Phase 3: implement Supabase fetch
        console.log('fetchApproaches stub — implement in Phase 3')
      },
      addApproach: async (_approach) => {
        // Phase 3: implement Supabase insert
        console.log('addApproach stub — implement in Phase 3')
      },
      editApproach: async (_id, _updates) => {
        // Phase 3: implement Supabase update
        console.log('editApproach stub — implement in Phase 3')
      },
      deleteApproach: async (_id) => {
        // Phase 3: implement Supabase delete
        console.log('deleteApproach stub — implement in Phase 3')
      },
    }),
    {
      name: 'gash-log',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ approaches: state.approaches }),
    }
  )
)
