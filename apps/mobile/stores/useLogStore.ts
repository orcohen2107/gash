import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Toast from 'react-native-toast-message'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createApiClient } from '@gash/api-client'
import { SERVER_URL, getAuthHeaders, handleAuthError } from '@/lib/server'
import { supabase } from '@/lib/supabase'
import type { Approach } from '@gash/types'

/** מנוי Realtime יחיד — מספר מסכים קוראים ל-subscribeToChanges; אסור לפתוח שני .on() על אותו ערוץ אחרי subscribe */
let approachesRealtimeChannel: RealtimeChannel | null = null
let approachesRealtimeRefCount = 0

const client = createApiClient({
  serverUrl: SERVER_URL,
  getHeaders: getAuthHeaders,
  onAuthError: handleAuthError,
})

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // ms

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (i < retries - 1) {
        const delay = RETRY_DELAY * Math.pow(2, i)
        await sleep(delay)
      }
    }
  }
  throw lastError
}

interface LogStore {
  approaches: Approach[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  nextCursor: string | null
  /** מילוי טופס תיעוד לעריכה — לא נשמר ב-persist */
  pendingEditApproach: Approach | null
  setPendingEditApproach: (approach: Approach | null) => void
  loadApproaches: () => Promise<void>
  loadMoreApproaches: () => Promise<void>
  addApproach: (approach: Omit<Approach, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  updateApproach: (id: string, updates: Partial<Approach>) => Promise<void>
  deleteApproach: (id: string) => Promise<void>
  showFeedback: (feedback: string | null) => void
  subscribeToChanges: () => () => void
}

export const useLogStore = create<LogStore>()(
  persist(
    (set, get) => ({
      approaches: [],
      loading: false,
      loadingMore: false,
      hasMore: false,
      nextCursor: null,
      pendingEditApproach: null,
      setPendingEditApproach: (approach) => set({ pendingEditApproach: approach }),

      loadApproaches: async () => {
        set({ loading: true })
        try {
          const { approaches, nextCursor, hasMore } = await client.approaches.list({ limit: 50 })
          set({
            approaches,
            loading: false,
            nextCursor: nextCursor ?? null,
            hasMore: hasMore ?? false,
          })
        } catch (err) {
          console.error('Failed to load approaches:', err)
          set({ loading: false })
        }
      },

      loadMoreApproaches: async () => {
        const { hasMore, nextCursor, loadingMore } = get()
        if (!hasMore || !nextCursor || loadingMore) return

        set({ loadingMore: true })
        try {
          const result = await client.approaches.list({ cursor: nextCursor, limit: 50 })
          set((state) => {
            const existingIds = new Set(state.approaches.map((approach) => approach.id))
            const nextApproaches = result.approaches.filter(
              (approach) => !existingIds.has(approach.id)
            )

            return {
              approaches: [...state.approaches, ...nextApproaches],
              loadingMore: false,
              nextCursor: result.nextCursor ?? null,
              hasMore: result.hasMore ?? false,
            }
          })
        } catch (err) {
          console.error('Failed to load more approaches:', err)
          set({ loadingMore: false })
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
          // Call server with retry logic
          const { id, feedback } = await withRetry(() => client.approaches.create(approach))

          // Replace temp ID with real ID
          set((state) => ({
            approaches: state.approaches.map((a) => (a.id === tempId ? { ...a, id } : a)),
          }))

          // Show AI feedback if available, otherwise simple success message
          if (feedback) {
            get().showFeedback(feedback)
          } else {
            Toast.show({ type: 'success', text1: 'הגישה נשמרה בהצלחה' })
          }

          // Increment streak after successful approach creation (don't show separate toast)
          try {
            const { useStatsStore } = await import('./useStatsStore')
            await useStatsStore.getState().incrementStreak()
          } catch (err) {
            console.error('Failed to increment streak:', err)
          }
        } catch (err) {
          console.error('Failed to add approach:', err)
          // Remove from array on error
          set((state) => ({
            approaches: state.approaches.filter((a) => a.id !== tempId),
          }))
          throw err
        }
      },

      updateApproach: async (id, updates) => {
        // Store original state for rollback
        const original = get().approaches.find((a) => a.id === id)

        // Optimistic update: update local array immediately
        set((state) => ({
          approaches: state.approaches.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }))

        try {
          // Call server with retry logic
          await withRetry(() => client.approaches.update(id, updates))
        } catch (err) {
          console.error('Failed to update approach:', err)
          // Restore original state on error
          if (original) {
            set((state) => ({
              approaches: state.approaches.map((a) =>
                a.id === id ? original : a
              ),
            }))
          }
          Toast.show({
            type: 'error',
            text1: 'בעיה בעדכון',
            text2: 'בדוק את החיבור שלך ונסה שוב',
          })
        }
      },

      deleteApproach: async (id) => {
        // Store original approach for rollback
        const original = get().approaches.find((a) => a.id === id)

        // Optimistic delete: remove from array immediately
        set((state) => ({
          approaches: state.approaches.filter((a) => a.id !== id),
        }))

        try {
          // Call server with retry logic
          await withRetry(() => client.approaches.delete(id))
        } catch (err) {
          console.error('Failed to delete approach:', err)
          // Restore approach on error
          if (original) {
            set((state) => ({
              approaches: [...state.approaches, original].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              ),
            }))
          }
          Toast.show({
            type: 'error',
            text1: 'בעיה במחיקה',
            text2: 'בדוק את החיבור שלך ונסה שוב',
          })
        }
      },

      showFeedback: (feedback) => {
        Toast.show({
          type: 'success',
          text1: feedback ?? undefined,
        })
      },

      subscribeToChanges: () => {
        approachesRealtimeRefCount += 1
        if (approachesRealtimeRefCount === 1 && !approachesRealtimeChannel) {
          approachesRealtimeChannel = supabase
            .channel('approaches-log-store')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'approaches',
              },
              () => {
                void get().loadApproaches()
              }
            )
            .subscribe()
        }

        return () => {
          approachesRealtimeRefCount -= 1
          if (approachesRealtimeRefCount <= 0 && approachesRealtimeChannel) {
            void supabase.removeChannel(approachesRealtimeChannel)
            approachesRealtimeChannel = null
            approachesRealtimeRefCount = 0
          }
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
