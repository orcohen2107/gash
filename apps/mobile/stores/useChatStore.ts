import { create } from 'zustand'
import Toast from 'react-native-toast-message'
import { createApiClient } from '@gash/api-client'
import { SERVER_URL, getAuthHeaders, handleAuthError } from '@/lib/server'
import type { ChatMessage } from '@gash/types'

const client = createApiClient({
  serverUrl: SERVER_URL,
  getHeaders: getAuthHeaders,
  onAuthError: handleAuthError,
})

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // ms

interface ChatStore {
  messages: ChatMessage[]
  loading: boolean
  loadingMore: boolean
  hasMoreHistory: boolean
  historyCursor: string | null
  loadHistory: () => Promise<void>
  loadOlderHistory: () => Promise<void>
  clearHistory: () => Promise<void>
  sendMessage: (text: string) => Promise<void>
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  messages: [],
  loading: false,
  loadingMore: false,
  hasMoreHistory: false,
  historyCursor: null,

  loadHistory: async () => {
    set({ loading: true })
    try {
      const { messages, nextCursor, hasMore } = await client.coach.history({ limit: 50 })
      set({
        messages,
        loading: false,
        historyCursor: nextCursor ?? null,
        hasMoreHistory: hasMore ?? false,
      })
    } catch {
      set({ loading: false })
      Toast.show({ type: 'error', text1: 'בעיה בטעינה', text2: 'לא הצלחנו לטעון את ההיסטוריה' })
    }
  },

  loadOlderHistory: async () => {
    const { historyCursor, hasMoreHistory, loadingMore } = get()
    if (!historyCursor || !hasMoreHistory || loadingMore) return

    set({ loadingMore: true })
    try {
      const { messages, nextCursor, hasMore } = await client.coach.history({
        before: historyCursor,
        limit: 50,
      })
      set((state) => {
        const existingIds = new Set(state.messages.map((message) => message.id))
        const olderMessages = messages.filter((message) => !existingIds.has(message.id))

        return {
          messages: [...olderMessages, ...state.messages],
          loadingMore: false,
          historyCursor: nextCursor ?? null,
          hasMoreHistory: hasMore ?? false,
        }
      })
    } catch {
      set({ loadingMore: false })
      Toast.show({ type: 'error', text1: 'בעיה בטעינה', text2: 'לא הצלחנו לטעון הודעות ישנות' })
    }
  },

  clearHistory: async () => {
    set({ loading: true })
    try {
      await client.coach.clearHistory()
      set({
        messages: [],
        loading: false,
        loadingMore: false,
        historyCursor: null,
        hasMoreHistory: false,
      })
      Toast.show({ type: 'success', text1: 'ההיסטוריה נמחקה' })
    } catch {
      set({ loading: false })
      Toast.show({ type: 'error', text1: 'בעיה במחיקה', text2: 'לא הצלחנו למחוק את ההיסטוריה' })
    }
  },

  sendMessage: async (text: string) => {
    if (!text.trim()) return

    const userMessageId = `user-${Date.now()}`
    const userMessage: ChatMessage = {
      id: userMessageId,
      user_id: '',
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString(),
    }

    set((state) => ({ messages: [...state.messages, userMessage], loading: true }))

    let retries = 0
    while (retries < MAX_RETRIES) {
      try {
        const { messages } = get()
        const result = await client.coach.send({
          type: 'coach',
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        })

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          user_id: '',
          role: 'assistant',
          content: result.text,
          created_at: new Date().toISOString(),
        }

        set((state) => ({ messages: [...state.messages, assistantMessage], loading: false }))
        return
      } catch (err) {
        retries++
        if (retries >= MAX_RETRIES) {
          // Remove user message on final failure
          set((state) => ({
            messages: state.messages.filter((m) => m.id !== userMessageId),
            loading: false,
          }))
          Toast.show({
            type: 'error',
            text1: 'בעיה בשליחה',
            text2: 'בדוק את החיבור שלך ונסה שוב',
          })
          return
        }
        // Wait before retry with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries - 1)))
      }
    }
  },
}))
