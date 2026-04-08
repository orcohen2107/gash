import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface SettingsStore {
  rtlInitialized: boolean
  setRtlInitialized: (value: boolean) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      rtlInitialized: false,
      setRtlInitialized: (value) => set({ rtlInitialized: value }),
    }),
    {
      name: 'gash-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ rtlInitialized: state.rtlInitialized }),
    }
  )
)
