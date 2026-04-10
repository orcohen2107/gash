import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@gash/types'

interface AuthStore {
  user: User | null
  session: Session | null
  loading: boolean
  userProfile: UserProfile | null
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setUserProfile: (profile: UserProfile | null) => void
  signOut: () => Promise<void>
}

// NO persist — Supabase manages JWT in expo-secure-store via ExpoSecureStoreAdapter
export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  session: null,
  loading: true,
  userProfile: null,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
    }),
  setLoading: (loading) => set({ loading }),
  setUserProfile: (userProfile) => set({ userProfile }),
  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, userProfile: null })
  },
}))
