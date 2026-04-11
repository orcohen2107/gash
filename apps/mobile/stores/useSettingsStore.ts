import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface SettingsStore {
  rtlInitialized: boolean
  setRtlInitialized: (value: boolean) => void
  /** העדפות התראות (שמירה מקומית; אינטגרציה מלאה עם פוש — בהמשך) */
  aiTipsNotifications: boolean
  setAiTipsNotifications: (value: boolean) => void
  reminderNotifications: boolean
  setReminderNotifications: (value: boolean) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      rtlInitialized: false,
      setRtlInitialized: (value) => set({ rtlInitialized: value }),
      aiTipsNotifications: true,
      setAiTipsNotifications: (value) => set({ aiTipsNotifications: value }),
      reminderNotifications: false,
      setReminderNotifications: (value) => set({ reminderNotifications: value }),
    }),
    {
      name: 'gash-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        rtlInitialized: state.rtlInitialized,
        aiTipsNotifications: state.aiTipsNotifications,
        reminderNotifications: state.reminderNotifications,
      }),
    }
  )
)
