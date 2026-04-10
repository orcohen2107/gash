import { create } from 'zustand'

/** טאבים שאינם אזור אישי — לאן לחזור מפרופיל כשלא נשמר מסלול מפורש */
export type MainTab = 'tips' | 'dashboard' | 'log' | 'journal' | 'coach'

const MAIN: readonly MainTab[] = ['tips', 'dashboard', 'log', 'journal', 'coach']

export function isMainTab(name: string): name is MainTab {
  return (MAIN as readonly string[]).includes(name)
}

interface TabHistoryState {
  lastNonProfile: MainTab
  setLastNonProfile: (t: MainTab) => void
}

export const useTabHistoryStore = create<TabHistoryState>((set) => ({
  lastNonProfile: 'tips',
  setLastNonProfile: (t) => set({ lastNonProfile: t }),
}))
