# Skill: Zustand Store Pattern (Gash)

איך לבנות stores נכון — persist, async actions, ושילוב עם Supabase.

## Store בסיסי עם persist

```ts
// stores/useLogStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/lib/supabase'
import type { Approach } from '@/types'

interface LogStore {
  approaches: Approach[]
  loading: boolean

  // actions
  fetchApproaches: () => Promise<void>
  addApproach: (approach: Omit<Approach, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  editApproach: (id: string, updates: Partial<Approach>) => Promise<void>
  deleteApproach: (id: string) => Promise<void>
}

export const useLogStore = create<LogStore>()(
  persist(
    (set, get) => ({
      approaches: [],
      loading: false,

      fetchApproaches: async () => {
        set({ loading: true })
        const { data } = await supabase
          .from('approaches')
          .select('*')
          .order('date', { ascending: false })
        set({ approaches: data ?? [], loading: false })
      },

      addApproach: async (approach) => {
        // Optimistic update
        const temp = { ...approach, id: 'temp-' + Date.now() } as Approach
        set(s => ({ approaches: [temp, ...s.approaches] }))

        // Real insert
        const { data } = await supabase
          .from('approaches')
          .insert(approach)
          .select()
          .single()

        if (data) {
          set(s => ({
            approaches: s.approaches.map(a => a.id === temp.id ? data : a)
          }))
        }
      },

      editApproach: async (id, updates) => {
        set(s => ({
          approaches: s.approaches.map(a => a.id === id ? { ...a, ...updates } : a)
        }))
        await supabase.from('approaches').update(updates).eq('id', id)
      },

      deleteApproach: async (id) => {
        set(s => ({ approaches: s.approaches.filter(a => a.id !== id) }))
        await supabase.from('approaches').delete().eq('id', id)
      },
    }),
    {
      name: 'gash-log',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ approaches: state.approaches }),
    }
  )
)
```

## כללים
- `partialize` — שמור רק data, לא loading/functions
- Optimistic updates — עדכן UI קודם, insert/update אחרי
- `fetchApproaches()` — קרא ב-`useEffect` של המסך, לא ב-store init
- לא לשמור auth tokens ב-AsyncStorage — רק ב-`expo-secure-store`

## Auth Store — חריג

```ts
// stores/useAuthStore.ts — בלי persist (session managed by Supabase)
export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  session: null,
  setSession: (session) => set({
    session,
    user: session?.user ?? null,
  }),
}))
```

## שימוש ב-component

```tsx
function JournalScreen() {
  const { approaches, loading, fetchApproaches } = useLogStore()

  useEffect(() => { fetchApproaches() }, [])

  if (loading) return <LoadingSkeleton />
  return <FlatList data={approaches} ... />
}
```
