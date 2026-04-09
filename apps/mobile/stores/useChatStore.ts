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
  loadHistory: () => Promise<void>
  sendMessage: (text: string) => Promise<void>
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  messages: [],
  loading: false,

  loadHistory: async () => {
    set({ loading: true })
    try {
      const { messages } = await client.coach.history()
      set({ messages, loading: false })
    } catch {
      set({ loading: false })
      Toast.show({ type: 'error', text1: 'בעיה בטעינה', text2: 'לא הצלחנו לטעון את ההיסטוריה' })
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
