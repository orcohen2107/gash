import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createApiClient } from '@gash/api-client'
import { SERVER_URL, getAuthHeaders } from '@/lib/server'
import type { ChatMessage } from '@gash/types'

const client = createApiClient({ serverUrl: SERVER_URL, getHeaders: getAuthHeaders })

interface ChatStore {
  messages: ChatMessage[]
  loading: boolean
  sendMessage: (text: string) => Promise<void>
  loadHistory: () => Promise<void>
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      loading: false,
      sendMessage: async (text: string) => {
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          user_id: '',
          role: 'user',
          content: text,
          created_at: new Date().toISOString(),
        }

        set((state) => ({
          messages: [...state.messages, userMessage],
          loading: true,
        }))

        const { messages } = get()
        const result = await client.coach.send({
          type: 'coach',
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        })

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          user_id: '',
          role: 'assistant',
          content: result.text,
          created_at: new Date().toISOString(),
        }

        set((state) => ({
          messages: [...state.messages, assistantMessage],
          loading: false,
        }))
      },
      loadHistory: async () => {
        // History is kept in local persist — server-side history fetched on demand
      },
    }),
    {
      name: 'gash-chat',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ messages: state.messages }),
    }
  )
)
