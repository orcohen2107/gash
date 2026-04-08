import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'

interface AuthStore {
  user: User | null
  session: Session | null
  setSession: (session: Session | null) => void
}

// NO persist — Supabase manages JWT in expo-secure-store
export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  session: null,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
    }),
}))
