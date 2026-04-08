import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ChatMessage } from '@/types'

interface ChatStore {
  messages: ChatMessage[]
  loading: boolean
  sendMessage: (text: string) => Promise<void>
  loadHistory: () => Promise<void>
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      loading: false,
      sendMessage: async (_text: string) => {
        // Phase 2: implement Supabase + Edge Function call
        console.log('sendMessage stub — implement in Phase 2')
      },
      loadHistory: async () => {
        // Phase 2: implement Supabase fetch
        console.log('loadHistory stub — implement in Phase 2')
      },
    }),
    {
      name: 'gash-chat',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ messages: state.messages }),
    }
  )
)
