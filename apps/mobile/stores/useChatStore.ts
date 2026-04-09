import { create } from 'zustand'
import Toast from 'react-native-toast-message'
import { createApiClient } from '@gash/api-client'
import { SERVER_URL, getAuthHeaders } from '@/lib/server'
import type { ChatMessage } from '@gash/types'

const client = createApiClient({ serverUrl: SERVER_URL, getHeaders: getAuthHeaders })

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

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      user_id: '',
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString(),
    }

    set((state) => ({ messages: [...state.messages, userMessage], loading: true }))

    try {
      const { messages } = get()
      const result = await client.coach.send({
        type: 'coach',
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      })

      const assistantMessage: ChatMessage = {
        id: `temp-${Date.now() + 1}`,
        user_id: '',
        role: 'assistant',
        content: result.text,
        created_at: new Date().toISOString(),
      }

      set((state) => ({ messages: [...state.messages, assistantMessage], loading: false }))
    } catch {
      set({ loading: false })
      Toast.show({ type: 'error', text1: 'בעיה בשליחה', text2: 'לא הצלחנו לשלוח את ההודעה' })
    }
  },
}))
