import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Toast from 'react-native-toast-message'
import { createApiClient } from '@gash/api-client'
import { SERVER_URL, getAuthHeaders } from '@/lib/server'
import { supabase } from '@/lib/supabase'
import type { Approach } from '@gash/types'

const client = createApiClient({ serverUrl: SERVER_URL, getHeaders: getAuthHeaders })

interface LogStore {
  approaches: Approach[]
  loading: boolean
  loadApproaches: () => Promise<void>
  addApproach: (approach: Omit<Approach, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  updateApproach: (id: string, updates: Partial<Approach>) => Promise<void>
  deleteApproach: (id: string) => Promise<void>
  showFeedback: (feedback: string) => void
  subscribeToChanges: () => () => void
}

export const useLogStore = create<LogStore>()(
  persist(
    (set, get) => ({
      approaches: [],
      loading: false,

      loadApproaches: async () => {
        set({ loading: true })
        try {
          const { approaches } = await client.approaches.list()
          set({ approaches, loading: false })
        } catch (err) {
          console.error('Failed to load approaches:', err)
          set({ loading: false })
        }
      },

      addApproach: async (approach) => {
        // Generate temp ID for optimistic update
        const tempId = `temp-${Date.now()}`
        const tempApproach: Approach = {
          ...approach,
          id: tempId,
          user_id: '', // Will be set by server
          created_at: new Date().toISOString(),
        }

        // Optimistic update: add to local array immediately
        set((state) => ({ approaches: [tempApproach, ...state.approaches] }))

        try {
          // Call server in background
          const { id, feedback } = await client.approaches.create(approach)

          // Replace temp ID with real ID
          set((state) => ({
            approaches: state.approaches.map((a) => (a.id === tempId ? { ...a, id } : a)),
          }))

          // Show AI feedback
          get().showFeedback(feedback)
        } catch (err) {
          console.error('Failed to add approach:', err)
          // Remove from array on error
          set((state) => ({
            approaches: state.approaches.filter((a) => a.id !== tempId),
          }))
          Toast.show({
            type: 'error',
            text1: 'בעיה בשמירה',
            text2: 'נסה שוב',
          })
        }
      },

      updateApproach: async (id, updates) => {
        // Optimistic update: update local array immediately
        set((state) => ({
          approaches: state.approaches.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }))

        try {
          // Call server in background
          await client.approaches.update(id, updates)
        } catch (err) {
          console.error('Failed to update approach:', err)
          // Reload from server on error to revert changes
          await get().loadApproaches()
          Toast.show({
            type: 'error',
            text1: 'בעיה בעדכון',
            text2: 'נסה שוב',
          })
        }
      },

      deleteApproach: async (id) => {
        // Optimistic delete: remove from array immediately
        set((state) => ({
          approaches: state.approaches.filter((a) => a.id !== id),
        }))

        try {
          // Call server in background
          await client.approaches.delete(id)
        } catch (err) {
          console.error('Failed to delete approach:', err)
          // Reload from server on error to restore entry
          await get().loadApproaches()
          Toast.show({
            type: 'error',
            text1: 'בעיה במחיקה',
            text2: 'נסה שוב',
          })
        }
      },

      showFeedback: (feedback) => {
        Toast.show({
          type: 'success',
          text1: feedback,
        })
      },

      subscribeToChanges: () => {
        const channel = supabase
          .channel('approaches')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'approaches',
            },
            () => {
              // Reload approaches on any change
              get().loadApproaches()
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      },
    }),
    {
      name: 'gash-log',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ approaches: state.approaches }),
    }
  )
)
